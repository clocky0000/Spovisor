package com.spovisor.backend.feature;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_history")
public class TripHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(nullable = false, length = 200)
    private String stadium;
    @Column(name = "match_name", length = 200)
    private String matchName;
    @Column(name = "trip_date")
    private LocalDate tripDate;
    @Column(name = "course_title", length = 200)
    private String courseTitle;
    private Integer rating;
    @Column(name = "visited_spot_ids", columnDefinition = "TEXT")
    private String visitedSpotIds;
    @Column(name = "course_json", columnDefinition = "TEXT")
    private String courseJson;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected TripHistory() {}

    public TripHistory(Long userId, String stadium, String matchName, LocalDate tripDate, String courseTitle, String courseJson) {
        this.userId = userId;
        this.stadium = stadium;
        this.matchName = matchName;
        this.tripDate = tripDate;
        this.courseTitle = courseTitle;
        this.courseJson = courseJson;
        this.status = "ACTIVE";
        this.expiresAt = LocalDateTime.now().plusHours(24);
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getStadium() { return stadium; }
    public String getMatchName() { return matchName; }
    public LocalDate getTripDate() { return tripDate; }
    public String getCourseTitle() { return courseTitle; }
    public Integer getRating() { return rating; }
    public String getVisitedSpotIds() { return visitedSpotIds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCourseJson() { return courseJson; }
    public String getStatus() { return status; }
    public LocalDateTime getExpiresAt() { return expiresAt; }

    public void markExpired() { this.status = "EXPIRED"; }

    public void addFeedback(Integer rating, String visitedSpotIds) {
        this.rating = rating;
        this.visitedSpotIds = visitedSpotIds;
        this.status = "COMPLETED";
    }
}
