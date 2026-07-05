package com.trustfund.controller;

import com.trustfund.model.dto.DonationResponse;
import com.trustfund.model.entity.Donation;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.model.enums.ComplaintStatus;
import com.trustfund.model.enums.PaymentStatus;
import com.trustfund.model.enums.RiskLevel;
import com.trustfund.repository.CampaignRepository;
import com.trustfund.repository.ComplaintRepository;
import com.trustfund.repository.DonationRepository;
import com.trustfund.repository.EscrowWalletRepository;
import com.trustfund.repository.FraudAlertRepository;
import com.trustfund.repository.MilestoneRepository;
import com.trustfund.repository.UserRepository;
import com.trustfund.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    private final ComplaintRepository complaintRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final EscrowWalletRepository escrowWalletRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;

    @Value("${trustfund.main-admin.email}")
    private String mainAdminEmail;

    @GetMapping("/public")
    public Map<String, Object> publicDashboard() {
        return Map.of(
                "totalCampaigns", campaignRepository.count(),
                "totalDonations", donationRepository.countByPaymentStatus(PaymentStatus.SUCCESS),
                "totalDonors", donationRepository.countDistinctSuccessfulDonors(),
                "totalFundsReleased", milestoneRepository.sumReleasedAmount(),
                "totalFundsRaised", donationRepository.sumSuccessfulDonations(),
                "charts", charts()
        );
    }

    @GetMapping("/donor")
    @PreAuthorize("hasRole('DONOR')")
    @Transactional(readOnly = true)
    public Map<String, Object> donorDashboard() {
        UUID donorId = SecurityUtils.currentUserId();
        List<DonationResponse> donations = donationRepository.findByDonorIdOrderByDonatedAtDesc(donorId).stream()
                .map(this::toDonationResponse)
                .toList();

        return Map.of(
                "stats", Map.of(
                        "totalDonations", donationRepository.sumSuccessfulDonationsByDonorId(donorId),
                        "campaignsSupported", donationRepository.countDistinctSuccessfulCampaignsByDonorId(donorId),
                        "activeDonations", donationRepository.countByDonorIdAndPaymentStatus(donorId, PaymentStatus.SUCCESS),
                        "complaintsRaised", complaintRepository.countByUserId(donorId)
                ),
                "donations", donations,
                "charts", chartsForDonations(donationRepository.findByDonorIdOrderByDonatedAtDesc(donorId))
        );
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminDashboard() {
        String currentEmail = SecurityUtils.currentUser().getEmail();
        return Map.of(
                "stats", Map.of(
                        "totalUsers", userRepository.count(),
                        "totalCampaigns", campaignRepository.count(),
                        "pendingCampaigns", campaignRepository.findByStatus(CampaignStatus.PENDING, org.springframework.data.domain.Pageable.unpaged()).getTotalElements(),
                        "approvedCampaigns", campaignRepository.findByStatus(CampaignStatus.ACTIVE, org.springframework.data.domain.Pageable.unpaged()).getTotalElements(),
                        "totalDonations", donationRepository.countByPaymentStatus(PaymentStatus.SUCCESS),
                        "fundsRaised", donationRepository.sumSuccessfulDonations(),
                        "fraudAlerts", fraudAlertRepository.countByRiskLevel(RiskLevel.MEDIUM) + fraudAlertRepository.countByRiskLevel(RiskLevel.HIGH),
                        "openComplaints", complaintRepository.countByStatus(ComplaintStatus.OPEN)
                ),
                "riskCounts", riskCounts(),
                "users", userRepository.findAll().stream()
                        .map(this::toUserSummary)
                        .toList(),
                "currentAdmin", Map.of(
                        "email", currentEmail,
                        "isMainAdmin", mainAdminEmail.equalsIgnoreCase(currentEmail),
                        "mainAdminEmail", mainAdminEmail
                ),
                "charts", charts()
        );
    }

    @GetMapping("/escrow")
    public Map<String, Object> escrowDashboard() {
        BigDecimal balance = escrowWalletRepository.sumBalance();
        BigDecimal locked = escrowWalletRepository.sumLockedAmount();
        BigDecimal released = escrowWalletRepository.sumReleasedAmount();
        return Map.of(
                "totalFundsHeld", locked.add(released),
                "releasedFunds", released,
                "pendingReleases", locked,
                "remainingBalance", balance,
                "charts", charts()
        );
    }

    private Map<String, Long> riskCounts() {
        return Map.of(
                "low", fraudAlertRepository.countByRiskLevel(RiskLevel.LOW),
                "medium", fraudAlertRepository.countByRiskLevel(RiskLevel.MEDIUM),
                "high", fraudAlertRepository.countByRiskLevel(RiskLevel.HIGH)
        );
    }

    private Map<String, Object> charts() {
        return Map.of(
                "trend", chartsForDonations(donationRepository.findAll()),
                "statusDistribution", Map.of(
                        "Pending", campaignRepository.findByStatus(CampaignStatus.PENDING, org.springframework.data.domain.Pageable.unpaged()).getTotalElements(),
                        "Active", campaignRepository.findByStatus(CampaignStatus.ACTIVE, org.springframework.data.domain.Pageable.unpaged()).getTotalElements(),
                        "Done", campaignRepository.findByStatus(CampaignStatus.DONE, org.springframework.data.domain.Pageable.unpaged()).getTotalElements(),
                        "Paused", campaignRepository.findByStatus(CampaignStatus.PAUSED, org.springframework.data.domain.Pageable.unpaged()).getTotalElements(),
                        "Rejected", campaignRepository.findByStatus(CampaignStatus.REJECTED, org.springframework.data.domain.Pageable.unpaged()).getTotalElements()
                ),
                "risk", riskCounts()
        );
    }

    private List<Map<String, Object>> chartsForDonations(List<Donation> donations) {
        Map<Month, BigDecimal> donationSums = donations.stream()
                .filter(d -> d.getPaymentStatus() == PaymentStatus.SUCCESS)
                .collect(Collectors.groupingBy(d -> d.getDonatedAt().atZone(java.time.ZoneOffset.UTC).getMonth(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Donation::getAmount, BigDecimal::add)));
        Map<Month, Long> campaignCounts = campaignRepository.findAll().stream()
                .collect(Collectors.groupingBy(c -> c.getCreatedAt().atZone(java.time.ZoneOffset.UTC).getMonth(),
                        LinkedHashMap::new,
                        Collectors.counting()));
        Map<Month, Long> riskCounts = fraudAlertRepository.findAll().stream()
                .filter(alert -> alert.getRiskLevel() == RiskLevel.MEDIUM || alert.getRiskLevel() == RiskLevel.HIGH)
                .collect(Collectors.groupingBy(alert -> alert.getCreatedAt().atZone(java.time.ZoneOffset.UTC).getMonth(),
                        LinkedHashMap::new,
                        Collectors.counting()));

        return java.util.Arrays.stream(Month.values())
                .map(month -> Map.<String, Object>of(
                        "name", month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        "donations", donationSums.getOrDefault(month, BigDecimal.ZERO),
                        "campaigns", campaignCounts.getOrDefault(month, 0L),
                        "risk", riskCounts.getOrDefault(month, 0L)
                ))
                .toList();
    }

    private DonationResponse toDonationResponse(Donation d) {
        return DonationResponse.builder()
                .id(d.getId())
                .campaignId(d.getCampaign().getId())
                .campaignTitle(d.getCampaign().getTitle())
                .amount(d.getAmount())
                .paymentStatus(d.getPaymentStatus())
                .paymentMethod(d.getPaymentMethod())
                .donatedAt(d.getDonatedAt())
                .build();
    }

    private Map<String, Object> toUserSummary(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "active", user.isActive(),
                "deactivationReason", user.getDeactivationReason() == null ? "" : user.getDeactivationReason(),
                "createdAt", user.getCreatedAt()
        );
    }
}
