package com.trustfund.repository;

import com.trustfund.model.entity.Donation;
import com.trustfund.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DonationRepository extends JpaRepository<Donation, UUID> {
    Page<Donation> findByDonorIdOrderByDonatedAtDesc(UUID donorId, Pageable pageable);
    List<Donation> findByDonorIdOrderByDonatedAtDesc(UUID donorId);
    List<Donation> findByCampaignIdAndPaymentStatus(UUID campaignId, PaymentStatus status);

    long countByPaymentStatus(PaymentStatus status);

    long countByDonorIdAndPaymentStatus(UUID donorId, PaymentStatus status);

    @Query("SELECT COUNT(DISTINCT d.campaign.id) FROM Donation d WHERE d.donor.id = :donorId AND d.paymentStatus = 'SUCCESS'")
    long countDistinctSuccessfulCampaignsByDonorId(@Param("donorId") UUID donorId);

    @Query("SELECT COUNT(DISTINCT d.donor.id) FROM Donation d WHERE d.paymentStatus = 'SUCCESS'")
    long countDistinctSuccessfulDonors();

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.paymentStatus = 'SUCCESS'")
    BigDecimal sumSuccessfulDonations();

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.donor.id = :donorId AND d.paymentStatus = 'SUCCESS'")
    BigDecimal sumSuccessfulDonationsByDonorId(@Param("donorId") UUID donorId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.campaign.id = :campaignId AND d.paymentStatus = 'SUCCESS' AND d.donatedAt >= :since")
    BigDecimal sumSuccessfulDonationsSince(@Param("campaignId") UUID campaignId, @Param("since") Instant since);

    long countByCampaignIdAndPaymentStatus(UUID campaignId, PaymentStatus status);
    long countByCampaignId(UUID campaignId);
    long countByDonorId(UUID donorId);
}
