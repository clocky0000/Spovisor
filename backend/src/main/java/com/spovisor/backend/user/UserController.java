package com.spovisor.backend.user;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal User user) {
        return userService.getProfile(user);
    }

    @PatchMapping
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return userService.updateProfile(user, request);
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        userService.changePassword(user, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal User user) {
        userService.deleteAccount(user);
        return ResponseEntity.noContent().build();
    }
}
