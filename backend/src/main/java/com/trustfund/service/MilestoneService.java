package com.trustfund.service;

import com.trustfund.service.AuditService;
import com.trustfund.service.CampaignService;
import com.trustfund.service.EscrowService;
import com.trustfund.exception.BadRequestException;
import com.trustfund.exception.ResourceNotFoundException;
import com.trustfund.model.dto.MilestoneResponse;
import com.trustfund.model.dto.ProofUploadRequest;
import com.trustfund.model.entity.Campaign;
import com.trustfund.model.entity.FundRelease;
import com.trustfund.model.entity.Milestone;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.model.enums.FundReleaseStatus;
import com.trustfund.model.enums.MilestoneStatus;
import com.trustfund.model.enums.PaymentStatus;
import com.trustfund.model.enums.Role;
import com.trustfund.service.NotificationService;
import com.trustfund.repository.DonationRepository;
import com.trustfund.repository.FundReleaseRepository;
import com.trustfund.repository.MilestoneRepository;
import com.trustfund.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final FundReleaseRepository fundReleaseRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final CampaignService campaignService;
    private final EscrowService escrowService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public MilestoneResponse uploadProof(UUID milestoneId, ProofUploadRequest request, UUID creatorId) {
        Milestone milestone = findMilestone(milestoneId);
        Campaign campaign = milestone.getCampaign();
        campaignService.assertCreator(campaign, creatorId);

        if (milestone.getStatus() != MilestoneStatus.PENDING) {
            throw new BadRequestException("Proof can only be uploaded for pending milestones");
        }

        milestone.setProofUrl(request.getProofUrl());
        milestone.setProofNotes(request.getNotes());
        milestone.setProofSubmittedAt(Instant.now());
        milestone.setStatus(MilestoneStatus.PROOF_SUBMITTED);
        milestoneRepository.save(milestone);

        notificationService.notifyUser(creatorId, "Proof submitted for milestone: " + milestone.getTitle());
        notificationService.notifyRole(Role.ADMIN,
                "Proof submitted for campaign " + campaign.getTitle() + ": " + milestone.getTitle());
        return toResponse(milestone);
    }

    @Transactional
    public MilestoneResponse verify(UUID milestoneId, UUID adminId) {
        Milestone milestone = findMilestone(milestoneId);
        if (milestone.getStatus() != MilestoneStatus.PROOF_SUBMITTED) {
            throw new BadRequestException("Milestone must have proof submitted before verification");
        }
        milestone.setStatus(MilestoneStatus.VERIFIED);
        milestoneRepository.save(milestone);
        auditService.log(adminId, "MILESTONE_VERIFIED", "Milestone", milestoneId, null);
        notificationService.notifyUser(milestone.getCampaign().getCreator().getId(),
                "Milestone verified: " + milestone.getTitle());
        return toResponse(milestone);
    }

    @Transactional
    public MilestoneResponse undoVerify(UUID milestoneId, UUID adminId) {
        Milestone milestone = findMilestone(milestoneId);
        if (milestone.getStatus() != MilestoneStatus.VERIFIED) {
            throw new BadRequestException("Only verified milestones can be sent back for review");
        }
        milestone.setStatus(MilestoneStatus.PROOF_SUBMITTED);
        milestoneRepository.save(milestone);
        auditService.log(adminId, "MILESTONE_VERIFICATION_UNDONE", "Milestone", milestoneId, null);
        notificationService.notifyUser(milestone.getCampaign().getCreator().getId(),
                "Milestone verification was reopened for review: " + milestone.getTitle());
        return toResponse(milestone);
    }

    @Transactional
    public MilestoneResponse release(UUID milestoneId, UUID adminId) {
        Milestone milestone = findMilestone(milestoneId);
        Campaign campaign = milestone.getCampaign();

        if (milestone.getStatus() != MilestoneStatus.VERIFIED) {
            throw new BadRequestException("Milestone must be verified before fund release");
        }

        if (campaign.getStatus() != CampaignStatus.ACTIVE && campaign.getStatus() != CampaignStatus.PAUSED) {
            throw new BadRequestException("Campaign is not eligible for fund release");
        }

        User admin = userRepository.getReferenceById(adminId);
        escrowService.release(campaign.getId(), milestone.getAmount());

        FundRelease fundRelease = FundRelease.builder()
                .milestone(milestone)
                .amount(milestone.getAmount())
                .status(FundReleaseStatus.RELEASED)
                .releasedAt(Instant.now())
                .releasedBy(admin)
                .build();
        fundReleaseRepository.save(fundRelease);

        milestone.setStatus(MilestoneStatus.RELEASED);
        milestoneRepository.save(milestone);

        auditService.log(adminId, "FUND_RELEASED", "Milestone", milestoneId,
                "Amount: " + milestone.getAmount());

        notificationService.notifyUser(campaign.getCreator().getId(),
                "Funds released for milestone: " + milestone.getTitle() + " (INR " + milestone.getAmount() + ")");

        donationRepository.findByCampaignIdAndPaymentStatus(campaign.getId(), PaymentStatus.SUCCESS)
                .forEach(d -> notificationService.notifyUser(d.getDonor().getId(),
                        "Funds released for milestone in campaign: " + campaign.getTitle()));

        long unreleased = milestoneRepository.countByCampaignIdAndStatusNot(campaign.getId(), MilestoneStatus.RELEASED);
        if (unreleased == 0) {
            campaign.setStatus(CampaignStatus.DONE);
        }

        return toResponse(milestone);
    }

    private Milestone findMilestone(UUID id) {
        return milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
    }

    private MilestoneResponse toResponse(Milestone m) {
        FundRelease release = fundReleaseRepository.findFirstByMilestoneIdOrderByReleasedAtDesc(m.getId()).orElse(null);
        return MilestoneResponse.builder()
                .id(m.getId())
                .campaignId(m.getCampaign().getId())
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
    }
}
