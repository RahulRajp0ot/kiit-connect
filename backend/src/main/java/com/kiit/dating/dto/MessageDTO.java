package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private Long matchId;
    private String content;
    private LocalDateTime sentAt;
    private boolean read;
}
