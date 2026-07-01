package com.trustfund.model.dto;

import com.trustfund.model.enums.NotificationStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class NotificationResponse {
    UUID id;
    String message;
    NotificationStatus status;
    Instant createdAt;
}
