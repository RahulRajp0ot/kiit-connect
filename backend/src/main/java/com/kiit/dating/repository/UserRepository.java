package com.kiit.dating.repository;

import com.kiit.dating.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM User u
        WHERE u.id != :currentUserId
          AND u.gender != :gender
          AND u.active = true
          AND u.profileComplete = true
          AND u.id NOT IN (
              SELECT s.toUser.id FROM UserSwipe s WHERE s.fromUser.id = :currentUserId
          )
        ORDER BY FUNCTION('RANDOM')
        """)
    List<User> findDiscoverableUsers(@Param("currentUserId") Long currentUserId,
                                     @Param("gender") User.Gender gender);
}
