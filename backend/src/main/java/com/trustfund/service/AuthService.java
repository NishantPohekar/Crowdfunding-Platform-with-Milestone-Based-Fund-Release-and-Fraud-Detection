package com.trustfund.service;

import com.trustfund.model.dto.AuthResponse;
import com.trustfund.model.dto.ForgotPasswordResponse;
import com.trustfund.model.dto.LoginRequest;
import com.trustfund.model.dto.RefreshRequest;
import com.trustfund.model.dto.RegisterRequest;
import com.trustfund.model.dto.ResetPasswordRequest;
import com.trustfund.model.dto.UpdateProfileRequest;
import com.trustfund.exception.BadRequestException;
import com.trustfund.model.entity.RefreshToken;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.Role;
import com.trustfund.repository.RefreshTokenRepository;
import com.trustfund.repository.UserRepository;
import com.trustfund.security.JwtService;
import com.trustfund.security.UserPrincipal;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${trustfund.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be registered via API");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        userRepository.save(user);
        emailService.sendWelcomeEmail(user);

        UserPrincipal principal = new UserPrincipal(user);
        return buildAuthResponse(principal);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));
        return buildAuthResponse(new UserPrincipal(user));
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        String tokenHash = hashToken(request.getRefreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored);
            throw new BadRequestException("Refresh token expired");
        }

        UserPrincipal principal = new UserPrincipal(stored.getUser());
        if (!jwtService.isTokenValid(request.getRefreshToken(), principal)) {
            throw new BadRequestException("Invalid refresh token");
        }

        refreshTokenRepository.delete(stored);
        return buildAuthResponse(principal);
    }

    @Transactional(readOnly = true)
    public ForgotPasswordResponse forgotPassword(String email) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    String token = jwtService.generatePasswordResetToken(new UserPrincipal(user));
                    String resetPath = "/reset-password?token=" + token;
                    String resetLink = frontendUrl + resetPath;
                    emailService.sendEmail(
                            user.getEmail(),
                            "Reset your TrustFund password",
                            """
                                    Hello %s,

                                    We received a request to reset your TrustFund password.

                                    Reset your password here:
                                    %s

                                    This link expires soon. If you did not request this, you can ignore this email.

                                    TrustFund
                                    """.formatted(user.getName(), resetLink));
                    return ForgotPasswordResponse.builder()
                            .message("If this email exists, a reset link has been sent.")
                            .build();
                })
                .orElse(ForgotPasswordResponse.builder()
                        .message("If this email exists, a reset link has been sent.")
                        .build());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        try {
            if (!jwtService.hasTokenType(request.getToken(), "password-reset")) {
                throw new BadRequestException("Invalid password reset token");
            }
            UUID userId = jwtService.extractUserId(request.getToken());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BadRequestException("Invalid password reset token"));
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
            refreshTokenRepository.deleteByUserId(user.getId());
        } catch (JwtException | IllegalArgumentException e) {
            throw new BadRequestException("Invalid password reset token");
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse profile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .expiresIn(0)
                .build();
    }

    @Transactional
    public AuthResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        user.setName(request.getName().trim());
        userRepository.save(user);
        return profile(userId);
    }

    private AuthResponse buildAuthResponse(UserPrincipal principal) {
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);
        storeRefreshToken(principal, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(principal.getId())
                .name(principal.getName())
                .email(principal.getEmail())
                .role(principal.getRole())
                .expiresIn(900)
                .build();
    }

    private void storeRefreshToken(UserPrincipal principal, String refreshToken) {
        refreshTokenRepository.deleteByUserId(principal.getId());
        refreshTokenRepository.save(RefreshToken.builder()
                .user(userRepository.getReferenceById(principal.getId()))
                .tokenHash(hashToken(refreshToken))
                .expiresAt(jwtService.extractExpiration(refreshToken))
                .build());
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
