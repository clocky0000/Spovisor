package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spovisor.backend.spot.SpotSearchResponse;
import com.spovisor.backend.spot.SpotSearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecommendationRegionValidatorTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private SpotSearchService spotSearchService;
    private RecommendationRegionValidator validator;

    @BeforeEach
    void setUp() {
        spotSearchService = mock(SpotSearchService.class);
        validator = new RecommendationRegionValidator(spotSearchService);
        when(spotSearchService.search("수원KT위즈파크")).thenReturn(List.of(
                spot("수원KT위즈파크", 127.0097, 37.2998)
        ));
    }

    @Test
    void acceptsIncludedPlaceInsideStadiumTravelArea() throws Exception {
        JsonNode survey = objectMapper.readTree("""
                {
                  "경기장": "수원KT위즈파크",
                  "고정핀": [{"name": "화성행궁", "longitude": 127.0142, "latitude": 37.2879}]
                }
                """);

        assertDoesNotThrow(() -> validator.validate(survey));
    }

    @Test
    void rejectsIncludedPlaceFarFromStadium() throws Exception {
        JsonNode survey = objectMapper.readTree("""
                {
                  "경기장": "수원KT위즈파크",
                  "고정핀": [{"name": "대구시청", "longitude": 128.6017, "latitude": 35.8714}]
                }
                """);

        assertThrows(IllegalArgumentException.class, () -> validator.validate(survey));
    }

    private static SpotSearchResponse spot(String name, double longitude, double latitude) {
        return new SpotSearchResponse(
                "test-spot", name, "", null, null, longitude, latitude, "", "", ""
        );
    }
}
