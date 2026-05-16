# Backend — VitaCare IoT

Aplicação Spring Boot (Java 17, Maven) responsável por:

- Expor a **API REST** de cadastro de pacientes, autenticação e consulta de histórico.
- Consumir mensagens **MQTT** publicadas pelo simulador (sinais vitais e eventos de queda).
- Persistir leituras e alertas no **PostgreSQL** via Spring Data JPA.
- Avaliar **regras de alerta** (limites de sinais vitais e detecção de queda).
- Publicar comandos para o simulador via MQTT.
- Emitir **eventos em tempo real** para o frontend via WebSocket/STOMP.

Conteúdo será populado a partir da Fase 1 do plano de implementação.
