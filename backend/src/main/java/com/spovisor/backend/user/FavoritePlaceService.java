package com.spovisor.backend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoritePlaceService {
    private final FavoritePlaceRepository repository;

    public FavoritePlaceService(FavoritePlaceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<FavoritePlaceResponse> list(User user) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(FavoritePlaceResponse::from)
                .toList();
    }

    @Transactional
    public FavoritePlaceResponse create(User user, FavoritePlaceRequest request) {
        return FavoritePlaceResponse.from(repository.save(new FavoritePlace(user.getId(), request.label().trim(),
                request.name().trim(), request.address(), request.roadAddress(), request.longitude(),
                request.latitude(), request.providerId())));
    }

    @Transactional
    public void delete(User user, Long id) {
        repository.deleteByIdAndUserId(id, user.getId());
    }
}
