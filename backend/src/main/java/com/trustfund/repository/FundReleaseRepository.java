package com.trustfund.repository;

import com.trustfund.model.entity.FundRelease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FundReleaseRepository extends JpaRepository<FundRelease, UUID> {
    Optional<FundRelease> findFirstByMilestoneIdOrderByReleasedAtDesc(UUID milestoneId);
}
