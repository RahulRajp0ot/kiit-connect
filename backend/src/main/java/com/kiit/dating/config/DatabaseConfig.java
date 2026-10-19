package com.kiit.dating.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Slf4j
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = url;
        String dbUser = username;
        String dbPass = password;

        if (dbUrl != null && !dbUrl.startsWith("jdbc:h2:") && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://") || dbUrl.contains("@"))) {
            try {
                String cleanUriStr = dbUrl.startsWith("jdbc:") ? dbUrl.substring(5) : dbUrl;
                URI uri = new URI(cleanUriStr);

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    if (dbUser == null || dbUser.isBlank() || "sa".equalsIgnoreCase(dbUser)) {
                        dbUser = userInfo[0];
                    }
                    if (userInfo.length > 1 && (dbPass == null || dbPass.isBlank())) {
                        dbPass = userInfo[1];
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath() != null ? uri.getPath() : "/neondb";
                String query = uri.getQuery();

                dbUrl = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "?sslmode=require");
                log.info("🔌 Configured PostgreSQL JDBC URL: {}:{} with user: {}", host, port, dbUser);
            } catch (Exception e) {
                if (!dbUrl.startsWith("jdbc:")) {
                    dbUrl = "jdbc:" + dbUrl;
                }
                log.info("🔌 Formatted JDBC URL: {}", dbUrl);
            }
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        config.setUsername(dbUser);
        config.setPassword(dbPass);
        config.setPoolName("KiitDatingHikariPool");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);

        return new HikariDataSource(config);
    }
}
