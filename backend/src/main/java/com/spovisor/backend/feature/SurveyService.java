package com.spovisor.backend.feature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spovisor.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SurveyService {
    private final UserSurveyRepository repository;
    private final ObjectMapper objectMapper;

    public SurveyService(UserSurveyRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public SurveyResponse get(User user) {
        return repository.findById(user.getId())
                .map(item -> new SurveyResponse(read(item.getSurveyJson()), item.getUpdatedAt()))
                .orElse(new SurveyResponse(null, null));
    }

    @Transactional
    public SurveyResponse save(User user, JsonNode survey) {
        JsonNode normalizedSurvey = SurveyNormalizer.normalize(survey);
        SurveyRules.validate(normalizedSurvey);
        String json = write(normalizedSurvey);
        UserSurvey item = repository.findById(user.getId())
                .map(existing -> {
                    existing.update(json);
                    return existing;
                })
                .orElseGet(() -> new UserSurvey(user.getId(), json));
        item = repository.save(item);
        return new SurveyResponse(read(item.getSurveyJson()), item.getUpdatedAt());
    }

    private String write(JsonNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("설문 데이터를 저장할 수 없습니다.", exception);
        }
    }

    private JsonNode read(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("저장된 설문 데이터가 올바르지 않습니다.", exception);
        }
    }
}
