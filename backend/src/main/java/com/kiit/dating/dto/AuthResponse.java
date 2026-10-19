package com.kiit.dating.dto;

import com.kiit.dating.entity.User;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private User.Gender gender;
    private User.Role role;
    private boolean profileComplete;
}
