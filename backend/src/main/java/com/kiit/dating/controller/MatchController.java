package com.kiit.dating.controller;

import com.kiit.dating.dto.MatchDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping
    public ResponseEntity<List<MatchDTO>> getMatches(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(matchService.getMatches(user.getId()));
    }

    @PostMapping("/{matchId}/unmatch")
    public ResponseEntity<Map<String, Object>> unmatch(@AuthenticationPrincipal User user,
                                                       @PathVariable Long matchId) {
        matchService.unmatch(matchId, user.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Successfully unmatched."));
    }

    @DeleteMapping("/{matchId}")
    public ResponseEntity<Map<String, Object>> deleteMatch(@AuthenticationPrincipal User user,
                                                           @PathVariable Long matchId) {
        matchService.unmatch(matchId, user.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Successfully unmatched."));
    }
}
