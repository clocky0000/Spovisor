package com.spovisor.backend.user;

public record FavoritePlaceResponse(
        Long id,
        String label,
        String name,
        String address,
        String roadAddress,
        Double longitude,
        Double latitude,
        String providerId,
        String createdAt
) {
    public static FavoritePlaceResponse from(FavoritePlace place) {
        return new FavoritePlaceResponse(place.getId(), place.getLabel(), place.getName(), place.getAddress(),
                place.getRoadAddress(), place.getLongitude(), place.getLatitude(), place.getProviderId(),
                place.getCreatedAt().toString());
    }
}
