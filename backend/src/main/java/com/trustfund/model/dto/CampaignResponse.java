package com.trustfund.model.dto;

import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.model.dto.MilestoneResponse;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class CampaignResponse {
    UUID id;
    String title;
    String description;
    String imageUrl;
    String verificationDocumentUrl;
    String verificationNotes;
    String rejectionReason;
    String pauseReason;
    BigDecimal targetAmount;
    BigDecimal raisedAmount;
    CampaignStatus status;
    UUID creatorId;
    String creatorName;
    List<MilestoneResponse> milestones;
    Instant createdAt;
}
