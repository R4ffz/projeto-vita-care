package com.vitacare.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vitacare.auth.dto.LoginRequest;
import com.vitacare.auth.dto.LoginResponse;
import com.vitacare.auth.dto.UsuarioResponse;
import com.vitacare.common.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public LoginResponse autenticar(LoginRequest req) {
        Usuario u = repo.findByEmail(req.email().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));
        if (!encoder.matches(req.senha(), u.getSenhaHash())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }
        String token = jwtService.gerar(u);
        return LoginResponse.of(token, jwtService.expirationHours(),
                u.getId(), u.getEmail(), u.getNome(), u.getPerfil());
    }

    public UsuarioResponse buscarPorEmail(String email) {
        Usuario u = repo.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário " + email + " não encontrado"));
        return new UsuarioResponse(u.getId(), u.getEmail(), u.getNome(), u.getPerfil());
    }
}
