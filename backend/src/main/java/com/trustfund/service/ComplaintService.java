package com.trustfund.service;

import com.trustfund.service.AuditService;
import com.trustfund.model.dto.ComplaintResponse;
import com.trustfund.model.dto.CreateComplaintRequest;
import com.trustfund.exception.ResourceNotFoundException;
import com.trustfund.service.FraudService;
import com.trustfund.model.entity.Campaign;
import com.trustfund.model.entity.Complaint;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.ComplaintStatus;
import com.trustfund.model.enums.Role;
import com.trustfund.repository.CampaignRepository;
import com.trustfund.repository.ComplaintRepository;
import com.trustfund.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final FraudService fraudService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public ComplaintResponse create(CreateComplaintRequest request, UUID userId) {
        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        User user = userRepository.getReferenceById(userId);

        Complaint complaint = Complaint.builder()
                .campaign(campaign)
                .user(user)
                .description(request.getDescription())
                .status(ComplaintStatus.OPEN)
                .build();
        complaintRepository.save(complaint);
        notificationService.notifyRole(Role.ADMIN,
                "New grievance raised for campaign: " + campaign.getTitle());
        if (!campaign.getCreator().getId().equals(userId)) {
            notificationService.notifyUser(campaign.getCreator().getId(),
                    "A grievance was raised for your campaign: " + campaign.getTitle());
        }
        notificationService.notifyUser(userId,
                "Grievance submitted for campaign: " + campaign.getTitle());
        fraudService.evaluateCampaign(campaign.getId());
        return toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> listAll() {
        return complaintRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> listForUser(UUID userId) {
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ComplaintResponse resolve(UUID complaintId, UUID adminId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found"));
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaintRepository.save(complaint);
        auditService.log(adminId, "COMPLAINT_RESOLVED", "Complaint", complaintId, null);
        notificationService.notifyUser(complaint.getUser().getId(),
                "Grievance resolved for campaign: " + complaint.getCampaign().getTitle());
        if (!complaint.getCampaign().getCreator().getId().equals(complaint.getUser().getId())) {
            notificationService.notifyUser(complaint.getCampaign().getCreator().getId(),
                    "Grievance resolved for your campaign: " + complaint.getCampaign().getTitle());
        }
        return toResponse(complaint);
    }

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .campaignId(c.getCampaign().getId())
                .campaignTitle(c.getCampaign().getTitle())
                .userId(c.getUser().getId())
                .userName(c.getUser().getName())
                .userEmail(c.getUser().getEmail())
                .description(c.getDescription())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
