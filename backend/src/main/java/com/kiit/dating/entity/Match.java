package com.kiit.dating.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_a_id", "user_b_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_a_id", nullable = false)
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_b_id", nullable = false)
    private User userB;

    @Column(updatable = false)
    private LocalDateTime matchedAt;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private Status status = Status.PENDING;

    @PrePersist
    protected void onCreate() {
        if (matchedAt == null) {
            matchedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = Status.PENDING;
        }
    }
}
