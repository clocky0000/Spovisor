package com.spovisor.backend.feature;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripHistoryRepository extends JpaRepository<TripHistory, Long> {
    List<TripHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<TripHistory> findByIdAndUserId(Long id, Long userId);
}
