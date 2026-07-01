package com.trustfund.model.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ForgotPasswordResponse {
    String message;
}
