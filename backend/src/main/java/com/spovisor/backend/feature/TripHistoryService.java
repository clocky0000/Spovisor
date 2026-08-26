package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TripHistoryService {
    private final TripHistoryRepository repository;

    public TripHistoryService(TripHistoryRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public List<TripResponse> list(User user) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(TripResponse::from).toList();
    }

    @Transactional
    public TripResponse create(User user, CreateTripRequest request) {
        return TripResponse.from(repository.save(new TripHistory(user.getId(), request.stadium().trim(), request.matchName(), request.tripDate(), request.courseTitle())));
    }

    @Transactional
    public TripResponse feedback(User user, Long tripId, TripFeedbackRequest request) {
        TripHistory trip = repository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("여행 기록을 찾을 수 없습니다."));
        String visited = request.visitedSpotIds() == null ? "" : request.visitedSpotIds().stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
        trip.addFeedback(request.rating(), visited);
        return TripResponse.from(trip);
    }
}
