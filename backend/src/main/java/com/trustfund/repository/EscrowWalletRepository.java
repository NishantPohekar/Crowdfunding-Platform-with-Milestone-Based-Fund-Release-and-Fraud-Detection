package com.trustfund.repository;

import com.trustfund.model.entity.EscrowWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface EscrowWalletRepository extends JpaRepository<EscrowWallet, UUID> {
    Optional<EscrowWallet> findByCampaignId(UUID campaignId);
    boolean existsByCampaignId(UUID campaignId);

    @Query("SELECT COALESCE(SUM(e.balance), 0) FROM EscrowWallet e")
    BigDecimal sumBalance();

    @Query("SELECT COALESCE(SUM(e.lockedAmount), 0) FROM EscrowWallet e")
    BigDecimal sumLockedAmount();

    @Query("SELECT COALESCE(SUM(e.releasedAmount), 0) FROM EscrowWallet e")
    BigDecimal sumReleasedAmount();
}
