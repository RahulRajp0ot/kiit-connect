package com.kiit.dating.controller;

import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.UserRepository;
import com.kiit.dating.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ProfileService profileService;

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
}
