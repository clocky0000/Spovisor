package com.spovisor.backend.spot;

public record SpotSearchResponse(
        String contentId,
        String name,
        String category,
        String areaCode,
        String sigunguCode,
        Double longitude,
        Double latitude,
        String address,
        String roadAddress,
        String providerId
) {
}
