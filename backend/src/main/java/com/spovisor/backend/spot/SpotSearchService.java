package com.spovisor.backend.spot;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SpotSearchService {
    private final JdbcTemplate jdbcTemplate;

    public SpotSearchService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SpotSearchResponse> search(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) {
            throw new IllegalArgumentException("장소명은 두 글자 이상 입력해주세요.");
        }

        String pattern = "%" + normalized.toLowerCase() + "%";
        return jdbcTemplate.query("""
                SELECT content_id, spot_name, COALESCE(mcls_nm, lcls_nm) AS category,
                       area_cd, signgu_cd, map_x, map_y
                  FROM spot_cache
                 WHERE LOWER(spot_name) LIKE ?
                 ORDER BY hub_rank NULLS LAST, spot_name
                 LIMIT 20
                """, (resultSet, rowNum) -> new SpotSearchResponse(
                resultSet.getString("content_id"),
                resultSet.getString("spot_name"),
                resultSet.getString("category"),
                resultSet.getString("area_cd"),
                resultSet.getString("signgu_cd"),
                resultSet.getObject("map_x", Double.class),
                resultSet.getObject("map_y", Double.class)
        ), pattern);
    }
}
