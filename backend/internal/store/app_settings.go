package store

import "context"

type AppSettings struct {
	SiteName              string `json:"siteName"`
	Tagline               string `json:"tagline"`
	PrimaryColor          string `json:"primaryColor"`
	SecondaryColor        string `json:"secondaryColor"`
	AccentColor           string `json:"accentColor"`
	BackgroundColor       string `json:"backgroundColor"`
	SurfaceColor          string `json:"surfaceColor"`
	MutedTextColor        string `json:"mutedTextColor"`
	LogoURL               string `json:"logoUrl"`
	DefaultCity           string `json:"defaultCity"`
	DefaultRegion         string `json:"defaultRegion"`
	SupportPhone          string `json:"supportPhone"`
	SupportWhatsApp       string `json:"supportWhatsApp"`
	SupportEmail          string `json:"supportEmail"`
	CurrencyCode          string `json:"currencyCode"`
	EnableDeals           bool   `json:"enableDeals"`
	EnableDoctorBookings  bool   `json:"enableDoctorBookings"`
	UpdateIntervalSeconds int    `json:"updateIntervalSeconds"`
}

func DefaultAppSettings() AppSettings {
	return AppSettings{
		SiteName:              "BNC Nearu",
		Tagline:               "Local shops, services, offers, and bookings in one place.",
		PrimaryColor:          "#0B2F74",
		SecondaryColor:        "#1C4EA1",
		AccentColor:           "#F4B227",
		BackgroundColor:       "#F8F6EF",
		SurfaceColor:          "#FFFCF7",
		MutedTextColor:        "#6B7E9D",
		LogoURL:               "/assets/branding/bnc-logo.png",
		DefaultCity:           "Kozhikode",
		DefaultRegion:         "Kerala",
		SupportPhone:          "+91 98765 00000",
		SupportWhatsApp:       "+91 98765 00000",
		SupportEmail:          "support@bncnearu.com",
		CurrencyCode:          "INR",
		EnableDeals:           true,
		EnableDoctorBookings:  true,
		UpdateIntervalSeconds: 30,
	}
}

func (s *Store) EnsureAppSettingsSchema(ctx context.Context) error {
	settings := DefaultAppSettings()
	if _, err := s.db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS app_settings (
			id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
			site_name TEXT NOT NULL DEFAULT 'BNC Nearu',
			tagline TEXT NOT NULL DEFAULT 'Local shops, services, offers, and bookings in one place.',
			primary_color TEXT NOT NULL DEFAULT '#0B2F74',
			secondary_color TEXT NOT NULL DEFAULT '#1C4EA1',
			accent_color TEXT NOT NULL DEFAULT '#F4B227',
			background_color TEXT NOT NULL DEFAULT '#F8F6EF',
			surface_color TEXT NOT NULL DEFAULT '#FFFCF7',
			muted_text_color TEXT NOT NULL DEFAULT '#6B7E9D',
			logo_url TEXT NOT NULL DEFAULT '/assets/branding/bnc-logo.png',
			default_city TEXT NOT NULL DEFAULT 'Kozhikode',
			default_region TEXT NOT NULL DEFAULT 'Kerala',
			support_phone TEXT NOT NULL DEFAULT '+91 98765 00000',
			support_whatsapp TEXT NOT NULL DEFAULT '+91 98765 00000',
			support_email TEXT NOT NULL DEFAULT 'support@bncnearu.com',
			currency_code TEXT NOT NULL DEFAULT 'INR',
			enable_deals BOOLEAN NOT NULL DEFAULT TRUE,
			enable_doctor_bookings BOOLEAN NOT NULL DEFAULT TRUE,
			update_interval_seconds INTEGER NOT NULL DEFAULT 30,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`); err != nil {
		return err
	}

	_, err := s.db.Exec(ctx, `
		INSERT INTO app_settings (
			id, site_name, tagline, primary_color, secondary_color, accent_color,
			background_color, surface_color, muted_text_color, logo_url, default_city,
			default_region, support_phone, support_whatsapp, support_email, currency_code,
			enable_deals, enable_doctor_bookings, update_interval_seconds
		)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		ON CONFLICT (id) DO NOTHING
	`, settings.SiteName, settings.Tagline, settings.PrimaryColor, settings.SecondaryColor, settings.AccentColor,
		settings.BackgroundColor, settings.SurfaceColor, settings.MutedTextColor, settings.LogoURL, settings.DefaultCity,
		settings.DefaultRegion, settings.SupportPhone, settings.SupportWhatsApp, settings.SupportEmail, settings.CurrencyCode,
		settings.EnableDeals, settings.EnableDoctorBookings, settings.UpdateIntervalSeconds)
	return err
}

func (s *Store) GetAppSettings(ctx context.Context) (AppSettings, error) {
	var settings AppSettings
	err := s.db.QueryRow(ctx, `
		SELECT site_name, tagline, primary_color, secondary_color, accent_color,
			background_color, surface_color, muted_text_color, logo_url, default_city,
			default_region, support_phone, support_whatsapp, support_email, currency_code,
			enable_deals, enable_doctor_bookings, update_interval_seconds
		FROM app_settings WHERE id = 1
	`).Scan(
		&settings.SiteName, &settings.Tagline, &settings.PrimaryColor, &settings.SecondaryColor, &settings.AccentColor,
		&settings.BackgroundColor, &settings.SurfaceColor, &settings.MutedTextColor, &settings.LogoURL, &settings.DefaultCity,
		&settings.DefaultRegion, &settings.SupportPhone, &settings.SupportWhatsApp, &settings.SupportEmail, &settings.CurrencyCode,
		&settings.EnableDeals, &settings.EnableDoctorBookings, &settings.UpdateIntervalSeconds,
	)
	return settings, err
}

func (s *Store) UpdateAppSettings(ctx context.Context, input AppSettings) (AppSettings, error) {
	defaults := DefaultAppSettings()
	if input.SiteName == "" {
		input.SiteName = defaults.SiteName
	}
	if input.Tagline == "" {
		input.Tagline = defaults.Tagline
	}
	if input.PrimaryColor == "" {
		input.PrimaryColor = defaults.PrimaryColor
	}
	if input.SecondaryColor == "" {
		input.SecondaryColor = defaults.SecondaryColor
	}
	if input.AccentColor == "" {
		input.AccentColor = defaults.AccentColor
	}
	if input.BackgroundColor == "" {
		input.BackgroundColor = defaults.BackgroundColor
	}
	if input.SurfaceColor == "" {
		input.SurfaceColor = defaults.SurfaceColor
	}
	if input.MutedTextColor == "" {
		input.MutedTextColor = defaults.MutedTextColor
	}
	if input.LogoURL == "" {
		input.LogoURL = defaults.LogoURL
	}
	if input.DefaultCity == "" {
		input.DefaultCity = defaults.DefaultCity
	}
	if input.DefaultRegion == "" {
		input.DefaultRegion = defaults.DefaultRegion
	}
	if input.CurrencyCode == "" {
		input.CurrencyCode = defaults.CurrencyCode
	}
	if input.UpdateIntervalSeconds < 5 {
		input.UpdateIntervalSeconds = 5
	}
	if input.UpdateIntervalSeconds > 3600 {
		input.UpdateIntervalSeconds = 3600
	}

	_, err := s.db.Exec(ctx, `
		UPDATE app_settings
		SET site_name = $1, tagline = $2, primary_color = $3, secondary_color = $4,
			accent_color = $5, background_color = $6, surface_color = $7,
			muted_text_color = $8, logo_url = $9, default_city = $10,
			default_region = $11, support_phone = $12, support_whatsapp = $13,
			support_email = $14, currency_code = $15, enable_deals = $16,
			enable_doctor_bookings = $17, update_interval_seconds = $18, updated_at = now()
		WHERE id = 1
	`, input.SiteName, input.Tagline, input.PrimaryColor, input.SecondaryColor, input.AccentColor,
		input.BackgroundColor, input.SurfaceColor, input.MutedTextColor, input.LogoURL, input.DefaultCity,
		input.DefaultRegion, input.SupportPhone, input.SupportWhatsApp, input.SupportEmail, input.CurrencyCode,
		input.EnableDeals, input.EnableDoctorBookings, input.UpdateIntervalSeconds)
	if err != nil {
		return AppSettings{}, err
	}
	return s.GetAppSettings(ctx)
}
