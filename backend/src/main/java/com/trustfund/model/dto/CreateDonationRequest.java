package com.trustfund.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateDonationRequest {
    @NotNull
    private UUID campaignId;

    @NotNull
    @DecimalMin(value = "1.0", inclusive = true)
    private BigDecimal amount;

    @NotBlank
    private String paymentMethod;
}
