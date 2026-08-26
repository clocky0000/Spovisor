package com.spovisor.backend.feature;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_course")
public class SavedCourse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(length = 200)
    private String stadium;
    @Column(name = "course_type", length = 100)
    private String courseType;
    @Column(name = "course_json", nullable = false, columnDefinition = "TEXT")
    private String courseJson;
    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;

    protected SavedCourse() {
    }

    public SavedCourse(Long userId, String title, String stadium, String courseType, String courseJson) {
        this.userId = userId;
        this.title = title;
        this.stadium = stadium;
        this.courseType = courseType;
        this.courseJson = courseJson;
        this.savedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getStadium() { return stadium; }
    public String getCourseType() { return courseType; }
    public String getCourseJson() { return courseJson; }
    public LocalDateTime getSavedAt() { return savedAt; }
}
