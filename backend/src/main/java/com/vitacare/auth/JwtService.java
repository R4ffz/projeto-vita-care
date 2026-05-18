package com.vitacare.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Geração e validação de JWT (HS256). Tokens carregam o e-mail como subject e
 * o perfil + nome do usuário como claims customizadas. Não há refresh token —
 * o protótipo se contenta com expiração configurável (default 8h).
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final JwtProperties props;

    public JwtService(JwtProperties props) {
        byte[] bytes = props.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "vitacare.security.jwt.secret precisa ter ao menos 32 bytes (HS256).");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.props = props;
    }

    public String gerar(Usuario u) {
        Instant agora = Instant.now();
        Instant exp = agora.plus(props.expirationHours(), ChronoUnit.HOURS);
        return Jwts.builder()
                .issuer(props.issuer())
                .subject(u.getEmail())
                .claim("perfil", u.getPerfil().name())
                .claim("nome", u.getNome())
                .claim("uid", u.getId())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Jws<Claims> validar(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.issuer())
                .build()
                .parseSignedClaims(token);
    }

    public int expirationHours() {
        return props.expirationHours();
    }
}
