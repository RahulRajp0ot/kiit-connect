package com.kiit.dating.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMatchDTO {
    private Long matchId;

    // Person 1
    private Long user1Id;
    private String user1Name;
    private String user1Email;
    private String user1Photo;
    private String user1Gender;
    private String user1College;
    private String user1Bio;

    // Person 2
    private Long user2Id;
    private String user2Name;
    private String user2Email;
    private String user2Photo;
    private String user2Gender;
    private String user2College;
    private String user2Bio;

    private LocalDateTime matchedAt;
    private String status;
}
