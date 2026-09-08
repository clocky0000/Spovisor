package com.spovisor.backend.feature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiIntegrationService {

    private final RecommendationRequestRepository repository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${ai.server.url:http://localhost:5000}")
    private String aiServerUrl;

    // ── 1. 비동기 추천 코스 요청 (/recommend) ───────────────────
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void requestRecommendationToAi(AiRecommendationEvent event) {
        Long requestId = event.requestId();
        log.info("[AI] 추천 코스 요청 시작: requestId={}", requestId);

        RecommendationRequestEntity entity = repository.findById(requestId).orElse(null);
        if (entity == null) {
            log.error("[AI] 요청 Entity를 찾을 수 없습니다: requestId={}", requestId);
            return;
        }

        try {
            // survey JSON 파싱
            JsonNode surveyNode = objectMapper.readTree(entity.getSurveyJson());
            Map<String, Object> requestBody = Map.of("survey", surveyNode);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            String url = aiServerUrl + "/recommend";
            String responseBody = restTemplate.postForObject(url, request, String.class);

            if (responseBody != null && !responseBody.isBlank()) {
                entity.complete(responseBody);
                log.info("[AI] 추천 코스 수신 및 완료 저장: requestId={}", requestId);
            } else {
                entity.fail();
                log.error("[AI] 응답 바디가 비어있습니다. requestId={}", requestId);
            }

        } catch (HttpStatusCodeException e) {
            log.error("[AI] Flask HTTP 에러 발생: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            entity.fail();
        } catch (Exception e) {
            log.error("[AI] 연동 처리 중 예외 발생: requestId={}", requestId, e);
            entity.fail();
        }
    }

    // ── 2. 피드백 기반 재추천 요청 (/feedback) ───────────────────
    public String requestFeedbackToAi(JsonNode userResult, JsonNode region, List<String> likedSpots, List<String> dislikedSpots) {
        String url = aiServerUrl + "/feedback";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("user_result", userResult);
        requestBody.put("region", region);
        requestBody.put("liked_spot_names", likedSpots != null ? likedSpots : Collections.emptyList());
        requestBody.put("disliked_spot_names", dislikedSpots != null ? dislikedSpots : Collections.emptyList());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            log.info("[AI] 피드백 기반 재추천 요청 시작");
            return restTemplate.postForObject(url, request, String.class);
        } catch (HttpStatusCodeException e) {
            log.error("[AI] Flask 피드백 처리 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalStateException("AI 피드백 요청 실패: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[AI] Flask 서버 통신 에러", e);
            throw new RuntimeException("AI 피드백 서버 연동 중 오류가 발생했습니다.");
        }
    }

    // ── 3. Flask 서버 설문 조회 프록시 (/survey GET) ───────────
    public JsonNode fetchSurveyFromAi(String userId) {
        String url = aiServerUrl + "/survey?user_id=" + userId;
        try {
            return restTemplate.getForObject(url, JsonNode.class);
        } catch (Exception e) {
            log.warn("[AI] 설문 조회 실패: userId={}", userId, e);
            return null;
        }
    }

    // ── 4. Flask 서버 설문 저장 프록시 (/survey POST) ──────────
    public void saveSurveyToAi(String userId, JsonNode survey) {
        String url = aiServerUrl + "/survey";

        Map<String, Object> requestBody = Map.of(
                "user_id", userId,
                "survey", survey
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            restTemplate.postForObject(url, request, String.class);
        } catch (Exception e) {
            log.error("[AI] 설문 저장 요청 실패: userId={}", userId, e);
            throw new RuntimeException("설문 저장 실패");
        }
    }
}