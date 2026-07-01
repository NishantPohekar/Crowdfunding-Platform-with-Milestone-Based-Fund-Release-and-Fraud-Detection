package com.trustfund.model.dto;

import com.trustfund.model.enums.Role;
import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class AuthResponse {
    String accessToken;
    String refreshToken;
    UUID userId;
    String name;
    String email;
    Role role;
    long expiresIn;
}
