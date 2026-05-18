package com.vitacare.paciente;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vitacare.paciente.dto.PacienteRequest;
import com.vitacare.paciente.dto.PacienteResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteService service;

    public PacienteController(PacienteService service) {
        this.service = service;
    }

    @GetMapping
    public List<PacienteResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public PacienteResponse buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<PacienteResponse> criar(@Valid @RequestBody PacienteRequest req) {
        PacienteResponse criado = service.criar(req);
        return ResponseEntity
                .created(URI.create("/api/pacientes/" + criado.id()))
                .body(criado);
    }

    @PutMapping("/{id}")
    public PacienteResponse atualizar(@PathVariable Long id,
                                      @Valid @RequestBody PacienteRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
