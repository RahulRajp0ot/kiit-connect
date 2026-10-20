# ============================================================
# Stage 1: Build with Maven
# ============================================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ============================================================
# Stage 2: Run with minimal JRE
# ============================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8088 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
