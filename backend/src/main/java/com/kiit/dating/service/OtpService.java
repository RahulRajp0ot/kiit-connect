package com.kiit.dating.service;

import com.kiit.dating.entity.EmailVerificationOtp;
import com.kiit.dating.repository.EmailVerificationOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final EmailVerificationOtpRepository otpRepository;
    private final EmailService emailService;

    public record OtpResult(String code, boolean delivered) {}

    @Transactional
    public OtpResult createAndSendOtp(String email) {
        String code = emailService.generate6DigitOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        EmailVerificationOtp entity = EmailVerificationOtp.builder()
                .email(email.toLowerCase().trim())
                .otp(code)
                .expiresAt(expiresAt)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        otpRepository.save(entity);
        boolean delivered = emailService.sendVerificationOtpEmail(email, code);

        return new OtpResult(code, delivered);
    }

    @Transactional
    public OtpResult createAndSendPasswordResetOtp(String email) {
        String code = emailService.generate6DigitOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        EmailVerificationOtp entity = EmailVerificationOtp.builder()
                .email(email.toLowerCase().trim())
                .otp(code)
                .expiresAt(expiresAt)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        otpRepository.save(entity);
        boolean delivered = emailService.sendPasswordResetOtpEmail(email, code);

        return new OtpResult(code, delivered);
    }

    @Transactional
    public boolean validateAndConsumeOtp(String email, String inputOtp) {
        if (inputOtp == null || inputOtp.isBlank()) {
            return false;
        }

        return otpRepository.findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                email.toLowerCase().trim(), LocalDateTime.now()
        ).map(token -> {
            if (token.getOtp().trim().equals(inputOtp.trim())) {
                token.setUsed(true);
                otpRepository.save(token);
                return true;
            }
            return false;
        }).orElse(false);
    }

    public boolean isSmtpConfigured() {
        return emailService.isSmtpConfigured();
    }
}
