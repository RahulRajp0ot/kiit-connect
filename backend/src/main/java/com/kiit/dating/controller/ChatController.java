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
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        return ResponseEntity.ok(chatService.sendMessage(matchId, currentUser.getId(), content.trim()));
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
