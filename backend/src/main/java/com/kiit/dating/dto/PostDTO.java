package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private String quote;
    private String photoUrl;
    private int likesCount;
    private boolean likedByMe;
    private LocalDateTime createdAt;

    // Author info
    private Long authorId;
    private String authorName;
    private String authorEmail;
    private String authorCollege;
    private String authorAvatar;
    private String authorRole;
    private boolean canDelete;
}
