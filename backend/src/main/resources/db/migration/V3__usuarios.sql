-- Tabela de usuários do VitaCare IoT. Senhas são armazenadas com BCrypt.
-- O seed dos 3 perfis (admin / profissional / cuidador) é feito em runtime
-- pelo UsuarioSeedRunner para usar o PasswordEncoder do Spring, evitando
-- hashes hardcoded.

CREATE TABLE usuarios (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(150) NOT NULL UNIQUE,
    nome        VARCHAR(150) NOT NULL,
    senha_hash  VARCHAR(100) NOT NULL,
    perfil      VARCHAR(30)  NOT NULL
                CHECK (perfil IN ('CUIDADOR', 'PROFISSIONAL', 'ADMIN')),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_email ON usuarios (email);
