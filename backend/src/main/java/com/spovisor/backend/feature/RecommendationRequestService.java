package com.spovisor.backend.feature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spovisor.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationRequestService {
    private final RecommendationRequestRepository repository;
    private final ObjectMapper objectMapper;

    public RecommendationRequestService(RecommendationRequestRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RecommendationRequestResponse create(User user, JsonNode survey) {
        try {
            return RecommendationRequestResponse.from(repository.save(
                    new RecommendationRequestEntity(user.getId(), objectMapper.writeValueAsString(survey))
            ));
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
