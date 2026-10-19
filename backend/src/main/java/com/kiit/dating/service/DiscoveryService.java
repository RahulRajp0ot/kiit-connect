package com.kiit.dating.service;

import com.kiit.dating.dto.MatchDTO;
import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.Like;
import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.LikeRepository;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiscoveryService {

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final MatchRepository matchRepository;
    private final ProfileService profileService;

    public List<UserDTO> getDiscoverableUsers(Long currentUserId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userRepository.findDiscoverableUsers(currentUserId, current.getGender())
                .stream()
                .map(profileService::toDTO)
                .toList();
    }

    @Transactional
    public Map<String, Object> swipeLike(Long fromUserId, Long toUserId) {
        User fromUser = userRepository.findById(fromUserId).orElseThrow();
        User toUser = userRepository.findById(toUserId).orElseThrow();

        if (likeRepository.existsByFromUserAndToUser(fromUser, toUser)) {
            return Map.of("status", "already_liked");
        }

        likeRepository.save(Like.builder().fromUser(fromUser).toUser(toUser).build());

        // Check mutual like — create match
        boolean mutual = likeRepository.existsByFromUserAndToUser(toUser, fromUser);
        if (mutual) {
            boolean alreadyMatched = matchRepository.findByUsers(fromUser, toUser).isPresent();
            if (!alreadyMatched) {
                Match match = matchRepository.save(
                        Match.builder().userA(fromUser).userB(toUser).build()
                );
                return Map.of("status", "matched", "matchId", match.getId());
            }
        }

        return Map.of("status", "liked");
    }

    @Transactional
    public Map<String, Object> swipeDislike(Long fromUserId, Long toUserId) {
        // Just record as dislike by creating a like with a different flag
        // For simplicity, we track dislikes by adding a "seen" record
        // In practice you could have a Dislike entity; here we just return ok
        return Map.of("status", "disliked");
    }
}
