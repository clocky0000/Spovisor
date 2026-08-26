package com.spovisor.backend.spot;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/spots")
public class SpotSearchController {
    private final SpotSearchService spotSearchService;

    public SpotSearchController(SpotSearchService spotSearchService) {
        this.spotSearchService = spotSearchService;
    }

    @GetMapping("/search")
    public List<SpotSearchResponse> search(@RequestParam("q") String query) {
        return spotSearchService.search(query);
    }
}
