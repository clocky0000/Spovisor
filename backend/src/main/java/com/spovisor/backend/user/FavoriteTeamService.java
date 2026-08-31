package com.spovisor.backend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FavoriteTeamService {
    private final FavoriteTeamRepository repository;

    public FavoriteTeamService(FavoriteTeamRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<FavoriteTeamResponse> list(User user) {
        return repository.findAllByUserIdOrderBySportAscTeamNameAsc(user.getId()).stream()
                .map(FavoriteTeamResponse::from)
                .toList();
    }

    @Transactional
    public List<FavoriteTeamResponse> replace(User user, UpdateFavoriteTeamsRequest request) {
        Set<String> supportedSports = Set.of("baseball", "soccer", "volleyball");
        Map<String, Long> countsBySport = request.teams().stream()
                .filter(item -> item.sport() != null)
                .collect(Collectors.groupingBy(UpdateFavoriteTeamsRequest.FavoriteTeamInput::sport, Collectors.counting()));
        if (countsBySport.keySet().stream().anyMatch(sport -> !supportedSports.contains(sport))) {
            throw new IllegalArgumentException("지원하지 않는 종목입니다.");
        }
        if (countsBySport.values().stream().anyMatch(count -> count > 3)) {
            throw new IllegalArgumentException("종목당 관심 구단은 최대 3개까지 등록할 수 있습니다.");
        }
        repository.deleteAllByUserId(user.getId());
        repository.flush();
        List<FavoriteTeam> teams = request.teams().stream()
                .filter(item -> item.sport() != null && !item.sport().isBlank())
                .filter(item -> item.teamName() != null && !item.teamName().isBlank())
                .map(item -> new FavoriteTeam(user.getId(), item.sport().trim(), item.teamName().trim(), normalizeNickname(item.nickname())))
                .toList();
        return repository.saveAll(teams).stream().map(FavoriteTeamResponse::from).toList();
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null) return null;
        String trimmed = nickname.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
