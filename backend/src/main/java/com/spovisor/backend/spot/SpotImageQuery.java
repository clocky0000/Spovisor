package com.spovisor.backend.spot;

public record SpotImageQuery(
        long id,
        String name,
        String category,
        Double longitude,
        Double latitude
) {
}
