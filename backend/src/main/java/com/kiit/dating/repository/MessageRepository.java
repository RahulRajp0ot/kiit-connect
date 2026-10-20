package com.kiit.dating.repository;

import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByMatchOrderBySentAtAsc(Match match);

    List<Message> findByMatchIdOrderBySentAtAsc(Long matchId);

    long countByReceiverIdAndReadFalse(Long receiverId);

    long countByMatchId(Long matchId);

    long countByMatchIdAndDeletedForUsersTrue(Long matchId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.match.id = :matchId")
    void deleteAllByMatchId(@Param("matchId") Long matchId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.sentAt < :cutoff")
    int deleteBySentAtBefore(@Param("cutoff") java.time.LocalDateTime cutoff);
}
