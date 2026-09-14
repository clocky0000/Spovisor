package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import com.spovisor.backend.spot.SpotSearchService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class TripHistoryService {
    private static final String IMAGE_SAFETY_VERSION = "place-relevance-v2";
    private final TripHistoryRepository repository;
    private final ObjectMapper objectMapper;
    private final SpotSearchService spotSearchService;

    public TripHistoryService(TripHistoryRepository repository, ObjectMapper objectMapper, SpotSearchService spotSearchService) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.spotSearchService = spotSearchService;
    }

    @Transactional
    public List<TripResponse> list(User user) {
        var now = java.time.LocalDateTime.now();
        return repository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(trip -> {
            if ("ACTIVE".equals(trip.getStatus())) {
                boolean isExpired = trip.getExpiresAt() != null && now.isAfter(trip.getExpiresAt());

                LocalDate matchDay = trip.getTripDate();
                if (matchDay != null) {
                    LocalDateTime matchDayEnd = matchDay.atTime(LocalTime.MAX);
                    if (now.isAfter(matchDayEnd)) {
                        isExpired = true;
                    }
                }

                if (isExpired) {
                    clearTripImageSnapshot(trip);
                    spotSearchService.clearTourismImageCache(tripCacheSessionId(trip.getId()));
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
        clearTripImageSnapshot(trip);
        spotSearchService.clearTourismImageCache(tripCacheSessionId(tripId));
        trip.addFeedback(request.rating(), visited);
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse saveImageSnapshot(User user, Long tripId, TripImageSnapshotRequest request) {
        TripHistory trip = repository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("여행 기록을 찾을 수 없습니다."));
        if (!"ACTIVE".equals(trip.getStatus())) {
            throw new IllegalArgumentException("진행 중인 여행에만 이미지를 저장할 수 있습니다.");
        }
        if (trip.getCourseJson() == null || trip.getCourseJson().isBlank()) {
            throw new IllegalArgumentException("저장된 코스 정보가 없습니다.");
        }

        try {
            JsonNode course = objectMapper.readTree(trip.getCourseJson());
            JsonNode spots = course.path("spots");
            if (!spots.isArray()) throw new IllegalArgumentException("코스 장소 정보가 올바르지 않습니다.");

            Map<String, List<String>> imagesBySpotId = request.imageUrlsBySpotId();
            for (JsonNode spot : spots) {
                if (!spot.isObject()) continue;
                List<String> urls = imagesBySpotId.getOrDefault(spot.path("id").asText(), List.of());
                ArrayNode imageUrls = objectMapper.createArrayNode();
                urls.stream()
                        .filter(url -> url != null && url.length() <= 2_048
                                && (url.startsWith("https://") || url.startsWith("http://")))
                        .distinct()
                        .limit(3)
                        .forEach(imageUrls::add);
                ((ObjectNode) spot).set("imageUrls", imageUrls);
                ((ObjectNode) spot).put("imageSafetyVersion", IMAGE_SAFETY_VERSION);
            }
            trip.updateCourseJson(objectMapper.writeValueAsString(course));
            return TripResponse.from(trip);
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalArgumentException("여행 이미지 정보를 저장하지 못했습니다.");
        }
    }

    @Transactional
    public void delete(User user, Long tripId) {
        TripHistory trip = repository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("여행 기록을 찾을 수 없습니다."));
        spotSearchService.clearTourismImageCache(tripCacheSessionId(tripId));
        repository.delete(trip);
    }

    private void clearTripImageSnapshot(TripHistory trip) {
        if (trip.getCourseJson() == null || trip.getCourseJson().isBlank()) return;
        try {
            JsonNode course = objectMapper.readTree(trip.getCourseJson());
            removeImageUrls(course);
            trip.updateCourseJson(objectMapper.writeValueAsString(course));
        } catch (Exception ignored) {
            // A malformed legacy course should not prevent completion or expiry.
        }
    }

    private void removeImageUrls(JsonNode node) {
        if (node == null) return;
        if (node.isObject()) {
            ((ObjectNode) node).remove("imageUrls");
            node.elements().forEachRemaining(this::removeImageUrls);
            return;
        }
        if (node.isArray()) node.elements().forEachRemaining(this::removeImageUrls);
    }

    private String tripCacheSessionId(Long tripId) {
        return "trip-" + tripId;
    }
}
