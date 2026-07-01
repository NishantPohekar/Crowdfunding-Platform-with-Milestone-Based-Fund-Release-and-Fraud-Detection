package com.trustfund.model.entity;

import com.trustfund.model.enums.MilestoneStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "milestones")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Milestone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "proof_url")
    private String proofUrl;

    @Column(name = "proof_notes")
    private String proofNotes;

    @Column(name = "proof_submitted_at")
    private Instant proofSubmittedAt;

    @Column(name = "sequence_order", nullable = false)
    @Builder.Default
    private int sequenceOrder = 0;
}
