package com.kiit.dating.service;

import com.kiit.dating.dto.MatchDTO;
import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MatchDTO> getMatches(Long userId) {
        return matchRepository.findAllByUserId(userId).stream()
                .map(match -> toMatchDTO(match, userId))
                .toList();
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
}
