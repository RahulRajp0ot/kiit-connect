package com.kiit.dating.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kiit.dating.dto.SpeedChatAdminSessionDTO;
import com.kiit.dating.dto.SpeedChatMatchResponse;
import com.kiit.dating.dto.SpeedChatMessageDTO;
import com.kiit.dating.entity.AppSettings;
import com.kiit.dating.entity.SpeedChatMessage;
import com.kiit.dating.entity.SpeedChatSession;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.SpeedChatMessageRepository;
import com.kiit.dating.repository.SpeedChatSessionRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpeedChatService {

    private final SpeedChatSessionRepository sessionRepository;
    private final SpeedChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AdminSettingsService adminSettingsService;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${server.port:8088}")
    private String serverPort;

    @Data
    @AllArgsConstructor
    private static class WaitingUser {
        private Long userId;
        private String tempName;
        private int age;
        private long joinedAt;
    }

    private final ConcurrentLinkedQueue<WaitingUser> waitingQueue = new ConcurrentLinkedQueue<>();
    private final Map<Long, String> activeUserSessions = new ConcurrentHashMap<>();

    @Transactional
    public synchronized SpeedChatMatchResponse findMatch(User currentUser, String rawTempName, int rawAge) {
        // Check 1: User Verification / Approval Status
        if (currentUser.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            String statusStr = currentUser.getApprovalStatus() == User.ApprovalStatus.REJECTED ? "REJECTED" : "PENDING";
            String reason = currentUser.getRejectionReason() != null ? currentUser.getRejectionReason()
                    : "Profile details or photo do not meet campus verification guidelines.";
            return SpeedChatMatchResponse.builder()
                    .status(statusStr)
                    .message(currentUser.getApprovalStatus() == User.ApprovalStatus.REJECTED
                            ? "Profile rejected by admin: " + reason
                            : "Your campus profile is waiting for administrator review.")
                    .build();
        }

        // Check 2: Speed Connect Active Switch
        AppSettings settings = adminSettingsService.getSettings();
        if (!settings.isSpeedChatEnabled()) {
            return SpeedChatMatchResponse.builder()
                    .status("DISABLED")
                    .message(settings.getSpeedChatDisabledMessage() != null
                            ? settings.getSpeedChatDisabledMessage()
                            : "Speed Connect is temporarily paused by administrator.")
                    .build();
        }

        String tempName = (rawTempName == null || rawTempName.trim().isBlank()) ? "KIITian" : rawTempName.trim();
        int age = rawAge < 18 ? 18 : rawAge;

        // Check user's daily speed connect limit
        int limit = currentUser.getCustomDailySpeedChatLimit() != null && currentUser.getCustomDailySpeedChatLimit() > 0
                ? currentUser.getCustomDailySpeedChatLimit()
                : settings.getDefaultDailySpeedChatLimit();
        if (limit <= 0) limit = 100;

        long used = sessionRepository.countSessionsForUserSince(currentUser.getId(), LocalDateTime.now().minusHours(24));
        if (used >= limit) {
            log.warn("User {} exceeded daily speed connect limit ({}/{})", currentUser.getEmail(), used, limit);
            return SpeedChatMatchResponse.builder()
                    .status("LIMIT_EXCEEDED")
                    .message("Ur daily speed connect limit exceed")
                    .build();
        }

        // Clean up any ongoing active sessions for this user
        closeActiveSessionsForUser(currentUser);

        // Remove user from waiting queue if already waiting
        cancelWaiting(currentUser.getId());

        // Find a partner in the waiting queue
        long now = System.currentTimeMillis();
        WaitingUser partner = null;

        while (!waitingQueue.isEmpty()) {
            WaitingUser candidate = waitingQueue.poll();
            if (candidate == null) break;
            // Ignore if candidate is same user or waited > 10 minutes (stale)
            if (candidate.getUserId().equals(currentUser.getId())) continue;
            if (now - candidate.getJoinedAt() > 10 * 60 * 1000) continue;

            Optional<User> partnerUserOpt = userRepository.findById(candidate.getUserId());
            if (partnerUserOpt.isPresent() && partnerUserOpt.get().isActive()) {
                partner = candidate;
                break;
            }
        }

        if (partner != null) {
            User partnerUser = userRepository.findById(partner.getUserId()).orElseThrow();
            String sessionUuid = UUID.randomUUID().toString();

            SpeedChatSession session = SpeedChatSession.builder()
                    .sessionUuid(sessionUuid)
                    .user1(partnerUser)
                    .user1TempName(partner.getTempName())
                    .user1Age(partner.getAge())
                    .user2(currentUser)
                    .user2TempName(tempName)
                    .user2Age(age)
                    .startedAt(LocalDateTime.now())
                    .status(SpeedChatSession.Status.ACTIVE)
                    .build();

            session = sessionRepository.save(session);
            activeUserSessions.put(partner.getUserId(), sessionUuid);
            activeUserSessions.put(currentUser.getId(), sessionUuid);

            // Notify partner via WebSocket
            SpeedChatMatchResponse partnerResponse = SpeedChatMatchResponse.builder()
                    .status("MATCHED")
                    .sessionUuid(sessionUuid)
                    .myTempName(partner.getTempName())
                    .myAge(partner.getAge())
                    .partnerTempName(tempName)
                    .partnerAge(age)
                    .partnerUserId(currentUser.getId())
                    .build();
            messagingTemplate.convertAndSend("/topic/speed-chat/user/" + partner.getUserId(), partnerResponse);

            log.info("SpeedChat match created: {} ({}) <-> {} ({}) [session: {}]",
                    currentUser.getEmail(), tempName, partnerUser.getEmail(), partner.getTempName(), sessionUuid);

            return SpeedChatMatchResponse.builder()
                    .status("MATCHED")
                    .sessionUuid(sessionUuid)
                    .myTempName(tempName)
                    .myAge(age)
                    .partnerTempName(partner.getTempName())
                    .partnerAge(partner.getAge())
                    .partnerUserId(partner.getUserId())
                    .build();
        }

        // No partner currently waiting -> put this user into waiting queue
        waitingQueue.add(new WaitingUser(currentUser.getId(), tempName, age, now));
        log.info("User {} ({}) added to SpeedChat waiting queue", currentUser.getEmail(), tempName);

        return SpeedChatMatchResponse.builder()
                .status("WAITING")
                .myTempName(tempName)
                .myAge(age)
                .build();
    }

    public Map<String, Object> getSpeedChatStatus(User currentUser) {
        AppSettings settings = adminSettingsService.getSettings();
        int limit = currentUser.getCustomDailySpeedChatLimit() != null && currentUser.getCustomDailySpeedChatLimit() > 0
                ? currentUser.getCustomDailySpeedChatLimit()
                : settings.getDefaultDailySpeedChatLimit();
        if (limit <= 0) limit = 100;

        long used = sessionRepository.countSessionsForUserSince(currentUser.getId(), LocalDateTime.now().minusHours(24));
        long remaining = Math.max(0, limit - used);

        Map<String, Object> map = new HashMap<>();
        map.put("approvalStatus", currentUser.getApprovalStatus() != null ? currentUser.getApprovalStatus().name() : "PENDING");
        map.put("isApproved", currentUser.getApprovalStatus() == User.ApprovalStatus.APPROVED);
        map.put("rejectionReason", currentUser.getRejectionReason());
        map.put("speedChatEnabled", settings.isSpeedChatEnabled());
        map.put("speedChatDisabledMessage", settings.getSpeedChatDisabledMessage());
        map.put("dailyLimit", limit);
        map.put("usedToday", used);
        map.put("remainingToday", remaining);
        map.put("limitExceeded", used >= limit);
        return map;
    }

    public synchronized void cancelWaiting(Long userId) {
        waitingQueue.removeIf(w -> w.getUserId().equals(userId));
    }

    private String uploadImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (cloudName != null && !cloudName.isBlank() && !cloudName.equals("demo")) {
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap("resource_type", "auto"));
                return uploadResult.get("secure_url").toString();
            } catch (Exception ignored) {}
        }

        Path uploadDir = Paths.get("uploads");
        File dir = uploadDir.toFile();
        if (!dir.exists()) dir.mkdirs();

        String originalFilename = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "speed_chat_" + UUID.randomUUID().toString() + extension;
        Path targetPath = uploadDir.resolve(filename);
        Files.write(targetPath, file.getBytes());
        return "http://localhost:" + serverPort + "/uploads/" + filename;
    }

    @Transactional
    public SpeedChatMessageDTO sendMessage(String sessionUuid, User sender, String content, String imageUrl) {
        SpeedChatSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() != SpeedChatSession.Status.ACTIVE) {
            throw new IllegalStateException("Chat session has ended");
        }

        if (!session.getUser1().getId().equals(sender.getId()) && !session.getUser2().getId().equals(sender.getId())) {
            throw new IllegalArgumentException("User not authorized for this session");
        }

        String senderTempName = session.getUser1().getId().equals(sender.getId())
                ? session.getUser1TempName() : session.getUser2TempName();

        String trimmedContent = content != null ? content.trim() : null;
        if ((trimmedContent == null || trimmedContent.isBlank()) && (imageUrl == null || imageUrl.isBlank())) {
            throw new IllegalArgumentException("Message content or image cannot be empty");
        }

        SpeedChatMessage msg = SpeedChatMessage.builder()
                .session(session)
                .sender(sender)
                .senderTempName(senderTempName)
                .content(trimmedContent)
                .imageUrl(imageUrl)
                .sentAt(LocalDateTime.now())
                .build();

        msg = messageRepository.save(msg);

        SpeedChatMessageDTO dto = SpeedChatMessageDTO.builder()
                .id(msg.getId())
                .sessionUuid(sessionUuid)
                .senderId(sender.getId())
                .senderTempName(senderTempName)
                .content(msg.getContent())
                .imageUrl(msg.getImageUrl())
                .sentAt(msg.getSentAt())
                .build();

        // Broadcast to both users in the session
        messagingTemplate.convertAndSend("/topic/speed-chat/session/" + sessionUuid, dto);
        return dto;
    }

    public SpeedChatMessageDTO sendMessage(String sessionUuid, User sender, String content) {
        return sendMessage(sessionUuid, sender, content, null);
    }

    @Transactional
    public SpeedChatMessageDTO sendPhoto(String sessionUuid, User sender, MultipartFile file, String caption) throws IOException {
        String imageUrl = uploadImage(file);
        return sendMessage(sessionUuid, sender, caption, imageUrl);
    }

    @Transactional
    public synchronized void leaveSession(String sessionUuid, User user) {
        sessionRepository.findBySessionUuid(sessionUuid).ifPresent(session -> {
            if (session.getStatus() == SpeedChatSession.Status.ACTIVE) {
                session.setStatus(SpeedChatSession.Status.ENDED);
                session.setEndedAt(LocalDateTime.now());
                sessionRepository.save(session);

                // Notify both sides that partner left
                Map<String, Object> event = Map.of(
                        "event", "PARTNER_LEFT",
                        "sessionUuid", sessionUuid,
                        "leftByUserId", user.getId()
                );
                messagingTemplate.convertAndSend("/topic/speed-chat/session/" + sessionUuid, event);
                log.info("SpeedChat session {} ended by user {}", sessionUuid, user.getEmail());
            }
            activeUserSessions.remove(session.getUser1().getId());
            activeUserSessions.remove(session.getUser2().getId());
        });
        cancelWaiting(user.getId());
    }

    @Transactional
    public synchronized void terminateSessionByAdmin(String sessionUuid) {
        sessionRepository.findBySessionUuid(sessionUuid).ifPresent(session -> {
            if (session.getStatus() == SpeedChatSession.Status.ACTIVE) {
                session.setStatus(SpeedChatSession.Status.TERMINATED_BY_ADMIN);
                session.setEndedAt(LocalDateTime.now());
                sessionRepository.save(session);

                Map<String, Object> event = Map.of(
                        "event", "TERMINATED_BY_ADMIN",
                        "sessionUuid", sessionUuid,
                        "message", "This chat was terminated by the administrator."
                );
                messagingTemplate.convertAndSend("/topic/speed-chat/session/" + sessionUuid, event);
                log.warn("SpeedChat session {} was TERMINATED BY ADMIN", sessionUuid);
            }
            activeUserSessions.remove(session.getUser1().getId());
            activeUserSessions.remove(session.getUser2().getId());
            cancelWaiting(session.getUser1().getId());
            cancelWaiting(session.getUser2().getId());
        });
    }

    private void closeActiveSessionsForUser(User user) {
        List<SpeedChatSession> active = sessionRepository.findActiveSessionsForUser(user, SpeedChatSession.Status.ACTIVE);
        for (SpeedChatSession s : active) {
            s.setStatus(SpeedChatSession.Status.ENDED);
            s.setEndedAt(LocalDateTime.now());
            sessionRepository.save(s);
            messagingTemplate.convertAndSend("/topic/speed-chat/session/" + s.getSessionUuid(),
                    Map.of("event", "PARTNER_LEFT", "sessionUuid", s.getSessionUuid()));
            activeUserSessions.remove(s.getUser1().getId());
            activeUserSessions.remove(s.getUser2().getId());
        }
    }

    // ── Admin Audit (24-Hour Logs) ──────────────────────────────────────────

    public List<SpeedChatAdminSessionDTO> getSessionsLast24Hours() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        return sessionRepository.findByStartedAtAfterOrderByStartedAtDesc(threshold).stream()
                .map(s -> SpeedChatAdminSessionDTO.builder()
                        .id(s.getId())
                        .sessionUuid(s.getSessionUuid())
                        .startedAt(s.getStartedAt())
                        .endedAt(s.getEndedAt())
                        .status(s.getStatus())
                        .realUser1Id(s.getUser1().getId())
                        .realUser1Name(s.getUser1().getName())
                        .realUser1Email(s.getUser1().getEmail())
                        .realUser1College(s.getUser1().getCollege())
                        .user1TempName(s.getUser1TempName())
                        .user1Age(s.getUser1Age())
                        .realUser2Id(s.getUser2().getId())
                        .realUser2Name(s.getUser2().getName())
                        .realUser2Email(s.getUser2().getEmail())
                        .realUser2College(s.getUser2().getCollege())
                        .user2TempName(s.getUser2TempName())
                        .user2Age(s.getUser2Age())
                        .messageCount(messageRepository.countBySession(s))
                        .build())
                .toList();
    }

    public List<SpeedChatMessageDTO> getSessionMessages(String sessionUuid) {
        SpeedChatSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        return messageRepository.findBySessionOrderBySentAtAsc(session).stream()
                .map(m -> SpeedChatMessageDTO.builder()
                        .id(m.getId())
                        .sessionUuid(sessionUuid)
                        .senderId(m.getSender().getId())
                        .senderTempName(m.getSenderTempName())
                        .content(m.getContent())
                        .imageUrl(m.getImageUrl())
                        .sentAt(m.getSentAt())
                        .build())
                .toList();
    }

    // ── Scheduled Auto-Cleanup after 24 hours ────────────────────────────────
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void cleanupOldSessions() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        log.info("Running SpeedChat auto-cleanup for sessions older than {}", threshold);
        messageRepository.deleteOlderThan(threshold);
        sessionRepository.deleteOlderThan(threshold);
    }
}
