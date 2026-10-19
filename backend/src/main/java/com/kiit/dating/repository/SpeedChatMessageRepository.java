package com.kiit.dating.repository;

import com.kiit.dating.entity.SpeedChatMessage;
import com.kiit.dating.entity.SpeedChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SpeedChatMessageRepository extends JpaRepository<SpeedChatMessage, Long> {

    List<SpeedChatMessage> findBySessionOrderBySentAtAsc(SpeedChatSession session);

    long countBySession(SpeedChatSession session);

    @Modifying
    @Query("DELETE FROM SpeedChatMessage m WHERE m.session.id = :sessionId")
    void deleteAllBySessionId(@Param("sessionId") Long sessionId);

    @Modifying
    @Query("DELETE FROM SpeedChatMessage m WHERE m.sentAt < :threshold")
    void deleteOlderThan(@Param("threshold") LocalDateTime threshold);
}
