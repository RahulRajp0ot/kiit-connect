package com.kiit.dating.config;

import com.kiit.dating.entity.User;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Ensure database columns and nullability are relaxed for match chat
        try {
            jdbcTemplate.execute("ALTER TABLE messages ALTER COLUMN content DROP NOT NULL");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_users BOOLEAN DEFAULT FALSE");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP");
        } catch (Exception ignored) {}

        // ── 1. Admin Account ──────────────────────────────────────────────────
        seedUserIfNotExists(User.builder()
                .name("KIIT Admin")
                .email("admin@kiit.ac.in")
                .password(passwordEncoder.encode("admin1234"))
                .gender(User.Gender.OTHER)
                .role(User.Role.ADMIN)
                .active(true)
                .profileComplete(true)
                .bio("Campus dating platform administrator 🛡️")
                .college("KIIT University")
                .build());

        // ── 2. FEMALE STUDENTS (5 Profiles) ──────────────────────────────────

        // Female 1: Priya Sharma
        seedUserIfNotExists(User.builder()
                .name("Priya Sharma")
                .email("priya@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 5, 14))
                .bio("CS '25 | Coffee addict ☕ | Weekend coder & Taylor Swift fan 🎵")
                .interests(List.of("Coding", "Music", "Coffee", "Travel"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Female 2: Ananya Dash
        seedUserIfNotExists(User.builder()
                .name("Ananya Dash")
                .email("ananya@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2002, 11, 20))
                .bio("Biotech '24 | Foodie 🍕 | Looking for badminton partner & chai companion 🏸")
                .interests(List.of("Badminton", "Food", "Photography", "Books"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Female 3: Sneha Mohapatra
        seedUserIfNotExists(User.builder()
                .name("Sneha Mohapatra")
                .email("sneha@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 9, 8))
                .bio("ETC '25 | Kathak dancer 💃 | Sunset chaser & dog lover 🐾")
                .interests(List.of("Dance", "Pets", "Art", "Anime"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Female 4: Riya Sen
        seedUserIfNotExists(User.builder()
                .name("Riya Sen")
                .email("riya@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2004, 2, 17))
                .bio("Civil '26 | Poetry & late-night acoustic sessions 🎸 | Introvert till you get to know me")
                .interests(List.of("Guitar", "Poetry", "Stargazing", "Indie Music"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Female 5: Ishita Roy
        seedUserIfNotExists(User.builder()
                .name("Ishita Roy")
                .email("ishita@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.FEMALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 12, 3))
                .bio("Law '25 | Debate champion ⚖️ | Always ready for momo runs in Campus 6")
                .interests(List.of("Debate", "Food", "Fashion", "Movies"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // ── 3. MALE STUDENTS (5 Profiles) ────────────────────────────────────

        // Male 1: Rahul Verma
        seedUserIfNotExists(User.builder()
                .name("Rahul Verma")
                .email("rahul@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2002, 8, 10))
                .bio("Mechanical '24 | Guitarist 🎸 | Football on weekends ⚽ | Campus 3 regular")
                .interests(List.of("Guitar", "Football", "Gaming", "Fitness"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Male 2: Arjun Patnaik
        seedUserIfNotExists(User.builder()
                .name("Arjun Patnaik")
                .email("arjun@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 3, 25))
                .bio("IT '25 | Film buff 🎬 | Always down for midnight campus walks & deep talks")
                .interests(List.of("Cinema", "Anime", "Cycling", "Tech"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Male 3: Devansh Mishra
        seedUserIfNotExists(User.builder()
                .name("Devansh Mishra")
                .email("devansh@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2003, 7, 19))
                .bio("CS '25 | Gym enthusiast 🏋️‍♂️ | Hackathon geek | Let's grab coffee at CCD")
                .interests(List.of("Fitness", "Coding", "Startups", "Coffee"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Male 4: Rohan Panda
        seedUserIfNotExists(User.builder()
                .name("Rohan Panda")
                .email("rohan@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2002, 10, 12))
                .bio("Aerospace '24 | Drone enthusiast ✈️ | Street photography & weekend road trips 🏍️")
                .interests(List.of("Photography", "Biking", "Travel", "Drones"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());

        // Male 5: Aditya Sahoo
        seedUserIfNotExists(User.builder()
                .name("Aditya Sahoo")
                .email("aditya@kiit.ac.in")
                .password(passwordEncoder.encode("password123"))
                .gender(User.Gender.MALE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(2004, 1, 30))
                .bio("ECE '26 | Music producer 🎧 | Formula 1 fan 🏎️ | Sarcasm is my love language")
                .interests(List.of("Music", "Formula 1", "Gaming", "Memes"))
                .photoUrls(List.of("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600"))
                .active(true)
                .profileComplete(true)
                .college("KIIT University")
                .build());
    }

    private void seedUserIfNotExists(User user) {
        if (!userRepository.existsByEmail(user.getEmail())) {
            user.setApprovalStatus(User.ApprovalStatus.APPROVED);
            userRepository.save(user);
        }
    }
}
