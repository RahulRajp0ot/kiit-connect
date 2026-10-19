package com.kiit.dating.service;

import com.kiit.dating.entity.AppSettings;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.AppSettingsRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    private final AppSettingsRepository settingsRepository;
    private final UserRepository userRepository;

    private static final Long SETTINGS_ID = 1L;

    @Transactional
    public AppSettings getSettings() {
        return settingsRepository.findById(SETTINGS_ID).orElseGet(() -> {
            Set<String> defaultDomains = new HashSet<>();
            defaultDomains.add("kiit.ac.in");

            AppSettings defaultSettings = AppSettings.builder()
                    .id(SETTINGS_ID)
                    .matchingEnabled(false) // Initially disabled as requested
                    .matchingDisabledMessage("Campus matching is currently paused while initial students register! Stay tuned, we will go live soon! 🚀 — Admin")
                    .defaultDailySwipeLimit(5)
                    .allowedDomains(defaultDomains)
                    .build();
            return settingsRepository.save(defaultSettings);
        });
    }

    @Transactional
    public AppSettings updateMatching(boolean enabled, String disabledMessage) {
        AppSettings settings = getSettings();
        settings.setMatchingEnabled(enabled);
        if (disabledMessage != null && !disabledMessage.isBlank()) {
            settings.setMatchingDisabledMessage(disabledMessage.trim());
        }
        return settingsRepository.save(settings);
    }

    @Transactional
    public AppSettings updateDefaultSwipeLimit(int limit) {
        if (limit < 1) {
            throw new IllegalArgumentException("Daily swipe limit must be at least 1");
        }
        AppSettings settings = getSettings();
        settings.setDefaultDailySwipeLimit(limit);
        return settingsRepository.save(settings);
    }

    @Transactional
    public AppSettings addAllowedDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            throw new IllegalArgumentException("Domain cannot be empty");
        }
        String cleanDomain = domain.trim().toLowerCase().replaceAll("^@+", "");
        AppSettings settings = getSettings();
        settings.getAllowedDomains().add(cleanDomain);
        return settingsRepository.save(settings);
    }

    @Transactional
    public AppSettings removeAllowedDomain(String domain) {
        String cleanDomain = domain.trim().toLowerCase().replaceAll("^@+", "");
        AppSettings settings = getSettings();
        settings.getAllowedDomains().remove(cleanDomain);
        return settingsRepository.save(settings);
    }

    @Transactional
    public User setUserCustomSwipeLimit(Long userId, Integer customLimit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        // If customLimit is null or <= 0, reset to default (null)
        if (customLimit == null || customLimit <= 0) {
            user.setCustomDailySwipeLimit(null);
        } else {
            user.setCustomDailySwipeLimit(customLimit);
        }
        return userRepository.save(user);
    }

    public boolean isEmailDomainAllowed(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }
        String domain = email.substring(email.indexOf("@") + 1).trim().toLowerCase();
        AppSettings settings = getSettings();
        return settings.getAllowedDomains().contains(domain);
    }
}
