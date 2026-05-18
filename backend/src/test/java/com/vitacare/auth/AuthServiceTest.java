package com.vitacare.auth;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.vitacare.auth.dto.LoginRequest;
import com.vitacare.auth.dto.LoginResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Testes de autenticação — cobre login bem-sucedido e dois caminhos de
 * erro (email inexistente, senha incorreta) com BadCredentialsException em
 * ambos para evitar enumeração de usuários.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepo;
    @Mock private PasswordEncoder encoder;
    @Mock private JwtService jwtService;

    @InjectMocks private AuthService authService;

    private Usuario admin;

    @BeforeEach
    void setUp() {
        admin = new Usuario();
        admin.setId(1L);
        admin.setEmail("admin@vitacare.local");
        admin.setNome("Administrador");
        admin.setSenhaHash("$2a$10$hashSimulado");
        admin.setPerfil(Perfil.ADMIN);
    }

    @Test
    @DisplayName("Login com credenciais corretas retorna token e usuário com perfil")
    void loginValido() {
        when(usuarioRepo.findByEmail("admin@vitacare.local")).thenReturn(Optional.of(admin));
        when(encoder.matches("admin123", admin.getSenhaHash())).thenReturn(true);
        when(jwtService.gerar(admin)).thenReturn("token.jwt.fake");
        when(jwtService.expirationHours()).thenReturn(8);

        LoginResponse resp = authService.autenticar(new LoginRequest("admin@vitacare.local", "admin123"));

        assertThat(resp.token()).isEqualTo("token.jwt.fake");
        assertThat(resp.expiresInHours()).isEqualTo(8);
        assertThat(resp.usuario().email()).isEqualTo("admin@vitacare.local");
        assertThat(resp.usuario().perfil()).isEqualTo(Perfil.ADMIN);
        assertThat(resp.usuario().nome()).isEqualTo("Administrador");
    }

    @Test
    @DisplayName("Login normaliza email (trim + lowercase) antes de consultar")
    void emailEhNormalizado() {
        when(usuarioRepo.findByEmail("admin@vitacare.local")).thenReturn(Optional.of(admin));
        when(encoder.matches(any(), any())).thenReturn(true);
        when(jwtService.gerar(any())).thenReturn("token");

        authService.autenticar(new LoginRequest("  ADMIN@VITACARE.LOCAL  ", "admin123"));

        // Se a normalização falhar, o mock de findByEmail não bate e o teste lança
        // UnnecessaryStubbingException ou NotFound. Aqui basta o sucesso indireto.
        assertThat(true).isTrue();
    }

    @Test
    @DisplayName("Email inexistente lança BadCredentialsException (sem enumerar usuários)")
    void emailInexistenteLancaBadCredentials() {
        when(usuarioRepo.findByEmail("nao.existe@vitacare.local")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                authService.autenticar(new LoginRequest("nao.existe@vitacare.local", "qualquer"))
        ).isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Senha incorreta lança BadCredentialsException")
    void senhaIncorretaLancaBadCredentials() {
        when(usuarioRepo.findByEmail("admin@vitacare.local")).thenReturn(Optional.of(admin));
        when(encoder.matches("senha-errada", admin.getSenhaHash())).thenReturn(false);

        assertThatThrownBy(() ->
                authService.autenticar(new LoginRequest("admin@vitacare.local", "senha-errada"))
        ).isInstanceOf(BadCredentialsException.class);
    }
}
