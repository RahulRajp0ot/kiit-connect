package com.kiit.dating.repository;

import com.kiit.dating.entity.Post;
import com.kiit.dating.entity.PostLike;
import com.kiit.dating.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPostAndUser(Post post, User user);
    boolean existsByPostAndUser(Post post, User user);
    void deleteByPost(Post post);
    int countByPost(Post post);
}
