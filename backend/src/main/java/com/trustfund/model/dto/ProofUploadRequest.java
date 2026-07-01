package com.trustfund.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProofUploadRequest {
    @NotBlank
    private String proofUrl;

    private String notes;
}
