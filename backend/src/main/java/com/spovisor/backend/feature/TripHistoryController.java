package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripHistoryController {
    private final TripHistoryService service;

    public TripHistoryController(TripHistoryService service) { this.service = service; }

    @GetMapping
    public List<TripResponse> list(@AuthenticationPrincipal User user) { return service.list(user); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody CreateTripRequest request) { return service.create(user, request); }

    @PatchMapping("/{tripId}/feedback")
    public TripResponse feedback(@AuthenticationPrincipal User user, @PathVariable Long tripId, @Valid @RequestBody TripFeedbackRequest request) { return service.feedback(user, tripId, request); }
}
