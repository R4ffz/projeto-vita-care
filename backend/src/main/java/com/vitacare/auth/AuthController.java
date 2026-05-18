package com.vitacare.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vitacare.auth.dto.LoginRequest;
import com.vitacare.auth.dto.LoginResponse;
import com.vitacare.auth.dto.UsuarioResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return service.autenticar(req);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(service.buscarPorEmail((String) auth.getPrincipal()));
    }
}
