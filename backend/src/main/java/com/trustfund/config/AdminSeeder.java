package com.trustfund.config;

import com.trustfund.model.entity.User;
import com.trustfund.model.enums.Role;
import com.trustfund.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {
    private static final String MAIN_ADMIN_EMAIL = "trustfund.notification@gmail.com";
    private static final String LEGACY_ADMIN_EMAIL = "admin@trustfund.local";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedUser("Main Admin", MAIN_ADMIN_EMAIL, "Admin@123456", Role.ADMIN);
        deleteLegacyAdmin();
    }

    private void seedUser(String name, String email, String password, Role role) {
        userRepository.findByEmail(email).ifPresent(existing -> {
            existing.setName(name);
            existing.setPassword(passwordEncoder.encode(password));
            existing.setRole(role);
            existing.setActive(true);
            userRepository.save(existing);
            log.info("Updated default {} user: {}", role, email);
        });

        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build();
        userRepository.save(user);
        log.info("Seeded default {} user: {}", role, email);
    }

    private void deleteLegacyAdmin() {
        userRepository.findByEmail(LEGACY_ADMIN_EMAIL).ifPresent(legacyAdmin -> {
            User mainAdmin = userRepository.findByEmail(MAIN_ADMIN_EMAIL)
                    .orElseThrow(() -> new IllegalStateException("Main admin must exist before legacy admin cleanup"));

            entityManager.createNativeQuery("UPDATE audit_logs SET performed_by = :mainAdminId WHERE performed_by = :legacyAdminId")
                    .setParameter("mainAdminId", mainAdmin.getId())
                    .setParameter("legacyAdminId", legacyAdmin.getId())
                    .executeUpdate();
            entityManager.createNativeQuery("UPDATE fund_releases SET released_by = :mainAdminId WHERE released_by = :legacyAdminId")
                    .setParameter("mainAdminId", mainAdmin.getId())
                    .setParameter("legacyAdminId", legacyAdmin.getId())
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = :legacyAdminId")
                    .setParameter("legacyAdminId", legacyAdmin.getId())
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :legacyAdminId")
                    .setParameter("legacyAdminId", legacyAdmin.getId())
                    .executeUpdate();

            userRepository.delete(legacyAdmin);
            log.info("Deleted legacy admin user: {}", LEGACY_ADMIN_EMAIL);
        });
    }
}
