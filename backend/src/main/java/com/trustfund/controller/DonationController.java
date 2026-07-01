package com.trustfund.controller;

import com.trustfund.model.dto.PageResponse;
import com.trustfund.model.dto.CreateDonationRequest;
import com.trustfund.model.dto.DonationResponse;
import com.trustfund.security.SecurityUtils;
import com.trustfund.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @PostMapping
    @PreAuthorize("hasRole('DONOR')")
    public DonationResponse donate(@Valid @RequestBody CreateDonationRequest request) {
        return donationService.donate(request, SecurityUtils.currentUserId());
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('DONOR')")
    public PageResponse<DonationResponse> myDonations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return donationService.getMyDonations(SecurityUtils.currentUserId(), page, size);
    }

    @PostMapping("/webhook")
    public Map<String, String> webhook(@RequestBody Map<String, Object> payload) {
        return Map.of("status", "received");
    }
}
