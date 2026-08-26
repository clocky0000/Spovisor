package com.spovisor.backend.feature;

import com.spovisor.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/saved")
public class SavedCourseController {
    private final SavedCourseService service;

    public SavedCourseController(SavedCourseService service) { this.service = service; }

    @GetMapping
    public List<SavedCourseResponse> list(@AuthenticationPrincipal User user) { return service.list(user); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedCourseResponse save(@AuthenticationPrincipal User user, @Valid @RequestBody SaveCourseRequest request) {
        return service.save(user, request);
    }

    @DeleteMapping("/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long courseId) { service.delete(user, courseId); }
}
