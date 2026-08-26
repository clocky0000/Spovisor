package com.spovisor.backend.user;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 50) String nickname,
        @Size(max = 50) String mascot,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "themeColor must be a hex color") String themeColor
) {
}
