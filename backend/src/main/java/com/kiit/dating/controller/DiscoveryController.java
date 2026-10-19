package com.kiit.dating.controller;

import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.service.DiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    @GetMapping("/discover")
    public ResponseEntity<List<UserDTO>> discover(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(discoveryService.getDiscoverableUsers(user.getId()));
    }

    @GetMapping("/swipe/limit")
    public ResponseEntity<Map<String, Object>> getSwipeLimit(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(discoveryService.getSwipeLimitStatus(user.getId()));
    }

    @PostMapping("/swipe/{userId}/like")
    public ResponseEntity<Map<String, Object>> like(@AuthenticationPrincipal User user,
                                                     @PathVariable Long userId) {
        return ResponseEntity.ok(discoveryService.swipeLike(user.getId(), userId));
    }

    @PostMapping("/swipe/{userId}/dislike")
    public ResponseEntity<Map<String, Object>> dislike(@AuthenticationPrincipal User user,
                                                        @PathVariable Long userId) {
        return ResponseEntity.ok(discoveryService.swipeDislike(user.getId(), userId));
    }
}
