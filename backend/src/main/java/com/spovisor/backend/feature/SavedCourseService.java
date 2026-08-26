package com.spovisor.backend.feature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spovisor.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SavedCourseService {
    private final SavedCourseRepository repository;
    private final ObjectMapper objectMapper;

    public SavedCourseService(SavedCourseRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<SavedCourseResponse> list(User user) {
        return repository.findAllByUserIdOrderBySavedAtDesc(user.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public SavedCourseResponse save(User user, SaveCourseRequest request) {
        SavedCourse item = repository.save(new SavedCourse(
                user.getId(), request.title().trim(), request.stadium(), request.courseType(), write(request.course())
        ));
        return toResponse(item);
    }

    @Transactional
    public void delete(User user, Long courseId) {
        repository.delete(repository.findByIdAndUserId(courseId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("저장된 코스를 찾을 수 없습니다.")));
    }

    private SavedCourseResponse toResponse(SavedCourse item) {
        return new SavedCourseResponse(item.getId(), item.getTitle(), item.getStadium(), item.getCourseType(), read(item.getCourseJson()), item.getSavedAt());
    }

    private String write(JsonNode value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (JsonProcessingException exception) { throw new IllegalArgumentException("코스를 저장할 수 없습니다.", exception); }
    }

    private JsonNode read(String value) {
        try { return objectMapper.readTree(value); }
        catch (JsonProcessingException exception) { throw new IllegalStateException("저장된 코스가 올바르지 않습니다.", exception); }
    }
}
