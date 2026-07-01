package com.trustfund;

import com.trustfund.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
@EnableAsync
public class TrustfundBackendApplication {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(TrustfundBackendApplication.class, args);
	}

	private static void loadDotenv() {
		Path envFile = Path.of(".env");
		if (!Files.exists(envFile)) {
			return;
		}

		try {
			Files.readAllLines(envFile).stream()
					.map(String::trim)
					.filter(line -> !line.isBlank() && !line.startsWith("#") && line.contains("="))
					.forEach(line -> {
						int separator = line.indexOf('=');
						String key = line.substring(0, separator).trim();
						String value = line.substring(separator + 1).trim();
						if ((value.startsWith("\"") && value.endsWith("\""))
								|| (value.startsWith("'") && value.endsWith("'"))) {
							value = value.substring(1, value.length() - 1);
						}
						System.setProperty(key, System.getProperty(key, value));
					});
		} catch (IOException ignored) {
			// Environment variables remain the fallback if the local file cannot be read.
		}
	}

}
