package com.trustfund.repository;

import com.trustfund.model.entity.Milestone;
import com.trustfund.model.enums.MilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {
    List<Milestone> findByCampaignIdOrderBySequenceOrderAsc(UUID campaignId);
    long countByCampaignIdAndStatusNot(UUID campaignId, MilestoneStatus status);

    @Query("SELECT COALESCE(SUM(m.amount), 0) FROM Milestone m WHERE m.status = 'RELEASED'")
    BigDecimal sumReleasedAmount();
}
