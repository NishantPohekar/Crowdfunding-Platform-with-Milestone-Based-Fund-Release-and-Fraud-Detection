package com.trustfund.controller;

import com.trustfund.model.dto.AuthResponse;
import com.trustfund.model.dto.ForgotPasswordRequest;
import com.trustfund.model.dto.ForgotPasswordResponse;
import com.trustfund.model.dto.LoginRequest;
import com.trustfund.model.dto.RefreshRequest;
import com.trustfund.model.dto.RegisterRequest;
import com.trustfund.model.dto.ResetPasswordRequest;
import com.trustfund.model.dto.UpdateProfileRequest;
import com.trustfund.security.SecurityUtils;
import com.trustfund.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request.getEmail());
    }

    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public AuthResponse profile() {
        return authService.profile(SecurityUtils.currentUserId());
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public AuthResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(SecurityUtils.currentUserId(), request);
    }
}
