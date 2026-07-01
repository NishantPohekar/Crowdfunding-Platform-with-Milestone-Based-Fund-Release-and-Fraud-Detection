package com.trustfund.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateCampaignRequest {
    @NotBlank @Size(max = 200)
    private String title;

    private String description;

    private String imageUrl;

    @NotBlank
    private String verificationDocumentUrl;

    private String verificationNotes;

    @NotNull @DecimalMin(value = "1.0")
    private BigDecimal targetAmount;

    @NotEmpty @Valid
    private List<MilestoneRequest> milestones;

    @Data
    public static class MilestoneRequest {
        @NotBlank @Size(max = 200)
        private String title;

        private String description;

        @NotNull @DecimalMin(value = "1.0")
        private BigDecimal amount;

        private LocalDate dueDate;
    }
}
