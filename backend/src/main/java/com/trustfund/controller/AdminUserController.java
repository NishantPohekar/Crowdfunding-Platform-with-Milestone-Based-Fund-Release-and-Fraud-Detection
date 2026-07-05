package com.trustfund.controller;

import com.trustfund.model.dto.ActionReasonRequest;
import com.trustfund.model.dto.CreateAdminRequest;
import com.trustfund.model.dto.UpdateProfileRequest;
import com.trustfund.service.AuditService;
import com.trustfund.exception.BadRequestException;
import com.trustfund.exception.ResourceNotFoundException;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.Role;
import com.trustfund.service.EmailService;
import com.trustfund.service.NotificationService;
import com.trustfund.repository.CampaignRepository;
import com.trustfund.repository.ComplaintRepository;
import com.trustfund.repository.DonationRepository;
import com.trustfund.repository.NotificationRepository;
import com.trustfund.repository.RefreshTokenRepository;
import com.trustfund.repository.UserRepository;
import com.trustfund.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    private final ComplaintRepository complaintRepository;
    private final NotificationRepository notificationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    @Value("${trustfund.main-admin.email}")
    private String mainAdminEmail;

    @PostMapping
    @Transactional
    public Map<String, Object> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        requireMainAdmin();
        String email = request.getEmail().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }
        User user = User.builder()
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .active(true)
                .build();
        userRepository.save(user);
        emailService.sendWelcomeEmail(user);
        auditService.log(SecurityUtils.currentUserId(), "ADMIN_CREATED", "User", user.getId(), null);
        return toResponse(user);
    }

    @PutMapping("/{id}/deactivate")
    @Transactional
    public Map<String, Object> deactivate(@PathVariable UUID id, @RequestBody(required = false) ActionReasonRequest request) {
        User user = findUser(id);
        UUID adminId = SecurityUtils.currentUserId();
        if (user.getId().equals(adminId)) {
            throw new BadRequestException("You cannot deactivate your own admin account");
        }
        if (user.getRole() == Role.ADMIN) {
            requireMainAdmin();
            if (isMainAdminAccount(user)) {
                throw new BadRequestException("Main admin account cannot be deactivated");
            }
        }
        String reason = cleanReason(request != null ? request.getReason() : null);
        user.setActive(false);
        user.setDeactivationReason(reason);
        userRepository.save(user);
        notificationService.notifyUser(user.getId(), "Your account was deactivated by an admin." + reasonSuffix(reason));
        auditService.log(adminId, "USER_DEACTIVATED", "User", user.getId(), reason);
        return toResponse(user);
    }

    @PutMapping("/{id}/activate")
    @Transactional
    public Map<String, Object> activate(@PathVariable UUID id) {
        User user = findUser(id);
        if (user.getRole() == Role.ADMIN) {
            requireMainAdmin();
        }
        user.setActive(true);
        user.setDeactivationReason(null);
        userRepository.save(user);
        notificationService.notifyUser(user.getId(), "Your account was reactivated by an admin.");
        auditService.log(SecurityUtils.currentUserId(), "USER_ACTIVATED", "User", user.getId(), null);
        return toResponse(user);
    }

    @PutMapping("/{id}/profile")
    @Transactional
    public Map<String, Object> updateProfile(@PathVariable UUID id, @Valid @RequestBody UpdateProfileRequest request) {
        User user = findUser(id);
        UUID adminId = SecurityUtils.currentUserId();
        if (isMainAdminAccount(user) && !user.getId().equals(adminId)) {
            throw new BadRequestException("Main admin profile can be edited only by the main admin");
        }
        user.setName(request.getName().trim());
        userRepository.save(user);
        if (!user.getId().equals(adminId)) {
            notificationService.notifyUser(user.getId(), "Your profile name was updated by an admin.");
        }
        auditService.log(adminId, "USER_PROFILE_UPDATED", "User", user.getId(), null);
        return toResponse(user);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        User user = findUser(id);
        UUID adminId = SecurityUtils.currentUserId();
        if (user.getId().equals(adminId)) {
            throw new BadRequestException("You cannot delete your own admin account");
        }
        if (isMainAdminAccount(user)) {
            throw new BadRequestException("Main admin account cannot be deleted");
        }
        if (user.getRole() == Role.ADMIN) {
            requireMainAdmin();
        }
        if (campaignRepository.countByCreatorId(user.getId()) > 0
                || donationRepository.countByDonorId(user.getId()) > 0
                || complaintRepository.countByUserId(user.getId()) > 0) {
            throw new BadRequestException("User has platform history. Deactivate this account instead of deleting it.");
        }
        refreshTokenRepository.deleteByUserId(user.getId());
        notificationRepository.deleteByUserId(user.getId());
        userRepository.delete(user);
        auditService.log(adminId, "USER_DELETED", "User", id, null);
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void requireMainAdmin() {
        if (!mainAdminEmail.equalsIgnoreCase(SecurityUtils.currentUser().getEmail())) {
            throw new BadRequestException("Only the main admin can manage admin accounts");
        }
    }

    private boolean isMainAdminAccount(User user) {
        return mainAdminEmail.equalsIgnoreCase(user.getEmail());
    }

    private String reasonSuffix(String reason) {
        String cleanReason = cleanReason(reason);
        return cleanReason == null ? "" : " Reason: " + cleanReason;
    }

    private String cleanReason(String reason) {
        return reason == null || reason.isBlank() ? null : reason.trim();
    }

    private Map<String, Object> toResponse(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "active", user.isActive(),
                "deactivationReason", user.getDeactivationReason() == null ? "" : user.getDeactivationReason(),
                "campaigns", campaignRepository.countByCreatorId(user.getId()),
                "donations", donationRepository.countByDonorId(user.getId()),
                "createdAt", user.getCreatedAt()
        );
    }
}
