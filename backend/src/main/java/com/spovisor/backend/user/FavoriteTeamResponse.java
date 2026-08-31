package com.spovisor.backend.user;

public record FavoriteTeamResponse(Long id, String sport, String teamName, String nickname) {
    public static FavoriteTeamResponse from(FavoriteTeam team) {
        return new FavoriteTeamResponse(team.getId(), team.getSport(), team.getTeamName(), team.getNickname());
    }
}
