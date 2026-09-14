FROM gradle:8.14-jdk17 AS build

WORKDIR /workspace
COPY . .
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:17-jre

WORKDIR /app
RUN useradd --system --create-home --shell /usr/sbin/nologin spovisor
COPY --from=build --chown=spovisor:spovisor /workspace/build/libs/*.jar app.jar
USER spovisor
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
