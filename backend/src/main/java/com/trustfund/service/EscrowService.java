package com.trustfund.service;

import com.trustfund.exception.BadRequestException;
import com.trustfund.exception.ResourceNotFoundException;
import com.trustfund.model.entity.Campaign;
import com.trustfund.model.entity.EscrowWallet;
import com.trustfund.repository.EscrowWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowWalletRepository escrowWalletRepository;

    @Transactional
    public EscrowWallet createWallet(Campaign campaign) {
        return escrowWalletRepository.save(EscrowWallet.builder()
                .campaign(campaign)
                .balance(BigDecimal.ZERO)
                .lockedAmount(BigDecimal.ZERO)
                .releasedAmount(BigDecimal.ZERO)
                .build());
    }

    @Transactional
    public EscrowWallet ensureWallet(Campaign campaign) {
        return escrowWalletRepository.findByCampaignId(campaign.getId())
                .orElseGet(() -> createWallet(campaign));
    }

    @Transactional
    public EscrowWallet credit(UUID campaignId, BigDecimal amount) {
        EscrowWallet wallet = getWallet(campaignId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLockedAmount(wallet.getLockedAmount().add(amount));
        return escrowWalletRepository.save(wallet);
    }

    @Transactional
    public EscrowWallet release(UUID campaignId, BigDecimal amount) {
        EscrowWallet wallet = getWallet(campaignId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient escrow balance");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setLockedAmount(wallet.getLockedAmount().subtract(amount));
        wallet.setReleasedAmount(wallet.getReleasedAmount().add(amount));
        return escrowWalletRepository.save(wallet);
    }

    @Transactional(readOnly = true)
    public EscrowWallet getWallet(UUID campaignId) {
        return escrowWalletRepository.findByCampaignId(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow wallet not found for campaign"));
    }

    @Transactional(readOnly = true)
    public BigDecimal getBalance(UUID campaignId) {
        return getWallet(campaignId).getBalance();
    }
}
