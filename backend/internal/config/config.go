package config

import "os"

type Config struct {
	Port          string
	DatabaseURL   string
	AdminToken    string
	AdminUsername string
	AdminPassword string
}

func Load() Config {
	return Config{
		Port:          env("PORT", "8080"),
		DatabaseURL:   env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/bnc?sslmode=disable"),
		AdminToken:    env("ADMIN_TOKEN", "change-me"),
		AdminUsername: env("ADMIN_USERNAME", "admin"),
		AdminPassword: env("ADMIN_PASSWORD", ""),
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
