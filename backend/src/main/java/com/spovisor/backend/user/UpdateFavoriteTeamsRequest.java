package com.spovisor.backend.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateFavoriteTeamsRequest(@NotNull List<@Valid FavoriteTeamInput> teams) {
    public record FavoriteTeamInput(
            @NotNull String sport,
            @NotNull String teamName,
            @Size(max = 100) String nickname
    ) {
    }
}
