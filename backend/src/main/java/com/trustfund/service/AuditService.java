package com.trustfund.service;

import com.trustfund.model.entity.AuditLog;
import com.trustfund.model.entity.User;
import com.trustfund.repository.AuditLogRepository;
import com.trustfund.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(UUID userId, String action, String entityType, UUID entityId, String details) {
        User user = userRepository.getReferenceById(userId);
        AuditLog log = AuditLog.builder()
                .action(action)
                .performedBy(user)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
