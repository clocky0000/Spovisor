package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;

public record SurveyResponse(JsonNode survey, LocalDateTime updatedAt) {
}
