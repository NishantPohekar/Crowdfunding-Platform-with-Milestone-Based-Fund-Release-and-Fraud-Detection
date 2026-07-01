package com.trustfund.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateComplaintRequest {
    @NotNull
    private UUID campaignId;

    @NotBlank
    private String description;
}
