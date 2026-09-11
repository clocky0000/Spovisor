package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import com.spovisor.backend.spot.SpotSearchResponse;
import com.spovisor.backend.spot.SpotSearchService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
class RecommendationRegionValidator {
    static final double MAX_INCLUDED_PLACE_DISTANCE_KM = 60.0;

    private final SpotSearchService spotSearchService;

    RecommendationRegionValidator(SpotSearchService spotSearchService) {
        this.spotSearchService = spotSearchService;
    }

    void validate(JsonNode survey) {
        if (survey == null || !survey.isObject()) return;

        JsonNode fixedPlaces = first(survey, "고정핀", "fixedPlaces");
        if (fixedPlaces == null || !fixedPlaces.isArray() || fixedPlaces.isEmpty()) return;

        JsonNode stadiumNode = first(survey, "경기장", "stadium");
        String stadiumName = stadiumNode == null ? "" : stadiumNode.asText("").trim();
        if (stadiumName.isBlank()) return;

        Coordinates stadium = resolve(stadiumName);
        if (stadium == null) {
            throw new IllegalArgumentException("경기장 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.");
        }

        for (JsonNode item : fixedPlaces) {
            String placeName = item.isTextual() ? item.asText("").trim() : item.path("name").asText("").trim();
            Coordinates place = coordinatesFrom(item);
            if (place == null && !placeName.isBlank()) place = resolve(placeName);
            if (place == null) {
                throw new IllegalArgumentException(placeName.isBlank()
                        ? "포함할 장소의 위치를 확인할 수 없습니다."
                        : placeName + "의 위치를 확인할 수 없습니다.");
            }

            if (distanceInKilometers(stadium, place) > MAX_INCLUDED_PLACE_DISTANCE_KM) {
                throw new IllegalArgumentException(placeName + "은(는) 경기장에서 너무 먼 지역이라 포함할 수 없습니다.");
            }
        }
    }

    private Coordinates resolve(String query) {
        List<SpotSearchResponse> results = spotSearchService.search(query);
        if (results.isEmpty()) return null;

        String normalizedQuery = normalize(query);
        SpotSearchResponse match = results.stream()
                .filter(RecommendationRegionValidator::hasCoordinates)
                .filter(result -> normalize(result.name()).equals(normalizedQuery))
                .findFirst()
                .orElseGet(() -> results.stream()
                        .filter(RecommendationRegionValidator::hasCoordinates)
                        .filter(result -> normalize(result.name()).contains(normalizedQuery))
                        .findFirst()
                        .orElseGet(() -> results.stream()
                                .filter(RecommendationRegionValidator::hasCoordinates)
                                .findFirst()
                                .orElse(null)));
        return match == null ? null : new Coordinates(match.latitude(), match.longitude());
    }

    private static Coordinates coordinatesFrom(JsonNode item) {
        if (!item.isObject()) return null;
        JsonNode latitude = item.get("latitude");
        JsonNode longitude = item.get("longitude");
        if (latitude == null || longitude == null || !latitude.isNumber() || !longitude.isNumber()) return null;
        return new Coordinates(latitude.asDouble(), longitude.asDouble());
    }

    private static boolean hasCoordinates(SpotSearchResponse result) {
        return result.latitude() != null && result.longitude() != null;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.replaceAll("[^\\p{L}\\p{N}]", "").toLowerCase(Locale.ROOT);
    }

    private static JsonNode first(JsonNode source, String canonical, String legacy) {
        JsonNode value = source.get(canonical);
        return value != null ? value : source.get(legacy);
    }

    static double distanceInKilometers(Coordinates from, Coordinates to) {
        double earthRadiusKm = 6371.0;
        double latitudeDelta = Math.toRadians(to.latitude() - from.latitude());
        double longitudeDelta = Math.toRadians(to.longitude() - from.longitude());
        double latitude1 = Math.toRadians(from.latitude());
        double latitude2 = Math.toRadians(to.latitude());
        double haversine = Math.pow(Math.sin(latitudeDelta / 2), 2)
                + Math.cos(latitude1) * Math.cos(latitude2) * Math.pow(Math.sin(longitudeDelta / 2), 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }

    record Coordinates(double latitude, double longitude) {
    }
}
