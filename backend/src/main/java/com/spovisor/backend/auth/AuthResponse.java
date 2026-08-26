package com.spovisor.backend.auth;

public record AuthResponse(
        String accessToken,
        Long userId,
        String email,
        String nickname,
        String mascot,
        String themeColor
) {
}
