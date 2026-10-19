package com.kiit.dating.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    private String name;
    private String bio;
    private String college;
    private List<String> interests;
    private List<String> photoUrls;
}
