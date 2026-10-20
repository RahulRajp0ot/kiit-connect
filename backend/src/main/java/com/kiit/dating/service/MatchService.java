package com.kiit.dating.service;

import com.kiit.dating.dto.MatchDTO;
import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.LikeRepository;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import com.kiit.dating.dto.AdminMatchDTO;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<MatchDTO> getMatches(Long userId) {
        return matchRepository.findAllByUserId(userId).stream()
                .map(match -> toMatchDTO(match, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminMatchDTO> getPendingMatches() {
        return matchRepository.findAllPendingMatches().stream()
                .map(this::toAdminDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getPendingMatchesCount() {
        return matchRepository.countByStatus(Match.Status.PENDING);
    }

    @Transactional
    public AdminMatchDTO approveMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
        match.setStatus(Match.Status.APPROVED);
        match.setMatchedAt(LocalDateTime.now());
        return toAdminDTO(matchRepository.save(match));
    }

    @Transactional
    public void rejectMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
        match.setStatus(Match.Status.REJECTED);
        matchRepository.save(match);
    }

    @Transactional
    public void unmatch(Long matchId, Long currentUserId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

        if (!match.getUserA().getId().equals(currentUserId) && !match.getUserB().getId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to unmatch this connection.");
        }

        match.setStatus(Match.Status.UNMATCHED);
        matchRepository.save(match);

        // Remove mutual likes so they don't stay in liked state
        likeRepository.deleteLikesBetween(match.getUserA().getId(), match.getUserB().getId());

        // Notify active match chat in real-time via WebSocket
        try {
            Map<String, Object> payload = Map.of(
                    "type", "UNMATCHED",
                    "matchId", matchId,
                    "message", "This match has been disconnected."
            );
            messagingTemplate.convertAndSend("/topic/match/" + matchId, (Object) payload);
        } catch (Exception ignored) {}
    }

    private MatchDTO toMatchDTO(Match match, Long currentUserId) {
        User other = match.getUserA().getId().equals(currentUserId)
                ? match.getUserB() : match.getUserA();
        String photo = null;
        try {
            if (other.getPhotoUrls() != null && !other.getPhotoUrls().isEmpty()) {
                photo = other.getPhotoUrls().get(0);
            }
        } catch (Exception ignored) {}

        return MatchDTO.builder()
                .matchId(match.getId())
                .matchedUserId(other.getId())
                .matchedUserName(other.getName())
                .matchedUserPhoto(photo)
                .matchedAt(match.getMatchedAt())
                .build();
    }

    private AdminMatchDTO toAdminDTO(Match match) {
        String photoA = null;
        try {
            if (match.getUserA().getPhotoUrls() != null && !match.getUserA().getPhotoUrls().isEmpty()) {
                photoA = match.getUserA().getPhotoUrls().get(0);
            }
        } catch (Exception ignored) {}

        String photoB = null;
        try {
            if (match.getUserB().getPhotoUrls() != null && !match.getUserB().getPhotoUrls().isEmpty()) {
                photoB = match.getUserB().getPhotoUrls().get(0);
            }
        } catch (Exception ignored) {}

        return AdminMatchDTO.builder()
                .matchId(match.getId())
                .user1Id(match.getUserA().getId())
                .user1Name(match.getUserA().getName())
                .user1Email(match.getUserA().getEmail())
                .user1Photo(photoA)
                .user1Gender(match.getUserA().getGender() != null ? match.getUserA().getGender().name() : "")
                .user1College(match.getUserA().getCollege())
                .user1Bio(match.getUserA().getBio())
                .user2Id(match.getUserB().getId())
                .user2Name(match.getUserB().getName())
                .user2Email(match.getUserB().getEmail())
                .user2Photo(photoB)
                .user2Gender(match.getUserB().getGender() != null ? match.getUserB().getGender().name() : "")
                .user2College(match.getUserB().getCollege())
                .user2Bio(match.getUserB().getBio())
                .matchedAt(match.getMatchedAt())
                .status(match.getStatus().name())
                .build();
    }
}
