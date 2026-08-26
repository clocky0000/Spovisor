package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveCourseRequest(
        @NotBlank String title,
        String stadium,
        String courseType,
        @NotNull JsonNode course
) {
}
