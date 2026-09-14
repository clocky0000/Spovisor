package com.spovisor.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteTeamRepository extends JpaRepository<FavoriteTeam, Long> {
    List<FavoriteTeam> findAllByUserIdOrderBySportAscTeamNameAsc(Long userId);
    boolean existsByUserIdAndSportAndTeamName(Long userId, String sport, String teamName);
    void deleteAllByUserId(Long userId);
}
