package com.vitacare.auth.dto;

import com.vitacare.auth.Perfil;

public record LoginResponse(
        String token,
        long expiresInHours,
        UsuarioResponse usuario
) {
    public static LoginResponse of(String token, long expiresInHours,
                                   Long id, String email, String nome, Perfil perfil) {
        return new LoginResponse(token, expiresInHours,
                new UsuarioResponse(id, email, nome, perfil));
    }
}
