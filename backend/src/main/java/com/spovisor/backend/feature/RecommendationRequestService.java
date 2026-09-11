package com.spovisor.backend.feature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spovisor.backend.user.User;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationRequestService {
    private final RecommendationRequestRepository repository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final RecommendationRegionValidator regionValidator;

    public RecommendationRequestService(RecommendationRequestRepository repository, ObjectMapper objectMapper, ApplicationEventPublisher applicationEventPublisher, RecommendationRegionValidator regionValidator) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.eventPublisher = applicationEventPublisher;
        this.regionValidator = regionValidator;
    }

    @Transactional
    public RecommendationRequestResponse create(User user, JsonNode survey) {
        regionValidator.validate(survey);
        JsonNode normalizedSurvey = SurveyNormalizer.normalize(survey);
        SurveyRules.validate(normalizedSurvey);
        try {
            RecommendationRequestEntity savedEntity = repository.save(
                    new RecommendationRequestEntity(user.getId(), objectMapper.writeValueAsString(normalizedSurvey))
            );
            eventPublisher.publishEvent(new AiRecommendationEvent(savedEntity.getId()));
            return RecommendationRequestResponse.from(savedEntity);

        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("추천 요청을 저장할 수 없습니다.", exception);
        }
    }

    @Transactional(readOnly = true)
    public RecommendationRequestResponse get(User user, Long requestId) {
        return repository.findByIdAndUserId(requestId, user.getId())
                .map(RecommendationRequestResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("추천 요청을 찾을 수 없습니다."));
    }
}
