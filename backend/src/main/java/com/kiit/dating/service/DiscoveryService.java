package com.kiit.dating.service;

import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.AppSettings;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiscoveryService {

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final MatchRepository matchRepository;
    private final UserSwipeRepository userSwipeRepository;
    private final ProfileService profileService;
    private final AdminSettingsService adminSettingsService;

    public List<UserDTO> getDiscoverableUsers(Long currentUserId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (current.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            return Collections.emptyList();
        }

        AppSettings settings = adminSettingsService.getSettings();
        if (!settings.isMatchingEnabled()) {
            // Matching is disabled by admin
            return Collections.emptyList();
        }

        return userRepository.findDiscoverableUsers(currentUserId, current.getGender(), User.ApprovalStatus.APPROVED)
                .stream()
                .map(profileService::toDTO)
                .toList();
    }

    public int getUserDailySwipeLimit(User user) {
        if (user.getCustomDailySwipeLimit() != null && user.getCustomDailySwipeLimit() > 0) {
            return user.getCustomDailySwipeLimit();
        }
        return adminSettingsService.getSettings().getDefaultDailySwipeLimit();
    }

    public Map<String, Object> getSwipeLimitStatus(Long userId) {
        AppSettings settings = adminSettingsService.getSettings();
        User user = userRepository.findById(userId).orElseThrow();
        int userLimit = getUserDailySwipeLimit(user);

        // Only count LIKES towards the daily limit — Passes/Dislikes are unlimited like Tinder!
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long used = userSwipeRepository.countByFromUser_IdAndActionAndCreatedAtAfter(userId, UserSwipe.Action.LIKE, since);
        long remaining = Math.max(0, userLimit - used);
        boolean limitReached = remaining <= 0;

        long resetInMinutes = 0L;
        if (limitReached) {
            List<UserSwipe> recent = userSwipeRepository.findByFromUser_IdAndActionAndCreatedAtAfterOrderByCreatedAtAsc(userId, UserSwipe.Action.LIKE, since);
            if (!recent.isEmpty()) {
                LocalDateTime oldestInWindow = recent.get(0).getCreatedAt();
                LocalDateTime resetTime = oldestInWindow.plusHours(24);
                resetInMinutes = Math.max(1, Duration.between(LocalDateTime.now(), resetTime).toMinutes());
            }
        }

        Map<String, Object> status = new HashMap<>();
        status.put("approvalStatus", user.getApprovalStatus() != null ? user.getApprovalStatus().name() : "PENDING");
        status.put("isApproved", user.getApprovalStatus() == User.ApprovalStatus.APPROVED);
        status.put("matchingEnabled", settings.isMatchingEnabled());
        status.put("matchingDisabledMessage", settings.getMatchingDisabledMessage());
        status.put("maxLimit", userLimit);
        status.put("defaultLimit", settings.getDefaultDailySwipeLimit());
        status.put("hasCustomLimit", user.getCustomDailySwipeLimit() != null);
        status.put("swipesUsed", used);
        status.put("swipesRemaining", remaining);
        status.put("limitReached", limitReached);
        status.put("resetInMinutes", resetInMinutes);
        status.put("rejectionReason", user.getRejectionReason());
        return status;
    }

    @Transactional
    public Map<String, Object> swipeLike(Long fromUserId, Long toUserId) {
        User fromUser = userRepository.findById(fromUserId).orElseThrow();
        if (fromUser.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "pending_review");
            res.put("error", "Waiting for review. An admin must verify your profile before you can swipe.");
            return res;
        }

        AppSettings settings = adminSettingsService.getSettings();
        if (!settings.isMatchingEnabled()) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "matching_disabled");
            res.put("message", settings.getMatchingDisabledMessage());
            return res;
        }

        User toUser = userRepository.findById(toUserId).orElseThrow();
        int userLimit = getUserDailySwipeLimit(fromUser);

        // Enforce 24-hour limit on LIKES only
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long usedLikes = userSwipeRepository.countByFromUser_IdAndActionAndCreatedAtAfter(fromUserId, UserSwipe.Action.LIKE, since);
        if (usedLikes >= userLimit) {
            Map<String, Object> err = new HashMap<>(getSwipeLimitStatus(fromUserId));
            err.put("status", "limit_reached");
            err.put("error", "Daily like limit reached! You can like only " + userLimit + " profiles per 24 hours. (You can still pass profiles freely!)");
            return err;
        }

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

        long remaining = Math.max(0, userLimit - (usedLikes + 1));
        Map<String, Object> response = new HashMap<>();
        response.put("swipesRemaining", remaining);

        // Check mutual like — create match
        boolean mutual = likeRepository.existsByFromUserAndToUser(toUser, fromUser);
        if (mutual) {
            boolean alreadyMatched = matchRepository.findByUsers(fromUser, toUser).isPresent();
            if (!alreadyMatched) {
                matchRepository.save(
                        Match.builder()
                                .userA(fromUser)
                                .userB(toUser)
                                .status(Match.Status.PENDING)
                                .build()
                );
                // Return "liked" so user does NOT know they matched or that admin review is happening
                response.put("status", "liked");
                return response;
            }
        }

        response.put("status", "liked");
        return response;
    }

    @Transactional
    public Map<String, Object> swipeDislike(Long fromUserId, Long toUserId) {
        User fromUser = userRepository.findById(fromUserId).orElseThrow();
        if (fromUser.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "pending_review");
            res.put("error", "Waiting for review. An admin must verify your profile before you can swipe.");
            return res;
        }

        AppSettings settings = adminSettingsService.getSettings();
        if (!settings.isMatchingEnabled()) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "matching_disabled");
            res.put("message", settings.getMatchingDisabledMessage());
            return res;
        }

        User toUser = userRepository.findById(toUserId).orElseThrow();

        // Dislikes/Passes are UNLIMITED like Tinder! Record the swipe so passed student is never shown again
        userSwipeRepository.save(UserSwipe.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .action(UserSwipe.Action.DISLIKE)
                .build());

        // Likes remaining is unaffected by dislikes!
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        int userLimit = getUserDailySwipeLimit(fromUser);
        long usedLikes = userSwipeRepository.countByFromUser_IdAndActionAndCreatedAtAfter(fromUserId, UserSwipe.Action.LIKE, since);
        long remaining = Math.max(0, userLimit - usedLikes);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "disliked");
        response.put("swipesRemaining", remaining);
        return response;
    }
}
