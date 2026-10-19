package com.kiit.dating.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kiit.dating.dto.ProfileUpdateRequest;
import com.kiit.dating.dto.UserDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.LikeRepository;
import com.kiit.dating.repository.MatchRepository;
import com.kiit.dating.repository.MessageRepository;
import com.kiit.dating.repository.UserRepository;
import com.kiit.dating.repository.UserSwipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final MatchRepository matchRepository;
    private final MessageRepository messageRepository;
    private final LikeRepository likeRepository;
    private final UserSwipeRepository userSwipeRepository;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${server.port:8088}")
    private String serverPort;

    @Transactional
    public void deleteMyAccount(Long userId) {
        messageRepository.deleteAllByUserId(userId);
        matchRepository.deleteAllByUserId(userId);
        likeRepository.deleteAllByUserId(userId);
        userSwipeRepository.deleteAllByUserId(userId);
        userRepository.deleteById(userId);
    }

    public UserDTO getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDTO(user);
    }


    public UserDTO updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getInterests() != null) user.setInterests(request.getInterests());

        // Mark profile as complete if bio and at least one photo exist
        if (user.getBio() != null && !user.getBio().isBlank()
                && user.getPhotoUrls() != null && !user.getPhotoUrls().isEmpty()) {
            user.setProfileComplete(true);
        }

        return toDTO(userRepository.save(user));
    }

    @SuppressWarnings("unchecked")
    public String uploadPhoto(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String url = null;
        if (cloudName != null && !cloudName.isBlank() && !cloudName.equals("your_cloud_name")) {
            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "kiit-dating/profile-photos",
                                "transformation", "q_auto,f_auto,w_600,c_fill,g_face"
                        )
                );
                url = (String) uploadResult.get("secure_url");
            } catch (Exception ignored) {}
        }

        if (url == null || url.isBlank()) {
            // Robust local static storage in uploads/ folder
            Path uploadDir = Paths.get("uploads");
            File dir = uploadDir.toFile();
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            Path targetPath = uploadDir.resolve(filename);
            Files.write(targetPath, file.getBytes());
            url = "http://localhost:" + serverPort + "/uploads/" + filename;
        }

        List<String> photos = user.getPhotoUrls() == null ? new ArrayList<>() : new ArrayList<>(user.getPhotoUrls());
        if (photos.size() >= 6) {
            throw new IllegalStateException("Maximum 6 photos allowed");
        }
        photos.add(url);
        user.setPhotoUrls(photos);

        // Auto-complete profile if bio + photo present
        if (user.getBio() != null && !user.getBio().isBlank()) {
            user.setProfileComplete(true);
        }

        userRepository.save(user);
        return url;
    }

    public void deletePhoto(Long userId, String photoUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<String> photos = new ArrayList<>(user.getPhotoUrls());
        photos.remove(photoUrl);
        user.setPhotoUrls(photos);
        if (photos.isEmpty()) user.setProfileComplete(false);
        userRepository.save(user);
    }

    @Transactional
    public UserDTO requestAccountDeletion(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setDeletionRequested(true);
        user.setDeletionRequestedAt(LocalDateTime.now());
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO cancelAccountDeletion(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setDeletionRequested(false);
        user.setDeletionRequestedAt(null);
        return toDTO(userRepository.save(user));
    }

    public UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .bio(user.getBio())
                .college(user.getCollege())
                .interests(user.getInterests())
                .photoUrls(user.getPhotoUrls())
                .active(user.isActive())
                .profileComplete(user.isProfileComplete())
                .role(user.getRole())
                .approvalStatus(user.getApprovalStatus())
                .deletionRequested(user.isDeletionRequested())
                .deletionRequestedAt(user.getDeletionRequestedAt())
                .customDailySwipeLimit(user.getCustomDailySwipeLimit())
                .build();
    }
}
