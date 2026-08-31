package com.spovisor.backend.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FavoritePlaceRequest(
        @NotBlank String label,
        @NotBlank String name,
        String address,
        String roadAddress,
        @NotNull Double longitude,
        @NotNull Double latitude,
        String providerId
) {
}
