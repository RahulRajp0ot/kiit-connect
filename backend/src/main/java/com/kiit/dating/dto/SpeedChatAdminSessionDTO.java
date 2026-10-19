package com.kiit.dating.dto;

import com.kiit.dating.entity.SpeedChatSession;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeedChatAdminSessionDTO {
    private Long id;
    private String sessionUuid;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private SpeedChatSession.Status status;

    // Real identity of User 1 (Admin safety audit)
    private Long realUser1Id;
    private String realUser1Name;
    private String realUser1Email;
    private String realUser1College;
    private String user1TempName;
    private int user1Age;

    // Real identity of User 2 (Admin safety audit)
    private Long realUser2Id;
    private String realUser2Name;
    private String realUser2Email;
    private String realUser2College;
    private String user2TempName;
    private int user2Age;

    private long messageCount;
}
