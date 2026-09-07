package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record FeedbackRequestDto(
        JsonNode user_result,
        JsonNode region,
        List<String> liked_spot_names,
        List<String> disliked_spot_names
) {
    // 프론트엔드에서 빈 배열 대신 null을 보낼 경우를 대비한 안전한 Getter
    public List<String> getSafeLikedSpots() {
        return liked_spot_names != null ? liked_spot_names : List.of();
    }

    public List<String> getSafeDislikedSpots() {
        return disliked_spot_names != null ? disliked_spot_names : List.of();
    }
}