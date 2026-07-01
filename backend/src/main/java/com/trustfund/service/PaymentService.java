package com.trustfund.service;

import com.trustfund.model.entity.Donation;
import com.trustfund.model.enums.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${trustfund.payment.mock-enabled:true}")
    private boolean mockEnabled;

    public PaymentResult process(Donation donation) {
        if (mockEnabled) {
            return new PaymentResult(PaymentStatus.SUCCESS, "MOCK-" + UUID.randomUUID());
        }
        // Placeholder for Razorpay integration
        return new PaymentResult(PaymentStatus.PENDING, null);
    }

    public record PaymentResult(PaymentStatus status, String reference) {
    }
}
