package com.vitacare.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vitacare.security.jwt")
public record JwtProperties(
        String secret,
        int expirationHours,
        String issuer
) {
}
