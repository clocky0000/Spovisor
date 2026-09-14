package com.spovisor.backend.spot;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SpotSearchServiceTest {

    @Test
    void omitsBroadRegionForDistinctiveStationAndRequestsAPlaceView() {
        assertThat(SpotSearchService.buildNaverImageQuery(
                "가천역", "대구광역시 수성구", "기타관광"
        )).isEqualTo("가천역 전경");
    }

    @Test
    void keepsCompactRegionForCommercialPlaces() {
        assertThat(SpotSearchService.buildNaverImageQuery(
                "테스트식당", "대구광역시 수성구", "음식"
        )).isEqualTo("테스트식당 수성구 음식");
    }

    @Test
    void skipsRemoteEducationProvidersWithoutPhysicalPlacePhotos() {
        assertThat(SpotSearchService.isClearlyNonPhysicalSpot("라인원격평생교육원")).isTrue();
        assertThat(SpotSearchService.isClearlyNonPhysicalSpot("고모역복합문화공간")).isFalse();
    }

    @Test
    void blocksLodgingAndFoodResultsForUnrelatedTouristSpots() {
        assertThat(SpotSearchService.isBlockedNaverImage(
                "가천역",
                "수성구 가천역 주변의 저렴한 호텔 예약",
                "https://example.com/hotel.jpg",
                800,
                600,
                "기타관광"
        )).isTrue();
        assertThat(SpotSearchService.isBlockedNaverImage(
                "대구삼성라이온즈파크",
                "대구삼성라이온즈파크 먹거리와 뷔페",
                "https://example.com/food.jpg",
                800,
                600,
                "문화관광"
        )).isTrue();
        assertThat(SpotSearchService.isBlockedNaverImage(
                "대구삼성라이온즈파크",
                "대구삼성라이온즈파크 전경",
                "https://example.com/stadium.jpg",
                800,
                600,
                "문화관광"
        )).isFalse();
    }
}
