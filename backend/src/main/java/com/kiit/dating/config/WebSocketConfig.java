package com.kiit.dating.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // in-memory broker for topic destinations
        registry.enableSimpleBroker("/topic", "/queue");
        // prefix for messages sent from client to server
        registry.setApplicationDestinationPrefixes("/app");
        // prefix for user-specific messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket for modern browsers and @stomp/stompjs brokerURL
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        // SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
