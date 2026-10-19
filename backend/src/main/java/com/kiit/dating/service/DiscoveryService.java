package com.kiit.dating.service;

import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.Like;
import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.User;
import com.kiit.dating.entity.UserSwipe;
import com.kiit.dating.repository.LikeRepository;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.UserRepository;
import com.kiit.dating.repository.UserSwipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiscoveryService {

    public static final int DAILY_SWIPE_LIMIT = 5;

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final MatchRepository matchRepository;
    private final UserSwipeRepository userSwipeRepository;
    private final ProfileService profileService;

    public List<UserDTO> getDiscoverableUsers(Long currentUserId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userRepository.findDiscoverableUsers(currentUserId, current.getGender())
                .stream()
                .map(profileService::toDTO)
                .toList();
    }

    public Map<String, Object> getSwipeLimitStatus(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long used = userSwipeRepository.countByFromUser_IdAndCreatedAtAfter(userId, since);
        long remaining = Math.max(0, DAILY_SWIPE_LIMIT - used);
        boolean limitReached = remaining <= 0;

        long resetInMinutes = 0L;
        if (limitReached) {
            List<UserSwipe> recent = userSwipeRepository.findByFromUser_IdAndCreatedAtAfterOrderByCreatedAtAsc(userId, since);
            if (!recent.isEmpty()) {
                LocalDateTime oldestInWindow = recent.get(0).getCreatedAt();
                LocalDateTime resetTime = oldestInWindow.plusHours(24);
                resetInMinutes = Math.max(1, Duration.between(LocalDateTime.now(), resetTime).toMinutes());
            }
        }

        Map<String, Object> status = new HashMap<>();
        status.put("maxLimit", DAILY_SWIPE_LIMIT);
        status.put("swipesUsed", used);
        status.put("swipesRemaining", remaining);
        status.put("limitReached", limitReached);
        status.put("resetInMinutes", resetInMinutes);
        return status;
    }

    @Transactional
    public Map<String, Object> swipeLike(Long fromUserId, Long toUserId) {
        // Enforce 24-hour daily limit
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long used = userSwipeRepository.countByFromUser_IdAndCreatedAtAfter(fromUserId, since);
        if (used >= DAILY_SWIPE_LIMIT) {
            Map<String, Object> err = new HashMap<>(getSwipeLimitStatus(fromUserId));
            err.put("status", "limit_reached");
            err.put("error", "Daily limit reached! You can swipe only " + DAILY_SWIPE_LIMIT + " profiles per 24 hours.");
            return err;
        }

        User fromUser = userRepository.findById(fromUserId).orElseThrow();
        User toUser = userRepository.findById(toUserId).orElseThrow();

        // Record the swipe action
        userSwipeRepository.save(UserSwipe.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .action(UserSwipe.Action.LIKE)
                .build());

        // Save like if not already liked
        if (!likeRepository.existsByFromUserAndToUser(fromUser, toUser)) {
            likeRepository.save(Like.builder().fromUser(fromUser).toUser(toUser).build());
        }

        long remaining = Math.max(0, DAILY_SWIPE_LIMIT - (used + 1));
        Map<String, Object> response = new HashMap<>();
        response.put("swipesRemaining", remaining);

        // Check mutual like — create match
        boolean mutual = likeRepository.existsByFromUserAndToUser(toUser, fromUser);
        if (mutual) {
            boolean alreadyMatched = matchRepository.findByUsers(fromUser, toUser).isPresent();
            if (!alreadyMatched) {
                Match match = matchRepository.save(
                        Match.builder().userA(fromUser).userB(toUser).build()
                );
                response.put("status", "matched");
                response.put("matchId", match.getId());
                return response;
            }
        }

        response.put("status", "liked");
        return response;
    }

    @Transactional
    public Map<String, Object> swipeDislike(Long fromUserId, Long toUserId) {
        // Enforce 24-hour daily limit
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long used = userSwipeRepository.countByFromUser_IdAndCreatedAtAfter(fromUserId, since);
        if (used >= DAILY_SWIPE_LIMIT) {
            Map<String, Object> err = new HashMap<>(getSwipeLimitStatus(fromUserId));
            err.put("status", "limit_reached");
            err.put("error", "Daily limit reached! You can swipe only " + DAILY_SWIPE_LIMIT + " profiles per 24 hours.");
            return err;
        }

        User fromUser = userRepository.findById(fromUserId).orElseThrow();
        User toUser = userRepository.findById(toUserId).orElseThrow();

        // Record the swipe action so disliked user is never shown again & counts toward limit
        userSwipeRepository.save(UserSwipe.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .action(UserSwipe.Action.DISLIKE)
                .build());

        long remaining = Math.max(0, DAILY_SWIPE_LIMIT - (used + 1));
        Map<String, Object> response = new HashMap<>();
        response.put("status", "disliked");
        response.put("swipesRemaining", remaining);
        return response;
    }
}
