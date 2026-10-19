package com.kiit.dating.dto;

import com.kiit.dating.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {

    @NotBlank
    private String name;

    @Email
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@kiit\\.ac\\.in$",
             message = "Only KIIT university email addresses (@kiit.ac.in) are allowed")
    private String email;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull
    private User.Gender gender;

    @NotNull
    @Past
    private LocalDate dateOfBirth;
}
