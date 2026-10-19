package com.kiit.dating.config;

import com.kiit.dating.entity.User;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        // 1. Admin account
        userRepository.save(User.builder()
                .name("KIIT Admin")
                .email("admin@kiit.ac.in")
                .password(passwordEncoder.encode("admin1234"))
                .gender(User.Gender.OTHER)
                .role(User.Role.ADMIN)
                .active(true)
                .profileComplete(true)
                .bio("Campus dating platform administrator")
                .build());

        // 2. Demo Female Profile 1
        userRepository.save(User.builder()
                .name("Priya Sharma")
                .email("priya@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 5, 14))
                .bio("CS '25 | Coffee addict ☕ | Weekend coder & music lover 🎵")
                .interests(List.of("Coding", "Music", "Coffee", "Travel"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600"))
                .active(true)
                .profileComplete(true)
                .build());

        // 3. Demo Female Profile 2
        userRepository.save(User.builder()
                .name("Ananya Dash")
                .email("ananya@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2002, 11, 20))
                .bio("Biotech '24 | Foodie 🍕 | Looking for good conversations & badminton partner 🏸")
                .interests(List.of("Badminton", "Food", "Photography", "Books"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"))
                .active(true)
                .profileComplete(true)
                .build());

        // 4. Demo Male Profile 1
        userRepository.save(User.builder()
                .name("Rahul Verma")
                .email("rahul@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2002, 8, 10))
                .bio("Mechanical '24 | Guitarist 🎸 | Football on weekends ⚽")
                .interests(List.of("Guitar", "Football", "Gaming", "Fitness"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"))
                .active(true)
                .profileComplete(true)
                .build());

        // 5. Demo Male Profile 2
        userRepository.save(User.builder()
                .name("Arjun Patnaik")
                .email("arjun@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 3, 25))
                .bio("IT '25 | Film buff 🎬 | Always down for midnight campus walks")
                .interests(List.of("Cinema", "Anime", "Cycling", "Tech"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600"))
                .active(true)
                .profileComplete(true)
                .build());
    }
}
