package com.trustfund.model.dto;

import com.trustfund.model.enums.PaymentStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class DonationResponse {
    UUID id;
    UUID campaignId;
    String campaignTitle;
    BigDecimal amount;
    PaymentStatus paymentStatus;
    String paymentMethod;
    BigDecimal escrowBalance;
    Instant donatedAt;
}
