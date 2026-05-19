# syntax=docker/dockerfile:1.6
# ──────────────────────────────────────────────────────────────────────────────
# Estágio 1 — build do JAR com Maven Wrapper.
# Usa BuildKit cache mount para o .m2, acelerando rebuilds.
# ──────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build

WORKDIR /workspace

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN --mount=type=cache,id=m2,target=/root/.m2 \
    chmod +x mvnw && \
    ./mvnw -B -DskipTests package && \
    cp target/*.jar /workspace/app.jar

# ──────────────────────────────────────────────────────────────────────────────
# Estágio 2 — runtime enxuto. Usuário não-root, healthcheck via /api/health.
# ──────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

RUN apk add --no-cache wget tini && \
    addgroup -S app && adduser -S app -G app

USER app
WORKDIR /app

COPY --from=build /workspace/app.jar app.jar

EXPOSE 8080

# Perfil 'docker' carrega application-docker.yml por cima do application.yml.
ENV SPRING_PROFILES_ACTIVE=docker \
    JAVA_OPTS=""

HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=8 \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
