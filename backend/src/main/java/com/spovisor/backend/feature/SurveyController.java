package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/survey")
public class SurveyController {
    private final SurveyService surveyService;

    public SurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @GetMapping
    public SurveyResponse get(@AuthenticationPrincipal User user) {
        return surveyService.get(user);
    }

    @PostMapping
    public SurveyResponse savePost(@AuthenticationPrincipal User user, @Valid @RequestBody SurveyRequest request) {
        return surveyService.save(user, request.survey());
    }

    @PutMapping
    public SurveyResponse savePut(@AuthenticationPrincipal User user, @Valid @RequestBody SurveyRequest request) {
        return surveyService.save(user, request.survey());
    }
}
