package com.kiit.dating.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    private final SecureRandom random = new SecureRandom();

    public String generate6DigitOtp() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    public boolean isSmtpConfigured() {
        return mailSender != null && mailUsername != null && !mailUsername.isBlank();
    }

    public boolean sendVerificationOtpEmail(String toEmail, String otp) {
        log.info("==================================================");
        log.info("📨 [CAMPUS EMAIL VERIFICATION] To: {} | CODE: {}", toEmail, otp);
        log.info("==================================================");

        if (!isSmtpConfigured()) {
            log.info("ℹ️ SMTP credentials not configured yet. Using free console mode for OTP verification.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername, "KIIT Connects");
            helper.setTo(toEmail);
            helper.setSubject("Your KIIT Connects Verification Code: " + otp);

            String html = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ff4b72;">
                            KIIT Connects ✨
                        </h1>
                        <p style="margin: 4px 0 0; color: #8b5cf6; font-size: 13px; font-weight: 700;">by KIIT Confession</p>
                        <p style="margin: 6px 0 0; color: #64748b; font-size: 14px;">Campus Email Verification</p>
                    </div>
                    
                    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0 0 12px; color: #334155; font-size: 15px; font-weight: 500;">
                            Your 6-digit campus verification code is:
                        </p>
                        <div style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px dashed #f43f5e; border-radius: 14px;">
                            %s
                        </div>
                        <p style="margin: 12px 0 0; color: #94a3b8; font-size: 13px;">
                            ⏱️ Valid for 10 minutes. Do not share this code with anyone.
                        </p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                        If you did not initiate this registration, you can safely disregard this email.
                    </p>
                </div>
                """.formatted(otp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Verification email successfully delivered via SMTP to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("⚠️ SMTP delivery failed to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    public boolean sendPasswordResetOtpEmail(String toEmail, String otp) {
        log.info("==================================================");
        log.info("🔑 [CAMPUS PASSWORD RESET] To: {} | CODE: {}", toEmail, otp);
        log.info("==================================================");

        if (!isSmtpConfigured()) {
            log.info("ℹ️ SMTP credentials not configured yet. Using free console mode for Password Reset OTP.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername, "KIIT Connects");
            helper.setTo(toEmail);
            helper.setSubject("Reset Your KIIT Connects Password: " + otp);

            String html = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ff4b72;">
                            KIIT Connects 🔑
                        </h1>
                        <p style="margin: 4px 0 0; color: #8b5cf6; font-size: 13px; font-weight: 700;">by KIIT Confession</p>
                        <p style="margin: 6px 0 0; color: #64748b; font-size: 14px;">Password Reset Request</p>
                    </div>
                    
                    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0 0 12px; color: #334155; font-size: 15px; font-weight: 500;">
                            Your 6-digit password reset code is:
                        </p>
                        <div style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px dashed #9333ea; border-radius: 14px;">
                            %s
                        </div>
                        <p style="margin: 12px 0 0; color: #94a3b8; font-size: 13px;">
                            ⏱️ Valid for 10 minutes. Do not share this code with anyone.
                        </p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                        If you did not request a password reset, you can safely ignore this email. Your account credentials will remain untouched.
                    </p>
                </div>
                """.formatted(otp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Password reset email successfully delivered via SMTP to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("⚠️ SMTP password reset delivery failed to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    public java.util.Map<String, Object> sendTestEmail(String toEmail) {
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("to", toEmail);
        res.put("smtpConfigured", isSmtpConfigured());
        res.put("mailUsername", mailUsername);

        if (!isSmtpConfigured()) {
            res.put("success", false);
            res.put("error", "SMTP is not configured (mailSender or username is empty)");
            return res;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailUsername, "KIIT Connects Diagnostics");
            helper.setTo(toEmail);
            helper.setSubject("Test Email from KIIT Connects Diagnostics");
            helper.setText("<h3>Live SMTP test from KIIT Connects</h3><p>If you received this, SMTP email delivery is 100% operational!</p>", true);
            mailSender.send(message);
            res.put("success", true);
            res.put("message", "Email successfully delivered to " + toEmail);
        } catch (Exception e) {
            log.error("❌ Test email failed to {}: {}", toEmail, e.getMessage(), e);
            res.put("success", false);
            res.put("error", e.getClass().getName() + ": " + e.getMessage());
            if (e.getCause() != null) {
                res.put("cause", e.getCause().getClass().getName() + ": " + e.getCause().getMessage());
            }
        }
        return res;
    }
}
