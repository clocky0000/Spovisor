package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

public record SurveyRequest(@NotNull JsonNode survey) {
}
