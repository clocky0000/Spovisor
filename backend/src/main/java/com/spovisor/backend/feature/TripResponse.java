package com.spovisor.backend.feature;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record TripResponse(
        Long id,
        String stadium,
        String matchName,
        LocalDate tripDate,
        String courseTitle,
        Integer rating,
        List<Long> visitedSpotIds,
        LocalDateTime createdAt
) {
    public static TripResponse from(TripHistory item) {
        List<Long> spots = item.getVisitedSpotIds() == null || item.getVisitedSpotIds().isBlank()
                ? List.of()
                : Arrays.stream(item.getVisitedSpotIds().split(",")).map(Long::valueOf).toList();
        return new TripResponse(item.getId(), item.getStadium(), item.getMatchName(), item.getTripDate(), item.getCourseTitle(), item.getRating(), spots, item.getCreatedAt());
    }
}
