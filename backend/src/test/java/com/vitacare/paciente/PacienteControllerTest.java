package com.vitacare.paciente;

import java.time.Instant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.vitacare.auth.JwtAuthFilter;
import com.vitacare.paciente.dto.PacienteResponse;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Matriz de permissões do PacienteController.
 *
 * Tabela esperada:
 *
 * | Ação        | ADMIN | PROFISSIONAL | CUIDADOR |
 * |-------------|-------|--------------|----------|
 * | POST  /     |  ✓    |     ✓        |    ✗     |
 * | PUT   /{id} |  ✓    |     ✓        |    ✗     |
 * | DELETE/{id} |  ✓    |     ✗        |    ✗     |
 *
 * Endpoints GET (listar/buscar) são acessíveis a qualquer autenticado e não
 * são testados aqui — sua autorização é só "autenticado", verificada pelo
 * filter chain global, não pelo @PreAuthorize.
 */
@WebMvcTest(PacienteController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(PacienteControllerTest.TestSecurityConfig.class)
class PacienteControllerTest {

    @Autowired private MockMvc mvc;

    @MockBean private PacienteService service;
    // JwtAuthFilter é @Component do projeto e seria escaneado pelo slice;
    // como suas deps (JwtService, JwtProperties) não existem aqui, mockamos.
    // Com addFilters=false esse mock fica fora da chain — não afeta o request.
    @MockBean private JwtAuthFilter jwtAuthFilter;

    private static final String JSON_PACIENTE =
            "{\"nome\":\"Teste\",\"idade\":70,\"contatoEmergencia\":null,\"fotoUrl\":null}";

    private final PacienteResponse RESP =
            new PacienteResponse(1L, "Teste", 70, null, null, Instant.now());

    @Nested
    @DisplayName("DELETE /api/pacientes/{id} — só ADMIN")
    class Deletar {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("ADMIN → 204 No Content")
        void adminPode() throws Exception {
            mvc.perform(delete("/api/pacientes/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(roles = "PROFISSIONAL")
        @DisplayName("PROFISSIONAL → 403 Forbidden")
        void profissionalProibido() throws Exception {
            mvc.perform(delete("/api/pacientes/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "CUIDADOR")
        @DisplayName("CUIDADOR → 403 Forbidden")
        void cuidadorProibido() throws Exception {
            mvc.perform(delete("/api/pacientes/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/pacientes — ADMIN e PROFISSIONAL")
    class Criar {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("ADMIN → 201 Created")
        void adminPode() throws Exception {
            when(service.criar(any())).thenReturn(RESP);
            mvc.perform(post("/api/pacientes")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(JSON_PACIENTE))
                    .andExpect(status().isCreated());
        }

        @Test
        @WithMockUser(roles = "PROFISSIONAL")
        @DisplayName("PROFISSIONAL → 201 Created")
        void profissionalPode() throws Exception {
            when(service.criar(any())).thenReturn(RESP);
            mvc.perform(post("/api/pacientes")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(JSON_PACIENTE))
                    .andExpect(status().isCreated());
        }

        @Test
        @WithMockUser(roles = "CUIDADOR")
        @DisplayName("CUIDADOR → 403 Forbidden")
        void cuidadorProibido() throws Exception {
            mvc.perform(post("/api/pacientes")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(JSON_PACIENTE))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/pacientes/{id} — ADMIN e PROFISSIONAL")
    class Atualizar {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("ADMIN → 200 OK")
        void adminPode() throws Exception {
            when(service.atualizar(eq(1L), any())).thenReturn(RESP);
            mvc.perform(put("/api/pacientes/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(JSON_PACIENTE))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "CUIDADOR")
        @DisplayName("CUIDADOR → 403 Forbidden")
        void cuidadorProibido() throws Exception {
            mvc.perform(put("/api/pacientes/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(JSON_PACIENTE))
                    .andExpect(status().isForbidden());
        }
    }

    /**
     * Habilita @PreAuthorize via @EnableMethodSecurity sem subir a
     * SecurityConfig real (que arrasta JwtAuthFilter, JwtService, properties).
     * O filtro web é desativado pelo @AutoConfigureMockMvc(addFilters = false);
     * a autorização aqui acontece no nível de método, com SecurityContext
     * preenchido pelo @WithMockUser de cada teste.
     */
    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfig {
    }
}
