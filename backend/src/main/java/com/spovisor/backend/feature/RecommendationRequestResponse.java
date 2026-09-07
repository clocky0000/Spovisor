package com.spovisor.backend.feature;

import java.time.LocalDateTime;

public record RecommendationRequestResponse(Long requestId, String status, LocalDateTime createdAt, String resultJson) {
    public static RecommendationRequestResponse from(RecommendationRequestEntity item) {
        return new RecommendationRequestResponse(item.getId(), item.getStatus(), item.getCreatedAt(), item.getResultJson());
    }
}
