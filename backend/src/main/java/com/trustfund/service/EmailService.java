package com.trustfund.service;

import com.trustfund.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${trustfund.mail.enabled:false}")
    private boolean enabled;

    @Value("${trustfund.mail.from:}")
    private String from;

    @Value("${trustfund.mail.sender-name:TrustFund}")
    private String senderName;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${trustfund.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendEmail(String to, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (!enabled || mailSender == null || isBlank(to) || isBlank(from) || isBlank(smtpPassword)) {
            log.info("[EMAIL_SKIPPED] to={} subject={}", to, subject);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(senderName + " - " + subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EMAIL_SENT] to={} subject={}", to, subject);
        } catch (RuntimeException e) {
            log.warn("[EMAIL_FAILED] to={} subject={} reason={}", to, subject, e.getMessage());
        }
    }

    public void sendWelcomeEmail(User user) {
        String roleLabel = switch (user.getRole()) {
            case ADMIN -> "admin";
            case CREATOR -> "creator";
            case DONOR -> "donor";
        };

        String nextStep = switch (user.getRole()) {
            case ADMIN -> "You can now sign in to review campaigns, manage users, monitor risks, and handle platform operations. Use the password shared securely by the main admin.";
            case CREATOR -> "You can now sign in, create your first campaign, add milestones, and submit proof when your work is ready.";
            case DONOR -> "You can now sign in, explore approved campaigns, donate, and track your donations.";
        };

        sendEmail(
                user.getEmail(),
                "Welcome to TrustFund",
                """
                        Hello %s,

                        Welcome to TrustFund. Your %s account has been created successfully.

                        %s

                        Sign in here:
                        %s/login

                        TrustFund
                        """.formatted(user.getName(), roleLabel, nextStep, frontendUrl));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
