# Simulador — VitaCare IoT

Dispositivo IoT virtual em Node.js que substitui o ESP32 físico durante o desenvolvimento e a apresentação.

Responsabilidades:

- Publicar sinais vitais (BPM, SpO₂, temperatura) em `pacientes/{id}/sinais`.
- Publicar eventos de queda em `pacientes/{id}/queda`.
- Assinar `pacientes/{id}/comando` e executar eventos disparados pelo backend (queda, taquicardia, queda de SpO₂, reset).

Cada paciente virtual tem um perfil fisiológico próprio (saudável, hipertenso, idoso frágil) e gera valores com variação realista.

Conteúdo será populado a partir da Fase 6 do plano de implementação.
