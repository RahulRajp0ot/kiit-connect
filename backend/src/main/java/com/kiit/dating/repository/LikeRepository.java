package com.kiit.dating.repository;

import com.kiit.dating.entity.Like;
import com.kiit.dating.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByFromUserAndToUser(User fromUser, User toUser);

    Optional<Like> findByFromUserAndToUser(User fromUser, User toUser);

    long countByToUserId(Long toUserId);

    @Modifying
    @Query("DELETE FROM Like l WHERE l.fromUser.id = :userId OR l.toUser.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Like l WHERE (l.fromUser = :u1 AND l.toUser = :u2) OR (l.fromUser = :u2 AND l.toUser = :u1)")
    void deleteLikesBetween(@Param("u1") User u1, @Param("u2") User u2);
}

