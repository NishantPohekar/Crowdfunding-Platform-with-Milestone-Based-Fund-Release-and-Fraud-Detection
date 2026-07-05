package com.trustfund.config;

import com.trustfund.model.entity.User;
import com.trustfund.model.enums.Role;
import com.trustfund.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${trustfund.main-admin.email}")
    private String mainAdminEmail;

    @Value("${trustfund.main-admin.password}")
    private String mainAdminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedUser("Main Admin", mainAdminEmail, mainAdminPassword, Role.ADMIN);
    }

    private void seedUser(String name, String email, String password, Role role) {
        String normalizedEmail = email.toLowerCase();
        userRepository.findByEmail(normalizedEmail).ifPresent(existing -> {
            existing.setName(name);
            existing.setPassword(passwordEncoder.encode(password));
            existing.setRole(role);
            existing.setActive(true);
            userRepository.save(existing);
            log.info("Updated default {} user: {}", role, normalizedEmail);
        });

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return;
        }

        User user = User.builder()
                .name(name)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build();
        userRepository.save(user);
        log.info("Seeded default {} user: {}", role, normalizedEmail);
    }
}
