package com.trustfund.repository;

import com.trustfund.model.entity.Complaint;
import com.trustfund.model.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    long countByCampaignId(UUID campaignId);
    long countByCampaignIdAndStatus(UUID campaignId, ComplaintStatus status);
    long countByUserId(UUID userId);
    long countByStatus(ComplaintStatus status);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
