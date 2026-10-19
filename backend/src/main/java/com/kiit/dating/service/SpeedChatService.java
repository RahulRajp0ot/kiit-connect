package com.kiit.dating.service;

import com.kiit.dating.dto.SpeedChatAdminSessionDTO;
import com.kiit.dating.dto.SpeedChatMatchResponse;
import com.kiit.dating.dto.SpeedChatMessageDTO;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        String tempName = (rawTempName == null || rawTempName.trim().isBlank()) ? "KIITian" : rawTempName.trim();
        int age = rawAge < 18 ? 18 : rawAge;

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

    public synchronized void cancelWaiting(Long userId) {
        waitingQueue.removeIf(w -> w.getUserId().equals(userId));
    }

    @Transactional
    public SpeedChatMessageDTO sendMessage(String sessionUuid, User sender, String content) {
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

        SpeedChatMessage msg = SpeedChatMessage.builder()
                .session(session)
                .sender(sender)
                .senderTempName(senderTempName)
                .content(content.trim())
                .sentAt(LocalDateTime.now())
                .build();

        msg = messageRepository.save(msg);

        SpeedChatMessageDTO dto = SpeedChatMessageDTO.builder()
                .id(msg.getId())
                .sessionUuid(sessionUuid)
                .senderId(sender.getId())
                .senderTempName(senderTempName)
                .content(msg.getContent())
                .sentAt(msg.getSentAt())
                .build();

        // Broadcast to both users in the session
        messagingTemplate.convertAndSend("/topic/speed-chat/session/" + sessionUuid, dto);
        return dto;
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
