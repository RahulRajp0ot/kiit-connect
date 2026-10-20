package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMatchChatSummaryDTO {
    private Long matchId;
    private Long userAId;
    private String userAName;
    private String userAEmail;
    private String userAPhoto;
    private Long userBId;
    private String userBName;
    private String userBEmail;
    private String userBPhoto;
    private int messageCount;
    private int deletedCount;
    private String lastMessageSnippet;
    private LocalDateTime lastMessageTime;
    private LocalDateTime matchedAt;
}
