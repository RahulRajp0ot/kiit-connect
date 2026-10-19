package com.kiit.dating.controller;

import com.kiit.dating.dto.*;
import com.kiit.dating.entity.User;
import com.kiit.dating.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.getProfile(user.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMyProfile(@AuthenticationPrincipal User user,
                                                    @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(user.getId(), request));
    }

    @PostMapping("/me/photo")
    public ResponseEntity<String> uploadPhoto(@AuthenticationPrincipal User user,
                                              @RequestParam("file") MultipartFile file) throws IOException {
        String url = profileService.uploadPhoto(user.getId(), file);
        return ResponseEntity.ok(url);
    }

    @DeleteMapping("/me/photo")
    public ResponseEntity<Void> deletePhoto(@AuthenticationPrincipal User user,
                                            @RequestParam String url) {
        profileService.deletePhoto(user.getId(), url);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getProfile(id));
    }
}
