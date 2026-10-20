package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMatchMessageDTO {
    private Long id;
    private Long matchId;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String senderPhoto;
    private Long receiverId;
    private String content; // ORIGINAL content (preserved for admin even if deleted for everyone by user!)
    private String imageUrl; // ORIGINAL image url (preserved for admin)
    private boolean deletedForUsers;
    private LocalDateTime deletedAt;
    private LocalDateTime sentAt;
}
