package com.trustfund.service;

import com.trustfund.model.dto.PageResponse;
import com.trustfund.model.dto.CreateDonationRequest;
import com.trustfund.model.dto.DonationResponse;
import com.trustfund.service.EscrowService;
import com.trustfund.exception.BadRequestException;
import com.trustfund.exception.ResourceNotFoundException;
import com.trustfund.service.FraudService;
import com.trustfund.model.entity.Campaign;
import com.trustfund.model.entity.Donation;
import com.trustfund.model.entity.User;
import com.trustfund.model.enums.CampaignStatus;
import com.trustfund.model.enums.PaymentStatus;
import com.trustfund.model.enums.Role;
import com.trustfund.service.NotificationService;
import com.trustfund.repository.CampaignRepository;
import com.trustfund.repository.DonationRepository;
import com.trustfund.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final EscrowService escrowService;
    private final FraudService fraudService;
    private final NotificationService notificationService;

    @Transactional
    public DonationResponse donate(CreateDonationRequest request, UUID donorId) {
        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));

        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new BadRequestException("Donations only accepted for active campaigns");
        }

        User donor = userRepository.getReferenceById(donorId);
        Donation donation = Donation.builder()
                .campaign(campaign)
                .donor(donor)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        donationRepository.save(donation);

        PaymentService.PaymentResult result = paymentService.process(donation);
        donation.setPaymentStatus(result.status());
        donation.setPaymentReference(result.reference());

        BigDecimal escrowBalance = BigDecimal.ZERO;
        if (result.status() == PaymentStatus.SUCCESS) {
            campaign.setRaisedAmount(campaign.getRaisedAmount().add(request.getAmount()));
            campaignRepository.save(campaign);
            escrowBalance = escrowService.credit(campaign.getId(), request.getAmount()).getBalance();
            notificationService.notifyUser(campaign.getCreator().getId(),
                    "New donation of INR " + request.getAmount() + " is locked in escrow for " + campaign.getTitle());
            notificationService.notifyUser(donorId,
                    "Donation successful: INR " + request.getAmount() + " to " + campaign.getTitle() + " is held in escrow until milestone release.");
            notificationService.notifyRole(Role.ADMIN,
                    "New donation received: INR " + request.getAmount() + " for campaign " + campaign.getTitle());
            fraudService.evaluateCampaign(campaign.getId());
        }

        donationRepository.save(donation);
        return toResponse(donation, escrowBalance);
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getMyDonations(UUID donorId, int page, int size) {
        Page<Donation> donations = donationRepository.findByDonorIdOrderByDonatedAtDesc(
                donorId, PageRequest.of(page, size));
        return PageResponse.<DonationResponse>builder()
                .content(donations.getContent().stream().map(d -> toResponse(d, null)).toList())
                .page(donations.getNumber())
                .size(donations.getSize())
                .totalElements(donations.getTotalElements())
                .totalPages(donations.getTotalPages())
                .build();
    }

    @Transactional
    public void handleWebhook(String paymentReference, PaymentStatus status) {
        // Placeholder for Razorpay webhook handling
    }

    private DonationResponse toResponse(Donation d, BigDecimal escrowBalance) {
        return DonationResponse.builder()
                .id(d.getId())
                .campaignId(d.getCampaign().getId())
                .campaignTitle(d.getCampaign().getTitle())
                .amount(d.getAmount())
                .paymentStatus(d.getPaymentStatus())
                .paymentMethod(d.getPaymentMethod())
                .escrowBalance(escrowBalance)
                .donatedAt(d.getDonatedAt())
                .build();
    }
}
