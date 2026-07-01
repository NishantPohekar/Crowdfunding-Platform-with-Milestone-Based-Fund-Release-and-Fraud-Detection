package com.trustfund.service;

import com.trustfund.model.entity.Notification;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.NotificationStatus;
import com.trustfund.model.enums.Role;
import com.trustfund.model.dto.NotificationResponse;
import com.trustfund.repository.NotificationRepository;
import com.trustfund.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void notifyUser(UUID userId, String message) {
        User user = userRepository.getReferenceById(userId);
        notificationRepository.save(Notification.builder()
                .user(user)
                .message(message)
                .status(NotificationStatus.UNREAD)
                .build());
        log.info("[NOTIFICATION] user={} message={}", userId, message);
        emailService.sendEmail(user.getEmail(), "TrustFund notification", message);
    }

    @Transactional
    public void notifyRole(Role role, String message) {
        userRepository.findByRole(role).stream()
                .filter(User::isActive)
                .forEach(user -> notifyUser(user.getId(), message));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse markRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.trustfund.exception.ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new com.trustfund.exception.ForbiddenException("Not your notification");
        }
        notification.setStatus(NotificationStatus.READ);
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public List<NotificationResponse> markAllRead(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(notification -> {
                    notification.setStatus(NotificationStatus.READ);
                    return notificationRepository.save(notification);
                })
                .map(this::toResponse)
                .toList();
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .status(n.getStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
