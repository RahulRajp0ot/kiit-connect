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

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final AdminSettingsService adminSettingsService;
    private final OtpService otpService;

    public Map<String, Object> sendVerificationOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String cleanEmail = email.toLowerCase().trim();

        if (!adminSettingsService.isEmailDomainAllowed(cleanEmail)) {
            throw new IllegalArgumentException("Registration is restricted to college email domains: "
                    + adminSettingsService.getSettings().getAllowedDomains());
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("This college email is already registered. Please login.");
        }

        String code = otpService.createAndSendOtp(cleanEmail);

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "success");
        resp.put("message", "A 6-digit verification code has been sent to " + cleanEmail);
        if (!otpService.isSmtpConfigured()) {
            resp.put("devOtp", code);
        }
        return resp;
    }

    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        if (!adminSettingsService.isEmailDomainAllowed(cleanEmail)) {
            throw new IllegalArgumentException("Registration is restricted to college email domains: "
                    + adminSettingsService.getSettings().getAllowedDomains());
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Validate OTP
        boolean validOtp = otpService.validateAndConsumeOtp(cleanEmail, request.getOtp());
        if (!validOtp) {
            throw new IllegalArgumentException("Invalid or expired 6-digit verification code. Please check your email or request a new code.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(cleanEmail)
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
