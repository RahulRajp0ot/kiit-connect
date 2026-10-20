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

        OtpService.OtpResult result = otpService.createAndSendOtp(cleanEmail);

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "success");
        if (result.delivered()) {
            resp.put("message", "A 6-digit verification code has been sent to " + cleanEmail);
        } else {
            resp.put("message", "Verification code generated! (SMTP offline, use demo code below)");
            resp.put("devOtp", result.code());
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

    public Map<String, Object> sendForgotPasswordOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("College email is required");
        }
        String cleanEmail = email.toLowerCase().trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("No registered account found with email: " + cleanEmail));

        if (!user.isActive()) {
            throw new DisabledException("Your account is deactivated. Please contact campus admin.");
        }

        OtpService.OtpResult result = otpService.createAndSendPasswordResetOtp(cleanEmail);

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "success");
        if (result.delivered()) {
            resp.put("message", "A 6-digit password reset code has been sent to " + cleanEmail);
        } else {
            resp.put("message", "Password reset code generated! (SMTP offline, use demo code below)");
            resp.put("devOtp", result.code());
        }
        return resp;
    }

    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("No account found with email: " + cleanEmail));

        if (!user.isActive()) {
            throw new DisabledException("Your account is deactivated. Please contact campus admin.");
        }

        // Validate OTP
        boolean validOtp = otpService.validateAndConsumeOtp(cleanEmail, request.getOtp());
        if (!validOtp) {
            throw new IllegalArgumentException("Invalid or expired 6-digit verification code. Please check your email or request a new code.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "success");
        resp.put("message", "Password reset successfully! You can now log in with your new password.");
        return resp;
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
