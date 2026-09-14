package com.spovisor.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 50)
    private String mascot;

    @Column(name = "theme_color", nullable = false, length = 7)
    private String themeColor;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "terms_version", length = 20)
    private String termsVersion;

    @Column(name = "terms_agreed_at")
    private LocalDateTime termsAgreedAt;

    @Column(name = "privacy_version", length = 20)
    private String privacyVersion;

    @Column(name = "privacy_agreed_at")
    private LocalDateTime privacyAgreedAt;

    protected User() {
    }

    public User(String email, String passwordHash, String nickname) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.mascot = "trophy";
        this.themeColor = "#5B44E8";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getNickname() {
        return nickname;
    }

    public String getMascot() {
        return mascot;
    }

    public String getThemeColor() {
        return themeColor;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void updateProfile(String nickname, String mascot, String themeColor) {
        if (nickname != null && !nickname.isBlank()) {
            this.nickname = nickname.trim();
        }
        if (mascot != null && !mascot.isBlank()) {
            this.mascot = mascot.trim();
        }
        if (themeColor != null && !themeColor.isBlank()) {
            this.themeColor = themeColor.trim();
        }
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void recordLegalConsent(String termsVersion, String privacyVersion) {
        LocalDateTime agreedAt = LocalDateTime.now();
        this.termsVersion = termsVersion;
        this.termsAgreedAt = agreedAt;
        this.privacyVersion = privacyVersion;
        this.privacyAgreedAt = agreedAt;
    }

    public boolean hasLegalConsentVersions(String expectedTermsVersion, String expectedPrivacyVersion) {
        return Objects.equals(termsVersion, expectedTermsVersion)
                && Objects.equals(privacyVersion, expectedPrivacyVersion)
                && termsAgreedAt != null
                && privacyAgreedAt != null;
    }
}
