package com.kiit.dating.repository;

import com.kiit.dating.entity.User;
import com.kiit.dating.entity.UserSwipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserSwipeRepository extends JpaRepository<UserSwipe, Long> {

    long countByFromUser_IdAndCreatedAtAfter(Long fromUserId, LocalDateTime since);

    List<UserSwipe> findByFromUser_IdAndCreatedAtAfterOrderByCreatedAtAsc(Long fromUserId, LocalDateTime since);

    boolean existsByFromUserAndToUser(User fromUser, User toUser);
}
