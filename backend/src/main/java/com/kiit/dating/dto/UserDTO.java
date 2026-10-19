package com.kiit.dating.dto;

import com.kiit.dating.entity.User;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private User.Gender gender;
    private LocalDate dateOfBirth;
    private String bio;
    private String college;
    private List<String> interests;
    private List<String> photoUrls;
    private boolean active;
    private boolean profileComplete;
    private User.Role role;
    private User.ApprovalStatus approvalStatus;
    private boolean deletionRequested;
    private java.time.LocalDateTime deletionRequestedAt;
    private Integer customDailySwipeLimit;
}
