package com.kiit.dating.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kiit.dating.dto.PostDTO;
import com.kiit.dating.entity.Post;
import com.kiit.dating.entity.PostLike;
import com.kiit.dating.entity.User;
import com.kiit.dating.repository.PostLikeRepository;
import com.kiit.dating.repository.PostRepository;
import com.kiit.dating.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${server.port:8088}")
    private String serverPort;

    @Transactional(readOnly = true)
    public List<PostDTO> getAllPosts(User currentUser) {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> toDTO(p, currentUser))
                .toList();
    }

    @Transactional
    public PostDTO createPost(User currentUser, String quote, MultipartFile file) throws IOException {
        User author = userRepository.findById(currentUser.getId())
                .orElse(currentUser);

        String photoUrl = null;
        if (file != null && !file.isEmpty()) {
            photoUrl = uploadImage(file);
        }

        Post post = Post.builder()
                .author(author)
                .quote(quote != null ? quote.trim() : "")
                .photoUrl(photoUrl)
                .createdAt(LocalDateTime.now())
                .likesCount(0)
                .build();

        post = postRepository.save(post);
        return toDTO(post, author);
    }

    @Transactional
    public Map<String, Object> toggleLike(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        boolean liked;
        var existing = postLikeRepository.findByPostAndUser(post, currentUser);
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            liked = false;
        } else {
            postLikeRepository.save(PostLike.builder().post(post).user(currentUser).build());
            post.setLikesCount(post.getLikesCount() + 1);
            liked = true;
        }
        postRepository.save(post);

        return Map.of(
                "postId", postId,
                "likesCount", post.getLikesCount(),
                "likedByMe", liked
        );
    }

    @Transactional
    public void deletePost(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        boolean isAuthor = post.getAuthor().getId().equals(currentUser.getId());
        boolean isStaff = currentUser.getRole() == User.Role.ADMIN || currentUser.getRole() == User.Role.MODERATOR;

        if (!isAuthor && !isStaff) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this post");
        }

        postLikeRepository.deleteByPost(post);
        postRepository.delete(post);
    }

    private String uploadImage(MultipartFile file) throws IOException {
        if (cloudName != null && !cloudName.isBlank() && !cloudName.equals("your_cloud_name")) {
            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "kiit-dating/posts",
                                "transformation", "q_auto,f_auto,w_1080"
                        )
                );
                return (String) uploadResult.get("secure_url");
            } catch (Exception ignored) {}
        }

        Path uploadDir = Paths.get("uploads");
        File dir = uploadDir.toFile();
        if (!dir.exists()) dir.mkdirs();

        String originalFilename = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "post_" + UUID.randomUUID().toString() + extension;
        Path targetPath = uploadDir.resolve(filename);
        Files.write(targetPath, file.getBytes());
        return "http://localhost:" + serverPort + "/uploads/" + filename;
    }

    private PostDTO toDTO(Post post, User currentUser) {
        boolean likedByMe = currentUser != null && postLikeRepository.existsByPostAndUser(post, currentUser);
        boolean canDelete = currentUser != null && (
                post.getAuthor().getId().equals(currentUser.getId()) ||
                currentUser.getRole() == User.Role.ADMIN ||
                currentUser.getRole() == User.Role.MODERATOR
        );

        String avatar = null;
        try {
            if (post.getAuthor().getPhotoUrls() != null && !post.getAuthor().getPhotoUrls().isEmpty()) {
                avatar = post.getAuthor().getPhotoUrls().get(0);
            }
        } catch (Exception ignored) {}

        return PostDTO.builder()
                .id(post.getId())
                .quote(post.getQuote())
                .photoUrl(post.getPhotoUrl())
                .likesCount(post.getLikesCount())
                .likedByMe(likedByMe)
                .createdAt(post.getCreatedAt())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getName())
                .authorEmail(post.getAuthor().getEmail())
                .authorCollege(post.getAuthor().getCollege())
                .authorAvatar(avatar)
                .authorRole(post.getAuthor().getRole().name())
                .canDelete(canDelete)
                .build();
    }
}
