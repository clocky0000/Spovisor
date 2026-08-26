package com.spovisor.backend.feature;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedCourseRepository extends JpaRepository<SavedCourse, Long> {
    List<SavedCourse> findAllByUserIdOrderBySavedAtDesc(Long userId);
    Optional<SavedCourse> findByIdAndUserId(Long id, Long userId);
}
