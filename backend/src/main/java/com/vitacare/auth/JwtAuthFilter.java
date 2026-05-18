package com.vitacare.auth;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Extrai o JWT do header Authorization, valida e popula o SecurityContext
 * com uma Authentication contendo o e-mail como principal e ROLE_<perfil>
 * como authority. Tokens inválidos / ausentes são ignorados — quem decide
 * negar é o SecurityFilterChain via authorizeHttpRequests.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse resp,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String header = req.getHeader(HEADER);
        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length()).trim();
            try {
                Claims claims = jwtService.validar(token).getPayload();
                String email  = claims.getSubject();
                String perfil = claims.get("perfil", String.class);

                if (email != null && perfil != null
                        && SecurityContextHolder.getContext().getAuthentication() == null) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            email, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + perfil))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | IllegalArgumentException e) {
                // Token inválido / expirado — deixa sem autenticação. O Security
                // bloqueia rotas protegidas com 401 via AuthenticationEntryPoint.
                log.debug("JWT invalido: {}", e.getMessage());
            }
        }

        chain.doFilter(req, resp);
    }
}
