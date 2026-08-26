package com.spovisor.backend.feature;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecommendationRequestRepository extends JpaRepository<RecommendationRequestEntity, Long> {
    Optional<RecommendationRequestEntity> findByIdAndUserId(Long id, Long userId);
}
