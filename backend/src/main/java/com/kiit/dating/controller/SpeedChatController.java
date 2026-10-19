package com.kiit.dating.controller;

import com.kiit.dating.dto.SpeedChatMatchResponse;
import com.kiit.dating.dto.SpeedChatMessageDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.UserRepository;
import com.kiit.dating.service.SpeedChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SpeedChatController {

    private final SpeedChatService speedChatService;
    private final UserRepository userRepository;

    @GetMapping("/api/speed-chat/status")
    public ResponseEntity<Map<String, Object>> getSpeedChatStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(speedChatService.getSpeedChatStatus(user));
    }

    @PostMapping("/api/speed-chat/find")
    public ResponseEntity<SpeedChatMatchResponse> findMatch(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        String tempName = body.get("tempName") != null ? body.get("tempName").toString() : "KIITian";
        int age = 18;
        if (body.get("age") != null) {
            try {
                age = Integer.parseInt(body.get("age").toString());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(speedChatService.findMatch(user, tempName, age));
    }

    @PostMapping("/api/speed-chat/cancel")
    public ResponseEntity<Void> cancelWaiting(@AuthenticationPrincipal User user) {
        speedChatService.cancelWaiting(user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/speed-chat/{sessionUuid}/message")
    public ResponseEntity<SpeedChatMessageDTO> sendRestMessage(
            @PathVariable String sessionUuid,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        String imageUrl = body.get("imageUrl");
        return ResponseEntity.ok(speedChatService.sendMessage(sessionUuid, user, content, imageUrl));
    }

    @PostMapping("/api/speed-chat/{sessionUuid}/photo")
    public ResponseEntity<SpeedChatMessageDTO> sendPhoto(
            @PathVariable String sessionUuid,
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "content", required = false) String content) throws IOException {
        return ResponseEntity.ok(speedChatService.sendPhoto(sessionUuid, user, file, content));
    }

    @PostMapping("/api/speed-chat/{sessionUuid}/leave")
    public ResponseEntity<Void> leaveSession(
            @PathVariable String sessionUuid,
            @AuthenticationPrincipal User user) {
        speedChatService.leaveSession(sessionUuid, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/speed-chat/{sessionUuid}/messages")
    public ResponseEntity<List<SpeedChatMessageDTO>> getSessionMessages(
            @PathVariable String sessionUuid) {
        return ResponseEntity.ok(speedChatService.getSessionMessages(sessionUuid));
    }

    // WebSocket STOMP Message Handler
    @MessageMapping("/speed-chat/{sessionUuid}/send")
    public void sendWsMessage(
            @DestinationVariable String sessionUuid,
            @Payload Map<String, Object> payload) {
        Long senderId = Long.parseLong(payload.get("senderId").toString());
        String content = payload.get("content") != null ? payload.get("content").toString() : "";
        String imageUrl = payload.get("imageUrl") != null ? payload.get("imageUrl").toString() : null;
        User sender = userRepository.findById(senderId).orElseThrow();
        speedChatService.sendMessage(sessionUuid, sender, content, imageUrl);
    }
}
