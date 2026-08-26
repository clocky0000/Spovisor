package com.spovisor.backend.feature;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation_request")
public class RecommendationRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "survey_json", nullable = false, columnDefinition = "TEXT")
    private String surveyJson;
    @Column(name = "result_json", columnDefinition = "TEXT")
    private String resultJson;
    @Column(nullable = false, length = 30)
    private String status;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected RecommendationRequestEntity() {}

    public RecommendationRequestEntity(Long userId, String surveyJson) {
        this.userId = userId;
        this.surveyJson = surveyJson;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
