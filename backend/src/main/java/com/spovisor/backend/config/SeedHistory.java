package com.spovisor.backend.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_seed_history")
public class SeedHistory {

    @Id
    @Column(name = "seed_key", length = 100)
    private String seedKey;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    protected SeedHistory() {
    }

    public SeedHistory(String seedKey) {
        this.seedKey = seedKey;
        this.appliedAt = LocalDateTime.now();
    }
}
