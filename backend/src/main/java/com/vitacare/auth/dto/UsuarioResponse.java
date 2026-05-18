package com.vitacare.auth.dto;

import com.vitacare.auth.Perfil;

public record UsuarioResponse(
        Long id,
        String email,
        String nome,
        Perfil perfil
) {
}
