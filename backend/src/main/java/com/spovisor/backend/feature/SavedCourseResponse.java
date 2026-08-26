package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;

public record SavedCourseResponse(
        Long id,
        String title,
        String stadium,
        String courseType,
        JsonNode course,
        LocalDateTime savedAt
) {
}
