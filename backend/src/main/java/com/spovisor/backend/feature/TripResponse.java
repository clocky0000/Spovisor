package com.spovisor.backend.feature;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

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
    private static final String IMAGE_SAFETY_VERSION = "place-relevance-v2";

    public static TripResponse from(TripHistory item) {
        List<Long> spots = item.getVisitedSpotIds() == null || item.getVisitedSpotIds().isBlank()
                ? List.of()
                : Arrays.stream(item.getVisitedSpotIds().split(",")).map(Long::valueOf).toList();
        JsonNode course = null;
        if (item.getCourseJson() != null && !item.getCourseJson().isBlank()) {
            try {
                course = new ObjectMapper().readTree(item.getCourseJson());
                removeUnverifiedImageUrls(course);
            } catch (Exception ignored) { }
        }
        return new TripResponse(item.getId(), item.getStadium(), item.getMatchName(), item.getTripDate(), item.getCourseTitle(), item.getRating(), spots, course, item.getStatus(), item.getExpiresAt(), item.getCreatedAt());
    }

    private static void removeUnverifiedImageUrls(JsonNode node) {
        if (node == null) return;
        if (node.isObject()) {
            ObjectNode object = (ObjectNode) node;
            if (object.has("imageUrls")
                    && !IMAGE_SAFETY_VERSION.equals(object.path("imageSafetyVersion").asText())) {
                object.remove("imageUrls");
            }
            object.elements().forEachRemaining(TripResponse::removeUnverifiedImageUrls);
            return;
        }
        if (node.isArray()) node.elements().forEachRemaining(TripResponse::removeUnverifiedImageUrls);
    }
}
