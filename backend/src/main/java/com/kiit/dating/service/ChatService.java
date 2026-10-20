package com.kiit.dating.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kiit.dating.dto.AdminMatchChatSummaryDTO;
import com.kiit.dating.dto.AdminMatchMessageDTO;
import com.kiit.dating.dto.MessageDTO;
import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.Message;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.MessageRepository;
import com.kiit.dating.repository.UserRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${server.port:8088}")
    private String serverPort;

    @Transactional(readOnly = true)
    public List<MessageDTO> getChatHistory(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
        if (match.getStatus() != Match.Status.APPROVED) {
            throw new org.springframework.security.access.AccessDeniedException("This match is not approved yet.");
        }
        return messageRepository.findByMatchOrderBySentAtAsc(match)
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public MessageDTO sendMessage(Long matchId, Long senderId, String content) {
        return sendMessage(matchId, senderId, content, null);
    }

    @Transactional
    public MessageDTO sendMessage(Long matchId, Long senderId, String content, String imageUrl) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
        if (match.getStatus() != Match.Status.APPROVED) {
            throw new org.springframework.security.access.AccessDeniedException("This match is not approved yet.");
        }
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender user not found: " + senderId));

        User receiver = match.getUserA().getId().equals(senderId)
                ? match.getUserB() : match.getUserA();

        String trimmedContent = content != null ? content.trim() : null;
        if ((trimmedContent == null || trimmedContent.isBlank()) && (imageUrl == null || imageUrl.isBlank())) {
            throw new IllegalArgumentException("Message content or image cannot be empty");
        }

        Message msg = messageRepository.save(
                Message.builder()
                        .match(match)
                        .sender(sender)
                        .receiver(receiver)
                        .content(trimmedContent)
                        .imageUrl(imageUrl)
                        .deletedForUsers(false)
                        .build()
        );

        MessageDTO dto = toDTO(msg);

        // Broadcast to WebSocket topic so both users receive it in real time
        try {
            messagingTemplate.convertAndSend("/topic/match/" + matchId, dto);
        } catch (Exception ignored) {}

        return dto;
    }

    @Transactional
    public MessageDTO sendPhoto(Long matchId, Long senderId, MultipartFile file, String caption) throws IOException {
        String imageUrl = uploadImage(file);
        return sendMessage(matchId, senderId, caption, imageUrl);
    }

    @Transactional
    public MessageDTO deleteMessageForEveryone(Long matchId, Long messageId, Long requesterId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        if (!msg.getMatch().getId().equals(matchId)) {
            throw new IllegalArgumentException("Message does not belong to match: " + matchId);
        }

        // Only sender or admin/moderator can delete for everyone
        if (!msg.getSender().getId().equals(requesterId)) {
            User requester = userRepository.findById(requesterId).orElseThrow();
            if (requester.getRole() != User.Role.ADMIN && requester.getRole() != User.Role.MODERATOR) {
                throw new org.springframework.security.access.AccessDeniedException("You can only delete your own messages");
            }
        }

        // SOFT DELETE: Kept in database so Admin can audit, but hidden/masked from student screens
        msg.setDeletedForUsers(true);
        msg.setDeletedAt(LocalDateTime.now());
        msg = messageRepository.save(msg);

        MessageDTO dto = toDTO(msg);

        // Broadcast deleted status over WebSocket so partner's UI updates in real-time
        try {
            messagingTemplate.convertAndSend("/topic/match/" + matchId, dto);
        } catch (Exception ignored) {}

        return dto;
    }

    // ── Admin Monitoring & Audit Endpoints ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminMatchChatSummaryDTO> getAdminMatchChatSummaries() {
        List<Match> matches = matchRepository.findAll();
        List<AdminMatchChatSummaryDTO> summaries = new ArrayList<>();

        for (Match match : matches) {
            List<Message> msgs = messageRepository.findByMatchOrderBySentAtAsc(match);
            int count = msgs.size();
            int deleted = (int) msgs.stream().filter(Message::isDeletedForUsers).count();

            String lastSnippet = "No messages yet";
            LocalDateTime lastTime = match.getMatchedAt();
            if (!msgs.isEmpty()) {
                Message lastMsg = msgs.get(msgs.size() - 1);
                if (lastMsg.getContent() != null && !lastMsg.getContent().isBlank()) {
                    lastSnippet = lastMsg.getContent();
                } else if (lastMsg.getImageUrl() != null) {
                    lastSnippet = "📷 [Photo]";
                }
                if (lastMsg.isDeletedForUsers()) {
                    lastSnippet += " (Deleted by user)";
                }
                lastTime = lastMsg.getSentAt();
            }

            String photoA = (match.getUserA().getPhotoUrls() != null && !match.getUserA().getPhotoUrls().isEmpty())
                    ? match.getUserA().getPhotoUrls().get(0) : null;
            String photoB = (match.getUserB().getPhotoUrls() != null && !match.getUserB().getPhotoUrls().isEmpty())
                    ? match.getUserB().getPhotoUrls().get(0) : null;

            summaries.add(AdminMatchChatSummaryDTO.builder()
                    .matchId(match.getId())
                    .userAId(match.getUserA().getId())
                    .userAName(match.getUserA().getName())
                    .userAEmail(match.getUserA().getEmail())
                    .userAPhoto(photoA)
                    .userBId(match.getUserB().getId())
                    .userBName(match.getUserB().getName())
                    .userBEmail(match.getUserB().getEmail())
                    .userBPhoto(photoB)
                    .messageCount(count)
                    .deletedCount(deleted)
                    .lastMessageSnippet(lastSnippet)
                    .lastMessageTime(lastTime)
                    .matchedAt(match.getMatchedAt())
                    .build());
        }

        // Sort by most recent activity first
        summaries.sort((a, b) -> {
            LocalDateTime tA = a.getLastMessageTime() != null ? a.getLastMessageTime() : LocalDateTime.MIN;
            LocalDateTime tB = b.getLastMessageTime() != null ? b.getLastMessageTime() : LocalDateTime.MIN;
            return tB.compareTo(tA);
        });

        return summaries;
    }

    @Transactional(readOnly = true)
    public List<AdminMatchMessageDTO> getAdminMatchMessages(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

        return messageRepository.findByMatchOrderBySentAtAsc(match).stream().map(msg -> {
            String photo = (msg.getSender().getPhotoUrls() != null && !msg.getSender().getPhotoUrls().isEmpty())
                    ? msg.getSender().getPhotoUrls().get(0) : null;

            return AdminMatchMessageDTO.builder()
                    .id(msg.getId())
                    .matchId(match.getId())
                    .senderId(msg.getSender().getId())
                    .senderName(msg.getSender().getName())
                    .senderEmail(msg.getSender().getEmail())
                    .senderPhoto(photo)
                    .receiverId(msg.getReceiver().getId())
                    .content(msg.getContent()) // ORIGINAL text preserved for Admin even if deleted for everyone!
                    .imageUrl(msg.getImageUrl()) // ORIGINAL photo preserved for Admin!
                    .deletedForUsers(msg.isDeletedForUsers())
                    .deletedAt(msg.getDeletedAt())
                    .sentAt(msg.getSentAt())
                    .build();
        }).toList();
    }

    @Transactional
    public void clearMatchChatByAdmin(Long matchId) {
        messageRepository.deleteAllByMatchId(matchId);
        log.info("🛡️ [ADMIN AUDIT] Cleared all chat messages for match ID: {}", matchId);
    }

    @Transactional
    public int purgeMessagesOlderThan(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        int deleted = messageRepository.deleteBySentAtBefore(cutoff);
        log.info("🛡️ [CHAT RETENTION] Purged {} chat messages older than {} days (cutoff: {})", deleted, days, cutoff);
        return deleted;
    }

    // Auto-cleaner: Runs every night at 3:00 AM to automatically purge messages older than 10 days
    @Scheduled(cron = "0 0 3 * * ?")
    public void scheduled10DayRetentionCleanup() {
        try {
            purgeMessagesOlderThan(10);
        } catch (Exception e) {
            log.error("Error running 10-day message retention cleanup: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    public String uploadImage(MultipartFile file) throws IOException {
        if (cloudName != null && !cloudName.isBlank() && !cloudName.equals("your_cloud_name")) {
            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "kiit-dating/chat",
                                "transformation", "q_auto,f_auto,w_1200"
                        )
                );
                return (String) uploadResult.get("secure_url");
            } catch (Exception e) {
                log.warn("Cloudinary upload failed for chat image, falling back to local: {}", e.getMessage());
            }
        }

        Path uploadDir = Paths.get("uploads");
        File dir = uploadDir.toFile();
        if (!dir.exists()) dir.mkdirs();

        String originalFilename = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "chat_" + UUID.randomUUID().toString() + extension;
        Path targetPath = uploadDir.resolve(filename);
        Files.write(targetPath, file.getBytes());
        return "http://localhost:" + serverPort + "/uploads/" + filename;
    }

    private MessageDTO toDTO(Message msg) {
        String content = msg.getContent();
        String imageUrl = msg.getImageUrl();

        // If deleted for everyone by user, mask content and photo for students
        if (msg.isDeletedForUsers()) {
            content = "🚫 This message was deleted";
            imageUrl = null;
        }

        return MessageDTO.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .receiverId(msg.getReceiver().getId())
                .matchId(msg.getMatch().getId())
                .content(content)
                .imageUrl(imageUrl)
                .deletedForUsers(msg.isDeletedForUsers())
                .deletedAt(msg.getDeletedAt())
                .sentAt(msg.getSentAt())
                .read(msg.isRead())
                .build();
    }
}
