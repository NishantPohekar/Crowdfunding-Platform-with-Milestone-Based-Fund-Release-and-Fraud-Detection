package com.trustfund.controller;

import com.trustfund.model.dto.ComplaintResponse;
import com.trustfund.model.dto.CreateComplaintRequest;
import com.trustfund.security.SecurityUtils;
import com.trustfund.service.ComplaintService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Hidden
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ComplaintResponse create(@Valid @RequestBody CreateComplaintRequest request) {
        return complaintService.create(request, SecurityUtils.currentUserId());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ComplaintResponse> listAll() {
        return complaintService.listAll();
    }

    @GetMapping("/my")
    public List<ComplaintResponse> listMine() {
        return complaintService.listForUser(SecurityUtils.currentUserId());
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ComplaintResponse resolve(@PathVariable UUID id) {
        return complaintService.resolve(id, SecurityUtils.currentUserId());
    }
}
