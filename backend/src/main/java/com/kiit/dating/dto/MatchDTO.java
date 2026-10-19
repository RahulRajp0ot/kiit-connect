package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchDTO {
    private Long matchId;
    private Long matchedUserId;
    private String matchedUserName;
    private String matchedUserPhoto;
    private LocalDateTime matchedAt;
    private boolean isNew;
}
