package com.spovisor.backend.user;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/favorite-places")
public class FavoritePlaceController {
    private final FavoritePlaceService service;

    public FavoritePlaceController(FavoritePlaceService service) {
        this.service = service;
    }

    @GetMapping
    public List<FavoritePlaceResponse> list(@AuthenticationPrincipal User user) {
        return service.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FavoritePlaceResponse create(@AuthenticationPrincipal User user,
                                        @Valid @RequestBody FavoritePlaceRequest request) {
        return service.create(user, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user, id);
    }
}
