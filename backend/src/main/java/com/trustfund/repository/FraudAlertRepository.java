package com.trustfund.repository;

import com.trustfund.model.entity.FraudAlert;
import com.trustfund.model.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {
    List<FraudAlert> findByRiskLevelInOrderByRiskScoreDesc(List<RiskLevel> levels);
    List<FraudAlert> findByCampaignIdOrderByCreatedAtDesc(UUID campaignId);
    long countByRiskLevel(RiskLevel riskLevel);
}
