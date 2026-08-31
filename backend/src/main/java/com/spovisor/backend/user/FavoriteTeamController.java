package com.spovisor.backend.user;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/favorite-teams")
public class FavoriteTeamController {
    private final FavoriteTeamService service;

    public FavoriteTeamController(FavoriteTeamService service) {
        this.service = service;
    }

    @GetMapping
    public List<FavoriteTeamResponse> list(@AuthenticationPrincipal User user) {
        return service.list(user);
    }

    @PutMapping
    public List<FavoriteTeamResponse> replace(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateFavoriteTeamsRequest request
    ) {
        return service.replace(user, request);
    }
}
