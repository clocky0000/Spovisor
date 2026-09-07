package com.spovisor.backend.feature;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.client.RestTemplate;

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

    // 1. 기존 비동기 추천 코스 요청 (현재 작성하신 코드 그대로 유지)
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void requestRecommendationToAi(AiRecommendationEvent event) {
        Long requestId = event.requestId();
        try {
            RecommendationRequestEntity entity = repository.findById(requestId)
                    .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없습니다: " + requestId));

            JsonNode surveyNode = objectMapper.readTree(entity.getSurveyJson());
            Map<String, Object> requestBody = Map.of("survey", surveyNode);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("AI 서버에 추천 코스 요청 시작: requestId={}", requestId);
            String url = aiServerUrl + "/recommend";
            String responseBody = restTemplate.postForObject(url, request, String.class);

            if (responseBody != null) {
                entity.complete(responseBody);
                log.info("AI 추천 코스 처리 및 저장 완료: requestId={}", requestId);
            } else {
                entity.fail();
                log.error("AI 서버 응답이 비어있습니다. requestId={}", requestId);
            }

        } catch (Exception e) {
            log.error("AI 서버 연동 중 오류 발생: requestId={}", requestId, e);
            repository.findById(requestId).ifPresent(entity -> {
                entity.fail();
                repository.save(entity);
            });
        }
    }

    // 2. 피드백(좋아요/싫어요) 요청 추가
    // 피드백은 사용자가 기다리고 있으므로 바로 결과를 반환하는 동기 방식으로 구성하는 것이 좋습니다.
    public String requestFeedbackToAi(JsonNode userResult, JsonNode region, List<String> likedSpots, List<String> dislikedSpots) {
        String url = aiServerUrl + "/feedback";

        Map<String, Object> requestBody = Map.of(
                "user_result", userResult,
                "region", region,
                "liked_spot_names", likedSpots,
                "disliked_spot_names", dislikedSpots
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            log.info("AI 서버에 피드백 기반 재추천 요청 시작");
            return restTemplate.postForObject(url, request, String.class);
        } catch (Exception e) {
            log.error("AI 서버 피드백 연동 중 오류 발생", e);
            throw new RuntimeException("피드백 연동 중 오류가 발생했습니다.");
        }
    }
}