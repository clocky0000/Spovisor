package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

final class SurveyRules {
    private static final Set<String> TRAVEL_TIMING = Set.of("경기 전", "경기 후", "전후 모두");
    private static final Set<String> TRANSPORT = Set.of("대중교통+도보", "자차+도보", "도보 단독");
    private static final Set<String> MAX_TRAVEL_TIME = Set.of("30분", "1시간", "1시간 30분", "2시간", "3시간");
    private static final Set<String> WALKING_DISTANCE = Set.of("10분 이내", "20분 이내", "30분 이내", "상관없음");
    private static final Set<String> COMPANIONS = Set.of("혼로여행", "친구와 여행", "연인과의 여행", "가족여행");
    private static final Set<String> EXTRA_COMPANIONS = Set.of("영유아 동반", "고령자 동반", "장애인·교통약자 동반", "반려동물 동반");
    private static final Set<String> CONCEPTS = Set.of("미식 탐방형", "관광지 중심형", "로컬 힐링형");
    private static final Set<String> EXTRA_CONDITIONS = Set.of("실내 선호", "혼잡 피하기", "페이링 가능");
    private static final Set<String> EXCLUDED_CONDITIONS = Set.of("야외 장소 제외", "너무 먼 곳 제외", "페이링 긴 곳 제외");
    private static final Set<String> RATIO_KEYS = Set.of("맛집", "관광지", "자연", "쇼핑");

    private SurveyRules() {
    }

    static void validate(JsonNode survey) {
        if (survey == null || !survey.isObject()) {
            throw new IllegalArgumentException("설문 데이터 형식이 올바르지 않습니다.");
        }

        requireText(survey, "경기장");
        requireChoice(survey, "여행_방식", TRAVEL_TIMING);
        requireChoice(survey, "이동방식", TRANSPORT);
        requireChoice(survey, "최대이동시간", MAX_TRAVEL_TIME);
        requireChoice(survey, "걷는거리", WALKING_DISTANCE);
        requireChoice(survey, "동행", COMPANIONS);
        validateArray(survey, "추가동행", EXTRA_COMPANIONS);
        validateArray(survey, "추가조건", EXTRA_CONDITIONS);
        validatePlaceNames(survey, "고정핀");
        validatePlaceNames(survey, "제외장소");
        validateArray(survey, "제외조건", EXCLUDED_CONDITIONS);

        JsonNode concept = survey.get("컨셉");
        if (concept != null && !concept.isNull() && !concept.isTextual()) {
            throw new IllegalArgumentException("컨셉 형식이 올바르지 않습니다.");
        }
        if (concept != null && !concept.isNull() && !concept.asText().isBlank() && !CONCEPTS.contains(concept.asText())) {
            throw new IllegalArgumentException("컨셉 선택값이 올바르지 않습니다.");
        }

        JsonNode ratios = survey.get("커스텀비율");
        if (ratios != null && !ratios.isNull()) {
            if (!ratios.isObject()) throw new IllegalArgumentException("커스텀비율은 객체여야 합니다.");
            Set<String> keys = new HashSet<>();
            int total = 0;
            Iterator<Map.Entry<String, JsonNode>> fields = ratios.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                keys.add(field.getKey());
                JsonNode value = field.getValue();
                if (!RATIO_KEYS.contains(field.getKey()) || !value.isIntegralNumber() || value.asInt() < 0) {
                    throw new IllegalArgumentException("커스텀비율은 맛집·관광지·자연·쇼핑의 0 이상의 정수여야 합니다.");
                }
                total += value.asInt();
            }
            if (!keys.equals(RATIO_KEYS)) throw new IllegalArgumentException("커스텀비율에는 맛집·관광지·자연·쇼핑이 모두 필요합니다.");
            if (total != 100) throw new IllegalArgumentException("직접 설정한 비율의 합계는 정확히 100이어야 합니다.");
        } else if (concept == null || concept.isNull() || concept.asText().isBlank()) {
            throw new IllegalArgumentException("컨셉 또는 커스텀비율을 선택해주세요.");
        }
    }

    private static void requireText(JsonNode survey, String field) {
        JsonNode value = survey.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            throw new IllegalArgumentException(field + "은 필수입니다.");
        }
    }

    private static void requireChoice(JsonNode survey, String field, Set<String> choices) {
        requireText(survey, field);
        if (!choices.contains(survey.get(field).asText())) {
            throw new IllegalArgumentException(field + " 선택값이 올바르지 않습니다.");
        }
    }

    private static void validateArray(JsonNode survey, String field, Set<String> choices) {
        JsonNode value = survey.get(field);
        if (value == null || !value.isArray()) throw new IllegalArgumentException(field + "은 배열이어야 합니다.");
        for (JsonNode item : value) {
            if (!item.isTextual() || !choices.contains(item.asText())) {
                throw new IllegalArgumentException(field + " 선택값이 올바르지 않습니다.");
            }
        }
    }

    private static void validatePlaceNames(JsonNode survey, String field) {
        JsonNode value = survey.get(field);
        if (value == null || !value.isArray()) throw new IllegalArgumentException(field + "은 배열이어야 합니다.");
        for (JsonNode item : value) {
            if (!item.isTextual() || item.asText().isBlank()) throw new IllegalArgumentException(field + "에는 장소명이 필요합니다.");
        }
    }
}
