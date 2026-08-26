package com.spovisor.backend.feature;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record TripFeedbackRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        List<Long> visitedSpotIds
) {
}
