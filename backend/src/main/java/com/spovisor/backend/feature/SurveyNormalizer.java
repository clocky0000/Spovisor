package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Map;

/**
 * Converts the app-facing survey payload to the canonical payload documented
 * for the AI server. Keeping this at the backend boundary prevents a legacy
 * client payload from being persisted or forwarded with the wrong field names.
 */
final class SurveyNormalizer {
    private static final JsonNodeFactory JSON = JsonNodeFactory.instance;

    private SurveyNormalizer() {
    }

    static JsonNode normalize(JsonNode source) {
        if (source == null || !source.isObject()) {
            throw new IllegalArgumentException("설문 데이터 형식이 올바르지 않습니다.");
        }

        ObjectNode survey = JSON.objectNode();
        copyText(source, survey, "경기장", "stadium");
        copyText(source, survey, "여행_방식", "travelTiming");
        normalizeTransport(source, survey);
        copyText(source, survey, "최대이동시간", "maxTravelTime");
        copyWalkingDistance(source, survey);
        copyText(source, survey, "동행", "companion");
        copyArray(source, survey, "추가동행", "extraCompanion");
        copyText(source, survey, "컨셉", "concept");
        copyArray(source, survey, "추가조건", "extras");
        copyPlaceNames(source, survey, "고정핀", "fixedPlaces");
        copyPlaceNames(source, survey, "제외장소", "excludedPlaces");
        copyArray(source, survey, "제외조건", "excludedConditions");
        copyRatios(source, survey);
        return survey;
    }

    private static void copyText(JsonNode source, ObjectNode target, String canonical, String legacy) {
        JsonNode value = first(source, canonical, legacy);
        if (value != null && !value.isNull()) target.set(canonical, value);
    }

    private static void copyWalkingDistance(JsonNode source, ObjectNode target) {
        JsonNode value = first(source, "걷는거리", "walkingDistance");
        if (value == null || value.isNull()) return;
        String text = value.asText();
        if ("10분 이하".equals(text)) text = "10분 이내";
        if ("20분 이하".equals(text)) text = "20분 이내";
        if ("30분 이하".equals(text)) text = "30분 이내";
        target.put("걷는거리", text);
    }

    private static void normalizeTransport(JsonNode source, ObjectNode target) {
        JsonNode value = first(source, "이동방식", "transport");
        if (value == null || value.isNull()) return;

        if (value.isArray()) {
            boolean publicTransit = contains(value, "대중교통");
            boolean car = contains(value, "자차");
            boolean walking = contains(value, "도보");
            if (publicTransit && car) {
                throw new IllegalArgumentException("대중교통과 자동차는 함께 선택할 수 없습니다.");
            }
            if (publicTransit) target.put("이동방식", "대중교통+도보");
            else if (car) target.put("이동방식", "자차+도보");
            else if (walking) target.put("이동방식", "도보 단독");
            return;
        }

        String text = value.asText();
        if ("대중교통".equals(text)) text = "대중교통+도보";
        if ("자차".equals(text)) text = "자차+도보";
        if ("도보".equals(text)) text = "도보 단독";
        target.put("이동방식", text);
    }

    private static void copyArray(JsonNode source, ObjectNode target, String canonical, String legacy) {
        JsonNode value = first(source, canonical, legacy);
        if (value == null || value.isNull()) {
            target.putArray(canonical);
            return;
        }
        if (!value.isArray()) throw new IllegalArgumentException(canonical + "은 배열이어야 합니다.");
        target.set(canonical, value);
    }

    private static void copyPlaceNames(JsonNode source, ObjectNode target, String canonical, String legacy) {
        JsonNode value = first(source, canonical, legacy);
        ArrayNode names = target.putArray(canonical);
        if (value == null || value.isNull()) return;
        if (!value.isArray()) throw new IllegalArgumentException(canonical + "은 배열이어야 합니다.");

        for (JsonNode item : value) {
            if (item.isTextual()) names.add(item.asText());
            else if (item.isObject() && item.hasNonNull("name")) names.add(item.get("name").asText());
            else throw new IllegalArgumentException(canonical + "에는 장소명이 필요합니다.");
        }
    }

    private static void copyRatios(JsonNode source, ObjectNode target) {
        JsonNode value = first(source, "커스텀비율", "ratios");
        if (value == null || value.isNull()) {
            target.putNull("커스텀비율");
            return;
        }
        if (!value.isObject()) throw new IllegalArgumentException("커스텀비율은 객체여야 합니다.");
        ObjectNode ratios = target.putObject("커스텀비율");
        for (String key : new String[]{"맛집", "관광지", "자연", "쇼핑"}) {
            JsonNode ratio = value.get(key);
            if (ratio == null || !ratio.isNumber()) {
                throw new IllegalArgumentException("커스텀비율에는 " + key + " 비율이 필요합니다.");
            }
            ratios.set(key, ratio);
        }
    }

    private static JsonNode first(JsonNode source, String canonical, String legacy) {
        JsonNode value = source.get(canonical);
        return value != null ? value : source.get(legacy);
    }

    private static boolean contains(JsonNode array, String value) {
        for (JsonNode item : array) if (value.equals(item.asText())) return true;
        return false;
    }
}
