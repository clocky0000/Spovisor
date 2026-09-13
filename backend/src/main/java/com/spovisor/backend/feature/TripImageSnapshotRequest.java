package com.spovisor.backend.feature;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record TripImageSnapshotRequest(
        @NotNull Map<String, List<String>> imageUrlsBySpotId
) {
}
