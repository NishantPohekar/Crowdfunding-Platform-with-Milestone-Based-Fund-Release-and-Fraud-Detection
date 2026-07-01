package com.trustfund.model.dto;

import com.trustfund.model.enums.MilestoneStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Value
@Builder
public class MilestoneResponse {
    UUID id;
    UUID campaignId;
    String title;
    String description;
    BigDecimal amount;
    MilestoneStatus status;
    LocalDate dueDate;
    String proofUrl;
    String proofNotes;
    Instant proofSubmittedAt;
    BigDecimal releasedAmount;
    Instant releasedAt;
    String releasedByName;
    int sequenceOrder;
}
