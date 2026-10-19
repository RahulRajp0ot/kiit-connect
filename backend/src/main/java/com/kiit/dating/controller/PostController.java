package com.kiit.dating.controller;

import com.kiit.dating.dto.PostDTO;
import com.kiit.dating.entity.User;
import com.kiit.dating.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<PostDTO>> getPosts(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.getAllPosts(currentUser));
    }

    @PostMapping
    public ResponseEntity<PostDTO> createPost(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("quote") String quote,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        return ResponseEntity.ok(postService.createPost(currentUser, quote, file));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.toggleLike(id, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        postService.deletePost(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
