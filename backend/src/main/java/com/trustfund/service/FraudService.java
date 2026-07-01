package com.trustfund.service;

import com.trustfund.model.dto.FraudAlertResponse;
import com.trustfund.model.entity.Campaign;
import com.trustfund.model.entity.FraudAlert;
import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.model.enums.PaymentStatus;
import com.trustfund.model.enums.RiskLevel;
import com.trustfund.service.NotificationService;
import com.trustfund.repository.CampaignRepository;
import com.trustfund.repository.ComplaintRepository;
import com.trustfund.repository.DonationRepository;
import com.trustfund.repository.FraudAlertRepository;
import com.trustfund.repository.MilestoneRepository;
import com.trustfund.model.enums.MilestoneStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudService {

    private final FraudAlertRepository fraudAlertRepository;
    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    private final ComplaintRepository complaintRepository;
    private final MilestoneRepository milestoneRepository;
    private final NotificationService notificationService;

    @Transactional
    public FraudAlert evaluateCampaign(UUID campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new com.trustfund.exception.ResourceNotFoundException("Campaign not found"));

        int score = 0;
        List<String> reasons = new ArrayList<>();

        BigDecimal last24h = donationRepository.sumSuccessfulDonationsSince(
                campaignId, Instant.now().minus(24, ChronoUnit.HOURS));
        long totalDonations = donationRepository.countByCampaignIdAndPaymentStatus(campaignId, PaymentStatus.SUCCESS);
        if (totalDonations > 0 && last24h.compareTo(BigDecimal.valueOf(100000)) > 0) {
            score += 30;
            reasons.add("Unusual donation velocity in last 24 hours");
        }

        long pendingMilestones = milestoneRepository.countByCampaignIdAndStatusNot(campaignId, MilestoneStatus.RELEASED);
        if (campaign.getStatus() == CampaignStatus.ACTIVE && pendingMilestones > 0
                && campaign.getCreatedAt().isBefore(Instant.now().minus(60, ChronoUnit.DAYS))) {
            score += 25;
            reasons.add("Milestone stagnation over 60 days");
        }

        long similar = java.util.Objects.requireNonNullElse(
                campaignRepository.countSimilarByCreator(
                        campaign.getCreator().getId(), campaign.getTitle(), campaign.getId()),
                0L);
        if (similar > 0) {
            score += 20;
            reasons.add("Duplicate campaign title pattern detected");
        }

        long complaints = complaintRepository.countByCampaignId(campaignId);
        if (complaints > 0) {
            score += Math.min((int) complaints * 5, 15);
            reasons.add("Grievance volume: " + complaints);
        }

        long creatorCampaigns = campaignRepository.countByCreatorId(campaign.getCreator().getId());
        if (creatorCampaigns == 1 && campaign.getStatus() == CampaignStatus.REJECTED) {
            score += 10;
            reasons.add("New creator with rejected campaign history");
        }

        score = Math.min(score, 100);
        RiskLevel level = classify(score);
        String reason = reasons.isEmpty() ? "Routine check - no anomalies" : String.join("; ", reasons);

        FraudAlert alert = FraudAlert.builder()
                .campaign(campaign)
                .riskScore(score)
                .riskLevel(level)
                .reason(reason)
                .build();
        fraudAlertRepository.save(alert);

        if (level == RiskLevel.HIGH && campaign.getStatus() == CampaignStatus.ACTIVE) {
            campaign.setStatus(CampaignStatus.PAUSED);
            campaignRepository.save(campaign);
            notificationService.notifyUser(campaign.getCreator().getId(),
                    "Campaign paused due to high fraud risk score: " + score);
            log.warn("Campaign {} auto-paused due to HIGH fraud risk", campaignId);
        } else if (level == RiskLevel.MEDIUM) {
            log.info("MEDIUM fraud alert for campaign {}: score={}", campaignId, score);
        }

        return alert;
    }

    @Transactional(readOnly = true)
    public List<FraudAlertResponse> getAlerts() {
        return fraudAlertRepository.findByRiskLevelInOrderByRiskScoreDesc(List.of(RiskLevel.MEDIUM, RiskLevel.HIGH))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RiskLevel classify(int score) {
        if (score >= 71) return RiskLevel.HIGH;
        if (score >= 41) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private FraudAlertResponse toResponse(FraudAlert alert) {
        return FraudAlertResponse.builder()
                .id(alert.getId())
                .campaignId(alert.getCampaign().getId())
                .campaignTitle(alert.getCampaign().getTitle())
                .riskScore(alert.getRiskScore())
                .riskLevel(alert.getRiskLevel())
                .reason(alert.getReason())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
