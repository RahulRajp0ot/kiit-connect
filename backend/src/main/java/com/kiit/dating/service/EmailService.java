package com.kiit.dating.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:KIIT Connects}")
    private String brevoSenderName;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.sender-email:}")
    private String resendSenderEmail;

    private final SecureRandom random = new SecureRandom();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public String generate6DigitOtp() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    public boolean isConfigured() {
        return (brevoApiKey != null && !brevoApiKey.isBlank())
                || (resendApiKey != null && !resendApiKey.isBlank())
                || (mailSender != null && mailUsername != null && !mailUsername.isBlank());
    }

    public boolean isSmtpConfigured() {
        return isConfigured();
    }

    public boolean sendVerificationOtpEmail(String toEmail, String otp) {
        log.info("📨 [CAMPUS EMAIL VERIFICATION] Initiating delivery to: {}", toEmail);

        String subject = "Your KIIT Connects Verification Code: " + otp;
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

        return sendEmail(toEmail, subject, html);
    }

    public boolean sendPasswordResetOtpEmail(String toEmail, String otp) {
        log.info("🔑 [CAMPUS PASSWORD RESET] Initiating delivery to: {}", toEmail);

        String subject = "Reset Your KIIT Connects Password: " + otp;
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

        return sendEmail(toEmail, subject, html);
    }

    public boolean sendEmail(String toEmail, String subject, String htmlContent) {
        // Priority 1: Brevo HTTP API (Port 443 - works everywhere including Render free tier)
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            try {
                if (sendViaBrevo(toEmail, subject, htmlContent)) {
                    return true;
                }
            } catch (Exception e) {
                log.error("❌ Brevo API delivery failed to {}: {}", toEmail, e.getMessage(), e);
            }
        }

        // Priority 2: Resend HTTP API (Port 443)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                if (sendViaResend(toEmail, subject, htmlContent)) {
                    return true;
                }
            } catch (Exception e) {
                log.error("❌ Resend API delivery failed to {}: {}", toEmail, e.getMessage(), e);
            }
        }

        // Priority 3: JavaMailSender SMTP (port 465 / 587)
        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                return sendViaSmtp(toEmail, subject, htmlContent);
            } catch (Exception e) {
                log.warn("⚠️ SMTP delivery failed to {}: {}", toEmail, e.getMessage());
            }
        }

        log.warn("⚠️ No active email service configured or all providers failed for {}", toEmail);
        return false;
    }

    private boolean sendViaBrevo(String toEmail, String subject, String htmlContent) throws Exception {
        String senderEmail = (brevoSenderEmail != null && !brevoSenderEmail.isBlank())
                ? brevoSenderEmail.trim()
                : (mailUsername != null && !mailUsername.isBlank() ? mailUsername.trim() : "rahulrajp0ot77799@gmail.com");
        String senderName = (brevoSenderName != null && !brevoSenderName.isBlank())
                ? brevoSenderName.trim()
                : "KIIT Connects";

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", Map.of("name", senderName, "email", senderEmail));
        payload.put("to", List.of(Map.of("email", toEmail.trim())));
        payload.put("subject", subject);
        payload.put("htmlContent", htmlContent);

        String jsonBody = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .header("accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("✅ Brevo API email successfully sent to {} (status: {})", toEmail, response.statusCode());
            return true;
        } else {
            log.error("❌ Brevo API error (status {}): {}", response.statusCode(), response.body());
            return false;
        }
    }

    private boolean sendViaResend(String toEmail, String subject, String htmlContent) throws Exception {
        String from = (resendSenderEmail != null && !resendSenderEmail.isBlank())
                ? resendSenderEmail.trim()
                : "KIIT Connects <onboarding@resend.dev>";

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", from);
        payload.put("to", List.of(toEmail.trim()));
        payload.put("subject", subject);
        payload.put("html", htmlContent);

        String jsonBody = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("✅ Resend API email successfully sent to {} (status: {})", toEmail, response.statusCode());
            return true;
        } else {
            log.error("❌ Resend API error (status {}): {}", response.statusCode(), response.body());
            return false;
        }
    }

    private boolean sendViaSmtp(String toEmail, String subject, String htmlContent) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(mailUsername, "KIIT Connects");
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.info("✅ SMTP email successfully delivered to {}", toEmail);
        return true;
    }

    public Map<String, Object> sendTestEmail(String toEmail) {
        Map<String, Object> res = new HashMap<>();
        res.put("to", toEmail);
        res.put("brevoConfigured", brevoApiKey != null && !brevoApiKey.isBlank());
        res.put("resendConfigured", resendApiKey != null && !resendApiKey.isBlank());
        res.put("smtpConfigured", mailSender != null && mailUsername != null && !mailUsername.isBlank());

        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            String senderEmail = (brevoSenderEmail != null && !brevoSenderEmail.isBlank())
                    ? brevoSenderEmail.trim()
                    : (mailUsername != null && !mailUsername.isBlank() ? mailUsername.trim() : "rahulrajp0ot77799@gmail.com");
            res.put("brevoSenderEmailUsed", senderEmail);
            res.put("brevoApiKeyPrefix", brevoApiKey.length() > 8 ? brevoApiKey.substring(0, 8) + "..." : "short_key");

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("sender", Map.of("name", brevoSenderName, "email", senderEmail));
                payload.put("to", List.of(Map.of("email", toEmail.trim())));
                payload.put("subject", "Test Email from KIIT Connects Diagnostics");
                payload.put("htmlContent", "<h3>Live Email Delivery Test via Brevo API</h3><p>If you received this, Brevo delivery is 100% operational!</p>");

                String jsonBody = objectMapper.writeValueAsString(payload);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                        .header("api-key", brevoApiKey.trim())
                        .header("Content-Type", "application/json")
                        .header("accept", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .timeout(Duration.ofSeconds(10))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                res.put("brevoStatusCode", response.statusCode());
                res.put("brevoResponseBody", response.body());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    res.put("success", true);
                    res.put("message", "Email successfully delivered to " + toEmail + " via Brevo API!");
                    return res;
                }
            } catch (Exception e) {
                res.put("brevoException", e.getClass().getName() + ": " + e.getMessage());
            }
        }

        boolean success = sendEmail(
                toEmail,
                "Test Email from KIIT Connects Diagnostics",
                "<h3>Live Email Delivery Test</h3><p>If you received this email, the delivery is working!</p>"
        );

        res.put("success", success);
        if (success) {
            res.put("message", "Email successfully delivered to " + toEmail);
        } else {
            res.put("error", "Email delivery failed across all available providers (Brevo, Resend, SMTP).");
        }
        return res;
    }
}
