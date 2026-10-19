package com.kiit.dating.repository;

import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    @Query("SELECT m FROM Match m JOIN FETCH m.userA JOIN FETCH m.userB WHERE (m.userA.id = :userId OR m.userB.id = :userId) AND m.status = :status ORDER BY m.matchedAt DESC")
    List<Match> findAllByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Match.Status status);

    default List<Match> findAllByUserId(Long userId) {
        return findAllByUserIdAndStatus(userId, Match.Status.APPROVED);
    }

    @Query("SELECT m FROM Match m JOIN FETCH m.userA JOIN FETCH m.userB WHERE m.status = :status ORDER BY m.matchedAt DESC")
    List<Match> findAllByStatus(@Param("status") Match.Status status);

    default List<Match> findAllPendingMatches() {
        return findAllByStatus(Match.Status.PENDING);
    }

    long countByStatus(Match.Status status);

    @Query("SELECT m FROM Match m WHERE (m.userA = :u1 AND m.userB = :u2) OR (m.userA = :u2 AND m.userB = :u1)")
    Optional<Match> findByUsers(@Param("u1") User u1, @Param("u2") User u2);

    boolean existsByUserAAndUserB(User userA, User userB);
    boolean existsByUserAAndUserBOrUserBAndUserA(User userA, User userB, User userA2, User userB2);

    @Modifying
    @Query("DELETE FROM Match m WHERE m.userA.id = :userId OR m.userB.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
