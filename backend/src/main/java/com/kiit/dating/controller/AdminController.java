package com.kiit.dating.controller;

import com.kiit.dating.dto.SpeedChatAdminSessionDTO;
import com.kiit.dating.dto.SpeedChatMessageDTO;
import com.kiit.dating.service.SpeedChatService;
import com.kiit.dating.dto.ProfileUpdateRequest;
import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.AppSettings;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.UserRepository;
import com.kiit.dating.service.AdminSettingsService;
import com.kiit.dating.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ProfileService profileService;
    private final AdminSettingsService adminSettingsService;
    private final SpeedChatService speedChatService;

    // ── User Management ──────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(
                userRepository.findAll().stream().map(profileService::toDTO).toList()
        );
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(u -> {
            u.setActive(false);
            userRepository.save(u);
        });
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(u -> {
            u.setActive(true);
            userRepository.save(u);
        });
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<UserDTO> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setApprovalStatus(User.ApprovalStatus.APPROVED);
        return ResponseEntity.ok(profileService.toDTO(userRepository.save(user)));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<UserDTO> rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setApprovalStatus(User.ApprovalStatus.REJECTED);
        return ResponseEntity.ok(profileService.toDTO(userRepository.save(user)));
    }

    @PutMapping("/users/{id}/reject-deletion")
    public ResponseEntity<UserDTO> rejectDeletion(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.cancelAccountDeletion(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        profileService.deleteMyAccount(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getProfile(id));
    }

    @PutMapping("/users/{id}/profile")
    public ResponseEntity<UserDTO> updateUserProfile(
            @PathVariable Long id,
            @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(id, request));
    }

    @PostMapping("/users/{id}/photos")
    public ResponseEntity<Map<String, String>> uploadUserPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        String url = profileService.uploadPhoto(id, file);
        return ResponseEntity.ok(Map.of("photoUrl", url));
    }

    @DeleteMapping("/users/{id}/photos")
    public ResponseEntity<Void> deleteUserPhoto(
            @PathVariable Long id,
            @RequestParam("url") String url) {
        profileService.deletePhoto(id, url);
        return ResponseEntity.noContent().build();
    }

    // ── Specific User Limit Override ──────────────────────
    @PutMapping("/users/{id}/limit")
    public ResponseEntity<UserDTO> setUserLimit(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Integer limit = null;
        if (body.get("limit") != null) {
            try {
                limit = Integer.parseInt(body.get("limit").toString());
            } catch (Exception ignored) {}
        }
        User updated = adminSettingsService.setUserCustomSwipeLimit(id, limit);
        return ResponseEntity.ok(profileService.toDTO(updated));
    }

    @PutMapping("/users/{id}/speed-chat-limit")
    public ResponseEntity<UserDTO> setUserSpeedChatLimit(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Integer limit = null;
        if (body.get("limit") != null) {
            try {
                limit = Integer.parseInt(body.get("limit").toString());
            } catch (Exception ignored) {}
        }
        User updated = adminSettingsService.setUserCustomSpeedChatLimit(id, limit);
        return ResponseEntity.ok(profileService.toDTO(updated));
    }

    // ── System Settings ──────────────────────────────────
    @GetMapping("/settings")
    public ResponseEntity<AppSettings> getSettings() {
        return ResponseEntity.ok(adminSettingsService.getSettings());
    }

    @PutMapping("/settings/matching")
    public ResponseEntity<AppSettings> updateMatching(@RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        String message = body.get("message") != null ? body.get("message").toString() : null;
        return ResponseEntity.ok(adminSettingsService.updateMatching(enabled, message));
    }

    @PutMapping("/settings/limit")
    public ResponseEntity<AppSettings> updateDefaultLimit(@RequestBody Map<String, Object> body) {
        int limit = Integer.parseInt(body.get("limit").toString());
        return ResponseEntity.ok(adminSettingsService.updateDefaultSwipeLimit(limit));
    }

    @PutMapping("/settings/speed-chat-limit")
    public ResponseEntity<AppSettings> updateDefaultSpeedChatLimit(@RequestBody Map<String, Object> body) {
        int limit = Integer.parseInt(body.get("limit").toString());
        return ResponseEntity.ok(adminSettingsService.updateDefaultSpeedChatLimit(limit));
    }

    @PostMapping("/settings/domains")
    public ResponseEntity<AppSettings> addDomain(@RequestBody Map<String, String> body) {
        String domain = body.get("domain");
        return ResponseEntity.ok(adminSettingsService.addAllowedDomain(domain));
    }

    @DeleteMapping("/settings/domains/{domain}")
    public ResponseEntity<AppSettings> removeDomain(@PathVariable String domain) {
        return ResponseEntity.ok(adminSettingsService.removeAllowedDomain(domain));
    }

    // ── Speed Chat 24h Audit & Control Endpoints ──────────
    @GetMapping("/speed-chat/sessions")
    public ResponseEntity<List<SpeedChatAdminSessionDTO>> getSpeedChatSessions() {
        return ResponseEntity.ok(speedChatService.getSessionsLast24Hours());
    }

    @GetMapping("/speed-chat/sessions/{sessionUuid}/messages")
    public ResponseEntity<List<SpeedChatMessageDTO>> getSpeedChatSessionMessages(@PathVariable String sessionUuid) {
        return ResponseEntity.ok(speedChatService.getSessionMessages(sessionUuid));
    }

    @PostMapping("/speed-chat/sessions/{sessionUuid}/break")
    public ResponseEntity<Void> breakSpeedChatSession(@PathVariable String sessionUuid) {
        speedChatService.terminateSessionByAdmin(sessionUuid);
        return ResponseEntity.ok().build();
    }
}
