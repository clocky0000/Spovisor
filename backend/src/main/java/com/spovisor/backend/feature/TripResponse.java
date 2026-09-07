package com.spovisor.backend.feature;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public record TripResponse(
        Long id,
        String stadium,
        String matchName,
        LocalDate tripDate,
        String courseTitle,
        Integer rating,
        List<Long> visitedSpotIds,
        JsonNode course,
        String status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {
    public static TripResponse from(TripHistory item) {
        List<Long> spots = item.getVisitedSpotIds() == null || item.getVisitedSpotIds().isBlank()
                ? List.of()
                : Arrays.stream(item.getVisitedSpotIds().split(",")).map(Long::valueOf).toList();
        JsonNode course = null;
        if (item.getCourseJson() != null && !item.getCourseJson().isBlank()) {
            try { course = new ObjectMapper().readTree(item.getCourseJson()); } catch (Exception ignored) { }
        }
        return new TripResponse(item.getId(), item.getStadium(), item.getMatchName(), item.getTripDate(), item.getCourseTitle(), item.getRating(), spots, course, item.getStatus(), item.getExpiresAt(), item.getCreatedAt());
    }
}
