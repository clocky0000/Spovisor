package com.spovisor.backend.feature;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class TripResponseTest {

    @Test
    void removesLegacyImageSnapshotsThatWereNotFaceChecked() {
        TripHistory trip = tripWithCourse("""
                {"spots":[{"id":1,"imageUrls":["https://example.com/legacy.jpg"]}]}
                """);

        TripResponse response = TripResponse.from(trip);

        assertThat(response.course().path("spots").get(0).has("imageUrls")).isFalse();
    }

    @Test
    void keepsFaceCheckedImageSnapshots() {
        TripHistory trip = tripWithCourse("""
                {"spots":[{"id":1,"imageSafetyVersion":"place-relevance-v2","imageUrls":["https://example.com/safe.jpg"]}]}
                """);

        TripResponse response = TripResponse.from(trip);

        assertThat(response.course().path("spots").get(0).path("imageUrls").get(0).asText())
                .isEqualTo("https://example.com/safe.jpg");
    }

    private static TripHistory tripWithCourse(String courseJson) {
        return new TripHistory(1L, "경기장", null, LocalDate.now(), "A코스", courseJson);
    }
}
