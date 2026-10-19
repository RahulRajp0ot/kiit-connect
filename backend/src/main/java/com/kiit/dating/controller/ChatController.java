package com.kiit.dating.controller;

import com.kiit.dating.dto.MessageDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // REST endpoint to load chat history
    @GetMapping("/api/chat/{matchId}")
    public ResponseEntity<List<MessageDTO>> getChatHistory(@PathVariable Long matchId) {
        return ResponseEntity.ok(chatService.getChatHistory(matchId));
    }

    // WebSocket endpoint to send a message
    @MessageMapping("/chat.send/{matchId}")
    public void sendMessage(@DestinationVariable Long matchId,
                            @Payload Map<String, Object> payload,
                            Principal principal) {
        Long senderId = Long.parseLong(payload.get("senderId").toString());
        String content = payload.get("content").toString();
        chatService.sendMessage(matchId, senderId, content);
    }
}
