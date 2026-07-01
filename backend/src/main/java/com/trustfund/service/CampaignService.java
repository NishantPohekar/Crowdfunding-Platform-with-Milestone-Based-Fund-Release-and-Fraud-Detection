package com.trustfund.service;

import com.trustfund.service.AuditService;
import com.trustfund.model.dto.CampaignResponse;
import com.trustfund.model.dto.CreateCampaignRequest;
import com.trustfund.model.dto.PageResponse;
import com.trustfund.service.EscrowService;
import com.trustfund.exception.BadRequestException;
import com.trustfund.exception.ForbiddenException;
import com.trustfund.exception.ResourceNotFoundException;
import com.trustfund.model.dto.MilestoneResponse;
import com.trustfund.model.entity.Campaign;
import com.trustfund.model.entity.FundRelease;
import com.trustfund.model.entity.Milestone;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.model.enums.MilestoneStatus;
import com.trustfund.model.enums.Role;
import com.trustfund.service.NotificationService;
import com.trustfund.repository.CampaignRepository;
import com.trustfund.repository.DonationRepository;
import com.trustfund.repository.FundReleaseRepository;
import com.trustfund.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final DonationRepository donationRepository;
    private final FundReleaseRepository fundReleaseRepository;
    private final EscrowService escrowService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public CampaignResponse create(CreateCampaignRequest request, UUID creatorId) {
        BigDecimal milestoneTotal = request.getMilestones().stream()
                .map(CreateCampaignRequest.MilestoneRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (milestoneTotal.compareTo(request.getTargetAmount()) > 0) {
            throw new BadRequestException("Milestone amounts cannot exceed target amount");
        }

        User creator = userRepository.getReferenceById(creatorId);
        Campaign campaign = Campaign.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .verificationDocumentUrl(request.getVerificationDocumentUrl())
                .verificationNotes(request.getVerificationNotes())
                .targetAmount(request.getTargetAmount())
                .raisedAmount(BigDecimal.ZERO)
                .status(CampaignStatus.PENDING)
                .creator(creator)
                .build();

        AtomicInteger order = new AtomicInteger(0);
        for (CreateCampaignRequest.MilestoneRequest mr : request.getMilestones()) {
            Milestone milestone = Milestone.builder()
                    .campaign(campaign)
                    .title(mr.getTitle())
                    .description(mr.getDescription())
                    .amount(mr.getAmount())
                    .dueDate(mr.getDueDate())
                    .status(MilestoneStatus.PENDING)
                    .sequenceOrder(order.getAndIncrement())
                    .build();
            campaign.getMilestones().add(milestone);
        }

        campaignRepository.save(campaign);
        notificationService.notifyUser(creatorId, "Campaign submitted for admin review: " + campaign.getTitle());
        notificationService.notifyRole(Role.ADMIN, "New campaign pending approval: " + campaign.getTitle());
        return toResponse(campaign);
    }

    @Transactional(readOnly = true)
    public PageResponse<CampaignResponse> list(CampaignStatus status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Campaign> campaigns = status != null
                ? campaignRepository.findByStatus(status, pageRequest)
                : campaignRepository.findAll(pageRequest);
        return PageResponse.<CampaignResponse>builder()
                .content(campaigns.getContent().stream().map(this::toResponse).toList())
                .page(campaigns.getNumber())
                .size(campaigns.getSize())
                .totalElements(campaigns.getTotalElements())
                .totalPages(campaigns.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public CampaignResponse getById(UUID id) {
        return toResponse(findCampaign(id));
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getMyCampaigns(UUID creatorId) {
        return campaignRepository.findByCreatorId(creatorId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CampaignResponse approve(UUID campaignId, UUID adminId) {
        Campaign campaign = findCampaign(campaignId);
        if (campaign.getStatus() != CampaignStatus.PENDING && campaign.getStatus() != CampaignStatus.REJECTED) {
            throw new BadRequestException("Only pending or rejected campaigns can be approved");
        }
        if (campaign.getVerificationDocumentUrl() == null || campaign.getVerificationDocumentUrl().isBlank()) {
            throw new BadRequestException("Campaign verification document is required before approval");
        }
        campaign.setStatus(CampaignStatus.ACTIVE);
        campaign.setRejectionReason(null);
        campaign.setPauseReason(null);
        campaignRepository.save(campaign);
        escrowService.ensureWallet(campaign);
        notificationService.notifyUser(campaign.getCreator().getId(),
                "Campaign approved and published: " + campaign.getTitle());
        notificationService.notifyRole(Role.DONOR,
                "New campaign is live on TrustFund: " + campaign.getTitle());
        auditService.log(adminId, "CAMPAIGN_APPROVED", "Campaign", campaignId, null);
        return toResponse(campaign);
    }

    @Transactional
    public CampaignResponse reject(UUID campaignId, UUID adminId, String reason) {
        Campaign campaign = findCampaign(campaignId);
        if (campaign.getStatus() != CampaignStatus.PENDING
                && campaign.getStatus() != CampaignStatus.ACTIVE
                && campaign.getStatus() != CampaignStatus.PAUSED) {
            throw new BadRequestException("Only pending, active, or paused campaigns can be rejected");
        }
        if (campaign.getStatus() != CampaignStatus.PENDING && donationRepository.countByCampaignId(campaignId) > 0) {
            throw new BadRequestException("Campaign has donation history. Pause it instead of rejecting.");
        }
        campaign.setStatus(CampaignStatus.REJECTED);
        campaign.setRejectionReason(cleanReason(reason));
        campaign.setPauseReason(null);
        campaignRepository.save(campaign);
        notificationService.notifyUser(campaign.getCreator().getId(),
                "Campaign rejected: " + campaign.getTitle() + reasonSuffix(reason));
        auditService.log(adminId, "CAMPAIGN_REJECTED", "Campaign", campaignId, reason);
        return toResponse(campaign);
    }

    @Transactional
    public CampaignResponse archive(UUID campaignId, UUID adminId, String reason) {
        Campaign campaign = findCampaign(campaignId);
        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new BadRequestException("Only active campaigns can be paused");
        }
        campaign.setStatus(CampaignStatus.PAUSED);
        campaign.setPauseReason(cleanReason(reason));
        campaignRepository.save(campaign);
        notificationService.notifyUser(campaign.getCreator().getId(),
                "Campaign paused by admin: " + campaign.getTitle() + reasonSuffix(reason));
        auditService.log(adminId, "CAMPAIGN_PAUSED", "Campaign", campaignId, reason);
        return toResponse(campaign);
    }

    @Transactional
    public CampaignResponse restart(UUID campaignId, UUID adminId) {
        Campaign campaign = findCampaign(campaignId);
        if (campaign.getStatus() != CampaignStatus.PAUSED) {
            throw new BadRequestException("Only paused campaigns can be restarted");
        }
        campaign.setStatus(CampaignStatus.ACTIVE);
        campaign.setPauseReason(null);
        campaignRepository.save(campaign);
        escrowService.ensureWallet(campaign);
        notificationService.notifyUser(campaign.getCreator().getId(),
                "Campaign restarted by admin: " + campaign.getTitle());
        auditService.log(adminId, "CAMPAIGN_RESTARTED", "Campaign", campaignId, null);
        return toResponse(campaign);
    }

    @Transactional
    public void delete(UUID campaignId, UUID userId) {
        Campaign campaign = findCampaign(campaignId);
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean isCreatorOwner = actor.getRole() == Role.CREATOR && campaign.getCreator().getId().equals(userId);
        boolean isAdmin = actor.getRole() == Role.ADMIN;
        if (!isAdmin && !isCreatorOwner) {
            throw new ForbiddenException("You can delete only your own campaign");
        }
        if (donationRepository.countByCampaignId(campaignId) > 0) {
            throw new BadRequestException("Campaign has donation history. Pause it instead of deleting.");
        }
        if (isCreatorOwner && campaign.getStatus() != CampaignStatus.PENDING && campaign.getStatus() != CampaignStatus.REJECTED) {
            throw new BadRequestException("Creators can delete only pending or rejected campaigns");
        }
        if (isAdmin && (campaign.getStatus() == CampaignStatus.ACTIVE || campaign.getStatus() == CampaignStatus.DONE)) {
            throw new BadRequestException("Active or completed campaigns cannot be deleted");
        }
        String title = campaign.getTitle();
        UUID creatorId = campaign.getCreator().getId();
        campaignRepository.delete(campaign);
        if (isAdmin && !creatorId.equals(userId)) {
            notificationService.notifyUser(creatorId, "Campaign deleted by admin: " + title);
        }
        auditService.log(userId, isAdmin ? "CAMPAIGN_DELETED" : "CREATOR_CAMPAIGN_DELETED", "Campaign", campaignId, null);
    }

    private Campaign findCampaign(UUID id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
    }

    CampaignResponse toResponse(Campaign campaign) {
        List<MilestoneResponse> milestones = campaign.getMilestones().stream()
                .sorted((a, b) -> Integer.compare(a.getSequenceOrder(), b.getSequenceOrder()))
                .map(m -> {
                    FundRelease release = fundReleaseRepository.findFirstByMilestoneIdOrderByReleasedAtDesc(m.getId()).orElse(null);
                    return MilestoneResponse.builder()
                            .id(m.getId())
                            .campaignId(campaign.getId())
                            .title(m.getTitle())
                            .description(m.getDescription())
                            .amount(m.getAmount())
                            .status(m.getStatus())
                            .dueDate(m.getDueDate())
                            .proofUrl(m.getProofUrl())
                            .proofNotes(m.getProofNotes())
                            .proofSubmittedAt(m.getProofSubmittedAt())
                            .releasedAmount(release != null ? release.getAmount() : null)
                            .releasedAt(release != null ? release.getReleasedAt() : null)
                            .releasedByName(release != null && release.getReleasedBy() != null ? release.getReleasedBy().getName() : null)
                            .sequenceOrder(m.getSequenceOrder())
                            .build();
                })
                .toList();

        return CampaignResponse.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .description(campaign.getDescription())
                .imageUrl(campaign.getImageUrl())
                .verificationDocumentUrl(campaign.getVerificationDocumentUrl())
                .verificationNotes(campaign.getVerificationNotes())
                .rejectionReason(campaign.getRejectionReason())
                .pauseReason(campaign.getPauseReason())
                .targetAmount(campaign.getTargetAmount())
                .raisedAmount(campaign.getRaisedAmount())
                .status(campaign.getStatus())
                .creatorId(campaign.getCreator().getId())
                .creatorName(campaign.getCreator().getName())
                .milestones(milestones)
                .createdAt(campaign.getCreatedAt())
                .build();
    }

    public void assertCreator(Campaign campaign, UUID userId) {
        if (!campaign.getCreator().getId().equals(userId)) {
            throw new ForbiddenException("Not the campaign creator");
        }
    }

    private String reasonSuffix(String reason) {
        String cleanReason = cleanReason(reason);
        return cleanReason == null ? "" : ". Reason: " + cleanReason;
    }

    private String cleanReason(String reason) {
        return reason == null || reason.isBlank() ? null : reason.trim();
    }
}
