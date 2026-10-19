package com.kiit.dating.controller;

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

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
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

    @PostMapping("/settings/domains")
    public ResponseEntity<AppSettings> addDomain(@RequestBody Map<String, String> body) {
        String domain = body.get("domain");
        return ResponseEntity.ok(adminSettingsService.addAllowedDomain(domain));
    }

    @DeleteMapping("/settings/domains/{domain}")
    public ResponseEntity<AppSettings> removeDomain(@PathVariable String domain) {
        return ResponseEntity.ok(adminSettingsService.removeAllowedDomain(domain));
    }
}
