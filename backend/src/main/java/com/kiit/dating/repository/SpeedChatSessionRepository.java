package com.kiit.dating.repository;

import com.kiit.dating.entity.SpeedChatSession;
import com.kiit.dating.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpeedChatSessionRepository extends JpaRepository<SpeedChatSession, Long> {

    Optional<SpeedChatSession> findBySessionUuid(String sessionUuid);

    List<SpeedChatSession> findByStartedAtAfterOrderByStartedAtDesc(LocalDateTime threshold);

    @Query("SELECT s FROM SpeedChatSession s WHERE (s.user1 = :user OR s.user2 = :user) AND s.status = :status")
    List<SpeedChatSession> findActiveSessionsForUser(@Param("user") User user, @Param("status") SpeedChatSession.Status status);

    @Query("SELECT COUNT(s) FROM SpeedChatSession s WHERE (s.user1.id = :userId OR s.user2.id = :userId) AND s.startedAt >= :since")
    long countSessionsForUserSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Modifying
    @Query("DELETE FROM SpeedChatSession s WHERE s.startedAt < :threshold")
    void deleteOlderThan(@Param("threshold") LocalDateTime threshold);
}
