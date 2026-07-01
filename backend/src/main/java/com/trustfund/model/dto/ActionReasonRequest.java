package com.trustfund.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActionReasonRequest {
    @Size(max = 500)
    private String reason;
}
