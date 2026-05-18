package com.vitacare.auth;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Garante os 3 usuários de demonstração na inicialização. Usa o
 * PasswordEncoder do Spring para gerar o BCrypt — evita hashes hardcoded
 * na migration. Idempotente: se a tabela já tem registros, não faz nada.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UsuarioSeedRunner implements ApplicationRunner {

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) {
            log.debug("Tabela usuarios ja populada — seed ignorado.");
            return;
        }
        repo.save(criar("admin@vitacare.local",      "Administrador",        "admin123",        Perfil.ADMIN));
        repo.save(criar("enfermagem@vitacare.local", "Equipe de Enfermagem", "profissional123", Perfil.PROFISSIONAL));
        repo.save(criar("cuidador@vitacare.local",   "Cuidador da Família",  "cuidador123",     Perfil.CUIDADOR));
        log.info("Seed: 3 usuarios de demonstracao criados (admin/profissional/cuidador).");
    }

    private Usuario criar(String email, String nome, String senha, Perfil perfil) {
        Usuario u = new Usuario();
        u.setEmail(email);
        u.setNome(nome);
        u.setSenhaHash(encoder.encode(senha));
        u.setPerfil(perfil);
        return u;
    }
}
