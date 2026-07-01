package com.trustfund.controller;

import com.trustfund.model.dto.ActionReasonRequest;
import com.trustfund.model.dto.CampaignResponse;
import com.trustfund.model.dto.CreateCampaignRequest;
import com.trustfund.model.dto.PageResponse;
import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.security.SecurityUtils;
import com.trustfund.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping
    @PreAuthorize("hasRole('CREATOR')")
    public CampaignResponse create(@Valid @RequestBody CreateCampaignRequest request) {
        return campaignService.create(request, SecurityUtils.currentUserId());
    }

    @GetMapping
    public PageResponse<CampaignResponse> list(
            @RequestParam(required = false) CampaignStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return campaignService.list(status, page, size);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CREATOR')")
    public List<CampaignResponse> myCampaigns() {
        return campaignService.getMyCampaigns(SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}")
    public CampaignResponse getById(@PathVariable UUID id) {
        return campaignService.getById(id);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public CampaignResponse approve(@PathVariable UUID id) {
        return campaignService.approve(id, SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public CampaignResponse reject(@PathVariable UUID id, @RequestBody(required = false) ActionReasonRequest request) {
        return campaignService.reject(id, SecurityUtils.currentUserId(), request != null ? request.getReason() : null);
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public CampaignResponse archive(@PathVariable UUID id, @RequestBody(required = false) ActionReasonRequest request) {
        return campaignService.archive(id, SecurityUtils.currentUserId(), request != null ? request.getReason() : null);
    }

    @PutMapping("/{id}/restart")
    @PreAuthorize("hasRole('ADMIN')")
    public CampaignResponse restart(@PathVariable UUID id) {
        return campaignService.restart(id, SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREATOR')")
    public void delete(@PathVariable UUID id) {
        campaignService.delete(id, SecurityUtils.currentUserId());
    }
}
