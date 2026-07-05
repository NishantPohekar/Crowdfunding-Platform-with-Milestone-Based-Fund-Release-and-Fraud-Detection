package com.trustfund.controller;

import com.trustfund.model.dto.FraudAlertResponse;
import com.trustfund.service.FraudService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fraud")
@RequiredArgsConstructor
public class FraudController {

    private final FraudService fraudService;

    @GetMapping("/alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<FraudAlertResponse> getAlerts() {
        return fraudService.getAlerts();
    }
}
