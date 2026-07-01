package com.trustfund.model.dto;

import com.trustfund.model.enums.ComplaintStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class ComplaintResponse {
    UUID id;
    UUID campaignId;
    String campaignTitle;
    UUID userId;
    String userName;
    String userEmail;
    String description;
    ComplaintStatus status;
    Instant createdAt;
}
