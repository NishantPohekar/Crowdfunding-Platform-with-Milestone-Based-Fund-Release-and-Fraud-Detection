package com.trustfund.controller;

import com.trustfund.model.dto.MilestoneResponse;
import com.trustfund.model.dto.ProofUploadRequest;
import com.trustfund.security.SecurityUtils;
import com.trustfund.service.MilestoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PostMapping("/{id}/proof")
    @PreAuthorize("hasRole('CREATOR')")
    public MilestoneResponse uploadProof(@PathVariable UUID id, @Valid @RequestBody ProofUploadRequest request) {
        return milestoneService.uploadProof(id, request, SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public MilestoneResponse verify(@PathVariable UUID id) {
        return milestoneService.verify(id, SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/undo-verify")
    @PreAuthorize("hasRole('ADMIN')")
    public MilestoneResponse undoVerify(@PathVariable UUID id) {
        return milestoneService.undoVerify(id, SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/release")
    @PreAuthorize("hasRole('ADMIN')")
    public MilestoneResponse release(@PathVariable UUID id) {
        return milestoneService.release(id, SecurityUtils.currentUserId());
    }
}
