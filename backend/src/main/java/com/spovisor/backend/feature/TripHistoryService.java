package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class TripHistoryService {
    private final TripHistoryRepository repository;
    private final ObjectMapper objectMapper;

    public TripHistoryService(TripHistoryRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<TripResponse> list(User user) {
        var now = java.time.LocalDateTime.now();
        return repository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(trip -> {
            if ("ACTIVE".equals(trip.getStatus())) {
                boolean isExpired = false;

                LocalDate matchDay = trip.getTripDate();
                if (matchDay != null) {
                    LocalDateTime matchDayEnd = matchDay.atTime(LocalTime.MAX);
                    if (now.isAfter(matchDayEnd)) {
                        isExpired = true;
                    }
                }

                if (isExpired) {
                    trip.markExpired();
                }
            }
            return TripResponse.from(trip);
        }).toList();
    }

    @Transactional
    public TripResponse create(User user, CreateTripRequest request) {
        String courseJson = null;
        try { if (request.course() != null) courseJson = objectMapper.writeValueAsString(request.course()); }
        catch (Exception e) { throw new IllegalArgumentException("코스 정보를 저장하지 못했습니다."); }
        return TripResponse.from(repository.save(new TripHistory(user.getId(), request.stadium().trim(), request.matchName(), request.tripDate(), request.courseTitle(), courseJson)));
    }

    @Transactional
    public TripResponse feedback(User user, Long tripId, TripFeedbackRequest request) {
        TripHistory trip = repository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("여행 기록을 찾을 수 없습니다."));
        String visited = request.visitedSpotIds() == null ? "" : request.visitedSpotIds().stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
        trip.addFeedback(request.rating(), visited);
        return TripResponse.from(trip);
    }

    @Transactional
    public void delete(User user, Long tripId) {
        repository.delete(repository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("여행 기록을 찾을 수 없습니다.")));
    }
}
