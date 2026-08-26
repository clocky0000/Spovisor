package com.spovisor.backend.feature;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user_survey")
public class UserSurvey {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "survey_json", columnDefinition = "TEXT")
    private String surveyJson;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected UserSurvey() {
    }

    public UserSurvey(Long userId, String surveyJson) {
        this.userId = userId;
        this.surveyJson = surveyJson;
        this.updatedAt = LocalDateTime.now();
    }

    public String getSurveyJson() {
        return surveyJson;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void update(String surveyJson) {
        this.surveyJson = surveyJson;
        this.updatedAt = LocalDateTime.now();
    }
}
