package com.kiit.dating.service;

import com.kiit.dating.dto.*;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.UserRepository;
import com.kiit.dating.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final AdminSettingsService adminSettingsService;

    public AuthResponse register(RegisterRequest request) {
        if (!adminSettingsService.isEmailDomainAllowed(request.getEmail())) {
            throw new IllegalArgumentException("Registration is restricted to college email domains: "
                    + adminSettingsService.getSettings().getAllowedDomains());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .role(User.Role.USER)
                .approvalStatus(User.ApprovalStatus.PENDING)
                .active(true)
                .profileComplete(false)
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user);

        return buildAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            throw new DisabledException("Your account has been deactivated by admin. Contact admin@kiit.ac.in");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        String token = jwtUtil.generateToken(user);
        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .gender(user.getGender())
                .role(user.getRole())
                .approvalStatus(user.getApprovalStatus())
                .profileComplete(user.isProfileComplete())
                .build();
    }
}
