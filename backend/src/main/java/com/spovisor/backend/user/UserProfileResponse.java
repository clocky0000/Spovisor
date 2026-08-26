package com.spovisor.backend.user;

public record UserProfileResponse(
        Long userId,
        String email,
        String nickname,
        String mascot,
        String themeColor,
        String createdAt
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getMascot(),
                user.getThemeColor(),
                user.getCreatedAt().toString()
        );
    }
}
