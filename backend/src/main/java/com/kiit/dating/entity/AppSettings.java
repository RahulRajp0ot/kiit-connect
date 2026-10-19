package com.kiit.dating.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSettings {

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean matchingEnabled;

    @Column(length = 1000)
    private String matchingDisabledMessage;

    @Column(nullable = false)
    private int defaultDailySwipeLimit;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "allowed_email_domains", joinColumns = @JoinColumn(name = "settings_id"))
    @Column(name = "domain")
    @Builder.Default
    private Set<String> allowedDomains = new HashSet<>();
}
