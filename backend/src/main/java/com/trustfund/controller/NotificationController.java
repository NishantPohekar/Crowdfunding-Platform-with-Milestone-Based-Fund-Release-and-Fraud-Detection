package com.trustfund.controller;

import com.trustfund.model.dto.NotificationResponse;
import com.trustfund.security.SecurityUtils;
import com.trustfund.service.NotificationService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Hidden
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list() {
        return notificationService.getForUser(SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable UUID id) {
        return notificationService.markRead(id, SecurityUtils.currentUserId());
    }

    @PutMapping("/read-all")
    public List<NotificationResponse> markAllRead() {
        return notificationService.markAllRead(SecurityUtils.currentUserId());
    }
}
