package com.trustfund.repository;

import com.trustfund.model.entity.Campaign;
import com.trustfund.model.enums.CampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    Page<Campaign> findByStatus(CampaignStatus status, Pageable pageable);
    Page<Campaign> findAll(Pageable pageable);
    List<Campaign> findByCreatorId(UUID creatorId);
    long countByCreatorId(UUID creatorId);

    @Query("SELECT COUNT(c) FROM Campaign c WHERE c.creator.id = :creatorId AND LOWER(c.title) = LOWER(:title) AND c.id <> :excludeId")
    Long countSimilarByCreator(@Param("creatorId") UUID creatorId, @Param("title") String title, @Param("excludeId") UUID excludeId);
}
