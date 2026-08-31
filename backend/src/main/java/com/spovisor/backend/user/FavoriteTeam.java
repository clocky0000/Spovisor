package com.spovisor.backend.user;

import jakarta.persistence.*;

@Entity
@Table(name = "user_favorite_team", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "sport", "team_name"}))
public class FavoriteTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String sport;

    @Column(name = "team_name", nullable = false, length = 100)
    private String teamName;

    @Column(length = 100)
    private String nickname;

    protected FavoriteTeam() {
    }

    public FavoriteTeam(Long userId, String sport, String teamName, String nickname) {
        this.userId = userId;
        this.sport = sport;
        this.teamName = teamName;
        this.nickname = nickname;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getSport() { return sport; }
    public String getTeamName() { return teamName; }
    public String getNickname() { return nickname; }
}
