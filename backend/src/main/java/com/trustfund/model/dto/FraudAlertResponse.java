package com.trustfund.model.dto;

import com.trustfund.model.enums.RiskLevel;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class FraudAlertResponse {
    UUID id;
    UUID campaignId;
    String campaignTitle;
    int riskScore;
    RiskLevel riskLevel;
    String reason;
    Instant createdAt;
}
