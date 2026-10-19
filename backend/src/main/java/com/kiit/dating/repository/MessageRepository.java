package com.kiit.dating.repository;

import com.kiit.dating.entity.Match;
import com.kiit.dating.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByMatchOrderBySentAtAsc(Match match);

    long countByReceiverIdAndReadFalse(Long receiverId);
}
