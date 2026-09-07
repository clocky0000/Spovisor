package com.spovisor.backend.spot;

public record SpotImageResponse(
        String imageUrl,
        String thumbnailUrl,
        String sourceUrl
) {
}
