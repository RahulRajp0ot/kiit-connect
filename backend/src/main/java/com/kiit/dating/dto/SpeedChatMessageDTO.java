package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeedChatMessageDTO {
    private Long id;
    private String sessionUuid;
    private Long senderId;
    private String senderTempName;
    private String content;
    private String imageUrl;
    private LocalDateTime sentAt;
}
