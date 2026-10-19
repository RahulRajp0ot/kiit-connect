package com.kiit.dating.service;

import com.kiit.dating.dto.MessageDTO;
import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.Message;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.MessageRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<MessageDTO> getChatHistory(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
        return messageRepository.findByMatchOrderBySentAtAsc(match)
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public MessageDTO sendMessage(Long matchId, Long senderId, String content) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender user not found: " + senderId));

        // Determine receiver (the other person in the match)
        User receiver = match.getUserA().getId().equals(senderId)
                ? match.getUserB() : match.getUserA();

        Message msg = messageRepository.save(
                Message.builder()
                        .match(match)
                        .sender(sender)
                        .receiver(receiver)
                        .content(content)
                        .build()
        );

        MessageDTO dto = toDTO(msg);

        // Broadcast to WebSocket topic so both users receive it in real time
        try {
            messagingTemplate.convertAndSend("/topic/match/" + matchId, dto);
        } catch (Exception ignored) {}

        return dto;
    }

    private MessageDTO toDTO(Message msg) {
        return MessageDTO.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .receiverId(msg.getReceiver().getId())
                .matchId(msg.getMatch().getId())
                .content(msg.getContent())
                .sentAt(msg.getSentAt())
                .read(msg.isRead())
                .build();
    }
}
