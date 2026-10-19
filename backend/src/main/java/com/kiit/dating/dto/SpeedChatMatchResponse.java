package com.kiit.dating.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeedChatMatchResponse {
    private String status; // "WAITING" or "MATCHED" or "CANCELLED"
    private String sessionUuid;
    private String myTempName;
    private int myAge;
    private String partnerTempName;
    private int partnerAge;
    private Long partnerUserId;
}
