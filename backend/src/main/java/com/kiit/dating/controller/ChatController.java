package com.kiit.dating.controller;

import com.kiit.dating.dto.MessageDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.service.ChatService;
import lombok.RequiredArgsConstructor;
import com.kiit.dating.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    // REST endpoint to load chat history
    @GetMapping("/api/chat/{matchId}")
    public ResponseEntity<List<MessageDTO>> getChatHistory(@PathVariable Long matchId) {
        return ResponseEntity.ok(chatService.getChatHistory(matchId));
    }

    // REST endpoint to send a message (100% reliable HTTP fallback)
    @PostMapping("/api/chat/{matchId}/message")
    public ResponseEntity<MessageDTO> sendChatMessage(
            @PathVariable Long matchId,
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        String imageUrl = body.get("imageUrl");
        if ((content == null || content.isBlank()) && (imageUrl == null || imageUrl.isBlank())) {
            throw new IllegalArgumentException("Message content or image cannot be empty");
        }
        return ResponseEntity.ok(chatService.sendMessage(matchId, currentUser.getId(), content != null ? content.trim() : null, imageUrl));
    }

    // REST endpoint to send a photo in chat
    @PostMapping("/api/chat/{matchId}/photo")
    public ResponseEntity<MessageDTO> sendChatPhoto(
            @PathVariable Long matchId,
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) throws java.io.IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file cannot be empty");
        }
        return ResponseEntity.ok(chatService.sendPhoto(matchId, currentUser.getId(), file, caption));
    }

    // Delete message for everyone (Soft deletes in DB, masks on student screens, preserves for Admin audit!)
    @DeleteMapping("/api/chat/{matchId}/message/{messageId}")
    public ResponseEntity<MessageDTO> deleteMessageForEveryone(
            @PathVariable Long matchId,
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(chatService.deleteMessageForEveryone(matchId, messageId, currentUser.getId()));
    }

    // WebSocket endpoint to send a message (supports /app/chat/{matchId} and /app/chat.send/{matchId})
    @MessageMapping({"/chat/{matchId}", "/chat.send/{matchId}"})
    public void sendMessage(@DestinationVariable Long matchId,
                            @Payload Map<String, Object> payload,
                            Principal principal) {
        String content = payload.get("content") != null ? payload.get("content").toString().trim() : "";
        if (content.isEmpty()) return;

        Long senderId = null;
        if (payload.get("senderId") != null) {
            try {
                senderId = Long.parseLong(payload.get("senderId").toString());
            } catch (Exception ignored) {}
        }
        if (senderId == null && principal != null) {
            senderId = userRepository.findByEmail(principal.getName()).map(User::getId).orElse(null);
        }

        if (senderId != null) {
            chatService.sendMessage(matchId, senderId, content);
        } else {
            log.warn("Could not determine senderId for chat message in match {}", matchId);
        }
    }
}
