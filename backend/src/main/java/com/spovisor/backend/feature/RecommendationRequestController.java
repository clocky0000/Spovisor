package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations/requests")
public class RecommendationRequestController {
    private final RecommendationRequestService service;

    public RecommendationRequestController(RecommendationRequestService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecommendationRequestResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody SurveyRequest request) {
        return service.create(user, request.survey());
    }

    @GetMapping("/{requestId}")
    public RecommendationRequestResponse get(@AuthenticationPrincipal User user, @PathVariable Long requestId) {
        return service.get(user, requestId);
    }
}
