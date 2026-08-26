package com.spovisor.backend.feature;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateTripRequest(
        @NotBlank String stadium,
        String matchName,
        LocalDate tripDate,
        String courseTitle
) {
}
