package com.spovisor.backend.feature;

import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDate;

public record CreateTripRequest(
        @NotBlank String stadium,
        String matchName,
        LocalDate tripDate,
        String courseTitle,
        JsonNode course
) {
}
