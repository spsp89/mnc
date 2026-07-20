package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	db *pgxpool.Pool
}

func Open(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &Store{db: pool}, nil
}

func (s *Store) Close() {
	s.db.Close()
}

type defaultCategory struct {
	Name        string
	Slug        string
	Icon        string
	AccentColor string
	SortOrder   int
}

var defaultCategories = []defaultCategory{
	{Name: "Grocery", Slug: "grocery", Icon: "shopping_cart", AccentColor: "#F2A715", SortOrder: 10},
	{Name: "Restaurant", Slug: "restaurant", Icon: "restaurant", AccentColor: "#0B2F74", SortOrder: 20},
	{Name: "Restaurants", Slug: "restaurants", Icon: "utensils-crossed", AccentColor: "#FFB01E", SortOrder: 21},
	{Name: "Clinic", Slug: "clinic", Icon: "local_hospital", AccentColor: "#0B2F74", SortOrder: 25},
	{Name: "Pharmacy", Slug: "pharmacy", Icon: "grid_view", AccentColor: "#24A875", SortOrder: 30},
	{Name: "Bakery & Sweets", Slug: "bakery-sweets", Icon: "cake", AccentColor: "#F2A715", SortOrder: 35},
	{Name: "Bakery", Slug: "bakery", Icon: "cake", AccentColor: "#F2A715", SortOrder: 36},
	{Name: "Beauty", Slug: "beauty", Icon: "brush", AccentColor: "#D34C90", SortOrder: 40},
	{Name: "Tailors", Slug: "tailors", Icon: "scissors", AccentColor: "#0B2F74", SortOrder: 45},
	{Name: "Mobile", Slug: "mobile", Icon: "phone_android", AccentColor: "#254FB3", SortOrder: 46},
	{Name: "Electronics", Slug: "electronics", Icon: "monitor-smartphone", AccentColor: "#6A66FF", SortOrder: 47},
	{Name: "Home Services", Slug: "home-services", Icon: "home_repair_service", AccentColor: "#0B2F74", SortOrder: 50},
	{Name: "Gifts & Stationery", Slug: "gifts-stationery", Icon: "redeem", AccentColor: "#F2A715", SortOrder: 60},
	{Name: "Doctor Booking", Slug: "doctor-booking", Icon: "stethoscope", AccentColor: "#1E9FB8", SortOrder: 70},
	{Name: "More", Slug: "more", Icon: "layout_grid", AccentColor: "#7183A6", SortOrder: 80},
}

func (s *Store) EnsureDefaultCategories(ctx context.Context) error {
	for _, category := range defaultCategories {
		_, err := s.db.Exec(ctx, `
			INSERT INTO categories (name, slug, icon, accent_color, sort_order, is_active)
			VALUES ($1, $2, $3, $4, $5, TRUE)
			ON CONFLICT (slug) DO UPDATE
			SET name = excluded.name,
				icon = excluded.icon,
				accent_color = excluded.accent_color,
				sort_order = excluded.sort_order,
				is_active = TRUE,
				updated_at = now()
		`, category.Name, category.Slug, category.Icon, category.AccentColor, category.SortOrder)
		if err != nil {
			return err
		}
	}
	return nil
}

type Category struct {
	ID          string `json:"id"`
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	AccentColor string `json:"accentColor"`
	IsActive    bool   `json:"isActive"`
	SortOrder   int    `json:"sortOrder"`
}

type Image struct {
	URL       string `json:"url"`
	Alt       string `json:"alt"`
	Variant   string `json:"variant"`
	IsPrimary bool   `json:"isPrimary"`
}

type Address struct {
	Area      string   `json:"area"`
	City      string   `json:"city"`
	Region    string   `json:"region"`
	Country   string   `json:"country"`
	Label     string   `json:"label"`
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
}

type Contact struct {
	Phone    *string `json:"phone"`
	WhatsApp *string `json:"whatsapp"`
	Email    *string `json:"email"`
	Website  *string `json:"website"`
}

type Flags struct {
	Featured bool `json:"featured"`
	Popular  bool `json:"popular"`
	Favorite bool `json:"favorite"`
}

type Badge struct {
	Text  string `json:"text"`
	Color string `json:"color"`
}

type Rating struct {
	Average float64 `json:"average"`
	Count   int     `json:"count"`
}

type Business struct {
	ID               string   `json:"id"`
	Slug             string   `json:"slug"`
	Name             string   `json:"name"`
	ShortDescription string   `json:"shortDescription"`
	LogoURL          *string  `json:"logoUrl"`
	ThumbnailURL     *string  `json:"thumbnailUrl"`
	Category         Category `json:"category"`
	Flags            Flags    `json:"flags"`
	Rating           Rating   `json:"rating"`
	DistanceKM       float64  `json:"distanceKm"`
	Badge            *Badge   `json:"badge"`
	Contact          Contact  `json:"contact"`
	Address          Address  `json:"address"`
	Images           []Image  `json:"images"`
	Tags             []string `json:"tags"`
	SearchText       string   `json:"searchText"`
}

type CatalogResponse struct {
	Categories []Category `json:"categories"`
	Featured   []Business `json:"featured"`
	Popular    []Business `json:"popular"`
	All        []Business `json:"all"`
	Filters    any        `json:"filters"`
	Stats      any        `json:"stats"`
}

type CatalogQuery struct {
	Query           string
	CategorySlug    string
	Featured        bool
	Popular         bool
	Sort            string
	Limit           int
	IncludeInactive bool
}

func (s *Store) GetCategories(ctx context.Context, includeInactive bool) ([]Category, error) {
	where := "WHERE is_active = TRUE"
	if includeInactive {
		where = ""
	}
	rows, err := s.db.Query(ctx, `
		SELECT id, slug, name, icon, accent_color, is_active, sort_order
		FROM categories
		`+where+`
		ORDER BY sort_order ASC, name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var item Category
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Icon, &item.AccentColor, &item.IsActive, &item.SortOrder); err != nil {
			return nil, err
		}
		categories = append(categories, item)
	}
	return categories, rows.Err()
}

func (s *Store) GetCatalog(ctx context.Context, query CatalogQuery) (CatalogResponse, error) {
	categories, err := s.GetCategories(ctx, query.IncludeInactive)
	if err != nil {
		return CatalogResponse{}, err
	}

	all, err := s.queryBusinesses(ctx, query)
	if err != nil {
		return CatalogResponse{}, err
	}

	featuredQuery := query
	featuredQuery.Featured = true
	featuredQuery.Popular = false
	featuredQuery.Limit = 8
	featured, err := s.queryBusinesses(ctx, featuredQuery)
	if err != nil {
		return CatalogResponse{}, err
	}

	popularQuery := query
	popularQuery.Featured = false
	popularQuery.Popular = true
	popularQuery.Limit = 8
	popular, err := s.queryBusinesses(ctx, popularQuery)
	if err != nil {
		return CatalogResponse{}, err
	}

	trusted := 0
	for _, business := range all {
		if business.Flags.Popular || business.Rating.Average >= 4.5 {
			trusted++
		}
	}

	return CatalogResponse{
		Categories: categories,
		Featured:   featured,
		Popular:    popular,
		All:        all,
		Filters: map[string]any{
			"query":        query.Query,
			"categorySlug": query.CategorySlug,
			"featured":     query.Featured,
			"popular":      query.Popular,
			"tags":         []string{},
			"sort":         query.Sort,
			"limit":        nullableLimit(query.Limit),
		},
		Stats: map[string]any{
			"categories": len(categories),
			"businesses": len(all),
			"trusted":    trusted,
			"happyUsers": "2k+",
		},
	}, nil
}

func nullableLimit(limit int) any {
	if limit == 0 {
		return nil
	}
	return limit
}

func (s *Store) GetBusinessBySlug(ctx context.Context, slug string) (Business, error) {
	items, err := s.queryBusinesses(ctx, CatalogQuery{Query: "", Limit: 0})
	if err != nil {
		return Business{}, err
	}
	for _, item := range items {
		if item.Slug == slug {
			return item, nil
		}
	}
	return Business{}, ErrNotFound
}

func (s *Store) queryBusinesses(ctx context.Context, q CatalogQuery) ([]Business, error) {
	args := []any{}
	conditions := []string{"b.is_active = TRUE"}
	if !q.IncludeInactive {
		conditions = append(conditions, "c.is_active = TRUE")
	}

	if q.Query != "" {
		args = append(args, "%"+strings.ToLower(q.Query)+"%")
		conditions = append(conditions, fmt.Sprintf("LOWER(b.search_text || ' ' || b.name || ' ' || b.short_description || ' ' || c.name || ' ' || b.area) LIKE $%d", len(args)))
	}
	if q.CategorySlug != "" {
		args = append(args, strings.ToLower(q.CategorySlug))
		conditions = append(conditions, fmt.Sprintf("LOWER(c.slug) = $%d", len(args)))
	}
	if q.Featured {
		conditions = append(conditions, "b.is_featured = TRUE")
	}
	if q.Popular {
		conditions = append(conditions, "b.is_popular = TRUE")
	}

	orderBy := "b.id ASC"
	switch q.Sort {
	case "rating":
		orderBy = "b.rating_average DESC, b.rating_count DESC"
	case "distance":
		orderBy = "b.distance_km ASC"
	}

	limitSQL := ""
	if q.Limit > 0 {
		args = append(args, q.Limit)
		limitSQL = fmt.Sprintf(" LIMIT $%d", len(args))
	}

	sql := `
		SELECT
			b.id, b.slug, b.name, b.short_description, b.logo_url, b.thumbnail_url,
			b.phone, b.whatsapp, b.email, b.website,
			b.area, b.city, b.region, b.country, b.address_label, b.latitude, b.longitude,
			b.rating_average::float8, b.rating_count, b.distance_km::float8,
			b.is_featured, b.is_popular, b.badge_text, b.badge_color, b.tags, b.search_text,
			c.id, c.slug, c.name, c.icon, c.accent_color, c.is_active, c.sort_order
		FROM businesses b
		INNER JOIN categories c ON c.id = b.category_id
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY ` + orderBy + limitSQL

	rows, err := s.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var businesses []Business
	for rows.Next() {
		var b Business
		var badgeText, badgeColor *string
		if err := rows.Scan(
			&b.ID, &b.Slug, &b.Name, &b.ShortDescription, &b.LogoURL, &b.ThumbnailURL,
			&b.Contact.Phone, &b.Contact.WhatsApp, &b.Contact.Email, &b.Contact.Website,
			&b.Address.Area, &b.Address.City, &b.Address.Region, &b.Address.Country, &b.Address.Label, &b.Address.Latitude, &b.Address.Longitude,
			&b.Rating.Average, &b.Rating.Count, &b.DistanceKM,
			&b.Flags.Featured, &b.Flags.Popular, &badgeText, &badgeColor, &b.Tags, &b.SearchText,
			&b.Category.ID, &b.Category.Slug, &b.Category.Name, &b.Category.Icon, &b.Category.AccentColor, &b.Category.IsActive, &b.Category.SortOrder,
		); err != nil {
			return nil, err
		}
		if badgeText != nil && badgeColor != nil {
			b.Badge = &Badge{Text: *badgeText, Color: *badgeColor}
		}
		b.Images, err = s.businessImages(ctx, b.ID, b.Name)
		if err != nil {
			return nil, err
		}
		businesses = append(businesses, b)
	}
	return businesses, rows.Err()
}

func (s *Store) businessImages(ctx context.Context, businessID, businessName string) ([]Image, error) {
	rows, err := s.db.Query(ctx, `
		SELECT url, alt, variant, is_primary
		FROM business_images
		WHERE business_id = $1
		ORDER BY is_primary DESC, sort_order ASC
	`, businessID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []Image
	for rows.Next() {
		var image Image
		if err := rows.Scan(&image.URL, &image.Alt, &image.Variant, &image.IsPrimary); err != nil {
			return nil, err
		}
		images = append(images, image)
	}
	return images, rows.Err()
}

type Clinic struct {
	ID         string   `json:"id"`
	Slug       string   `json:"slug"`
	Name       string   `json:"name"`
	ImageURL   string   `json:"imageUrl"`
	Phone      *string  `json:"phone"`
	WhatsApp   *string  `json:"whatsapp"`
	Address    Address  `json:"address"`
	DistanceKM float64  `json:"distanceKm"`
	Doctors    []Doctor `json:"doctors"`
}

type Doctor struct {
	ID         string   `json:"id"`
	Slug       string   `json:"slug"`
	Name       string   `json:"name"`
	Speciality string   `json:"speciality"`
	Experience string   `json:"experience"`
	Rating     Rating   `json:"rating"`
	NextSlot   string   `json:"nextSlot"`
	Fee        string   `json:"fee"`
	ImageURL   string   `json:"imageUrl"`
	Services   []string `json:"services"`
}

type Deal struct {
	ID          string   `json:"id"`
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Code        string   `json:"code"`
	ImageURL    string   `json:"imageUrl"`
	AccentColor string   `json:"accentColor"`
	Section     string   `json:"section"`
	IsFeatured  bool     `json:"isFeatured"`
	SortOrder   int      `json:"sortOrder"`
	Business    Business `json:"business"`
}

type DealInput struct {
	BusinessSlug string `json:"businessSlug"`
	Slug         string `json:"slug"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	Code         string `json:"code"`
	ImageURL     string `json:"imageUrl"`
	AccentColor  string `json:"accentColor"`
	Section      string `json:"section"`
	IsFeatured   bool   `json:"isFeatured"`
	SortOrder    int    `json:"sortOrder"`
}

func (s *Store) GetDeals(ctx context.Context, section string, featured bool) ([]Deal, error) {
	args := []any{}
	conditions := []string{"d.is_active = TRUE"}
	if section != "" {
		args = append(args, strings.ToLower(section))
		conditions = append(conditions, fmt.Sprintf("LOWER(d.section) = $%d", len(args)))
	}
	if featured {
		conditions = append(conditions, "d.is_featured = TRUE")
	}

	rows, err := s.db.Query(ctx, `
		SELECT d.id, d.slug, d.title, d.description, d.code, d.image_url,
			d.accent_color, d.section, d.is_featured, d.sort_order, COALESCE(b.slug, '')
		FROM deals d
		LEFT JOIN businesses b ON b.id = d.business_id
		WHERE `+strings.Join(conditions, " AND ")+`
		ORDER BY d.sort_order ASC, d.created_at DESC
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deals []Deal
	for rows.Next() {
		var deal Deal
		var businessSlug string
		if err := rows.Scan(&deal.ID, &deal.Slug, &deal.Title, &deal.Description, &deal.Code, &deal.ImageURL, &deal.AccentColor, &deal.Section, &deal.IsFeatured, &deal.SortOrder, &businessSlug); err != nil {
			return nil, err
		}
		if businessSlug != "" {
			business, err := s.GetBusinessBySlug(ctx, businessSlug)
			if err != nil && !errors.Is(err, ErrNotFound) {
				return nil, err
			}
			deal.Business = business
		}
		deals = append(deals, deal)
	}
	return deals, rows.Err()
}

func (s *Store) CreateDeal(ctx context.Context, input DealInput) (Deal, error) {
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1`, input.BusinessSlug).Scan(&businessID); errors.Is(err, pgx.ErrNoRows) {
		return Deal{}, ErrNotFound
	} else if err != nil {
		return Deal{}, err
	}

	if input.ImageURL == "" {
		input.ImageURL = "/mockup/im-gifts.jpg"
	}
	if input.AccentColor == "" {
		input.AccentColor = "#0B2F74"
	}
	if input.Section == "" {
		input.Section = "main"
	}

	var slug string
	err := s.db.QueryRow(ctx, `
		INSERT INTO deals (business_id, slug, title, description, code, image_url, accent_color, section, is_featured, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING slug
	`, businessID, input.Slug, input.Title, input.Description, input.Code, input.ImageURL, input.AccentColor, input.Section, input.IsFeatured, input.SortOrder).Scan(&slug)
	if err != nil {
		return Deal{}, err
	}
	deals, err := s.GetDeals(ctx, "", false)
	if err != nil {
		return Deal{}, err
	}
	for _, deal := range deals {
		if deal.Slug == slug {
			return deal, nil
		}
	}
	return Deal{}, ErrNotFound
}

func (s *Store) UpdateDeal(ctx context.Context, slug string, input DealInput) (Deal, error) {
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1 AND is_active = TRUE`, input.BusinessSlug).Scan(&businessID); errors.Is(err, pgx.ErrNoRows) {
		return Deal{}, ErrNotFound
	} else if err != nil {
		return Deal{}, err
	}
	if input.Slug == "" {
		input.Slug = slug
	}
	if input.ImageURL == "" {
		input.ImageURL = "/mockup/im-gifts.jpg"
	}
	if input.AccentColor == "" {
		input.AccentColor = "#0B2F74"
	}
	if input.Section == "" {
		input.Section = "main"
	}
	tag, err := s.db.Exec(ctx, `
		UPDATE deals
		SET business_id = $1, slug = $2, title = $3, description = $4, code = $5,
			image_url = $6, accent_color = $7, section = $8, is_featured = $9,
			sort_order = $10, updated_at = now()
		WHERE slug = $11 AND is_active = TRUE
	`, businessID, input.Slug, input.Title, input.Description, input.Code, input.ImageURL, input.AccentColor, input.Section, input.IsFeatured, input.SortOrder, slug)
	if err != nil {
		return Deal{}, err
	}
	if tag.RowsAffected() == 0 {
		return Deal{}, ErrNotFound
	}
	deals, err := s.GetDeals(ctx, "", false)
	if err != nil {
		return Deal{}, err
	}
	for _, deal := range deals {
		if deal.Slug == input.Slug {
			return deal, nil
		}
	}
	return Deal{}, ErrNotFound
}

func (s *Store) DeleteDeal(ctx context.Context, slug string) error {
	tag, err := s.db.Exec(ctx, `UPDATE deals SET is_active = FALSE, updated_at = now() WHERE slug = $1`, slug)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetClinics(ctx context.Context, query string) ([]Clinic, error) {
	args := []any{}
	where := "is_active = TRUE"
	if query != "" {
		args = append(args, "%"+strings.ToLower(query)+"%")
		where += " AND LOWER(name || ' ' || address_label || ' ' || area) LIKE $1"
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, slug, name, image_url, phone, whatsapp, address_label, area, city, distance_km::float8
		FROM clinics
		WHERE `+where+`
		ORDER BY distance_km ASC, name ASC
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clinics []Clinic
	for rows.Next() {
		var item Clinic
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.ImageURL, &item.Phone, &item.WhatsApp, &item.Address.Label, &item.Address.Area, &item.Address.City, &item.DistanceKM); err != nil {
			return nil, err
		}
		item.Address.Region = "Kerala"
		item.Address.Country = "India"
		item.Doctors, err = s.doctorsForClinic(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		clinics = append(clinics, item)
	}
	return clinics, rows.Err()
}

func (s *Store) GetClinicBySlug(ctx context.Context, slug string) (Clinic, error) {
	clinics, err := s.GetClinics(ctx, "")
	if err != nil {
		return Clinic{}, err
	}
	for _, clinic := range clinics {
		if clinic.Slug == slug {
			return clinic, nil
		}
	}
	return Clinic{}, ErrNotFound
}

type ClinicInput struct {
	Slug         string   `json:"slug"`
	Name         string   `json:"name"`
	ImageURL     string   `json:"imageUrl"`
	Phone        *string  `json:"phone"`
	WhatsApp     *string  `json:"whatsapp"`
	AddressLabel string   `json:"addressLabel"`
	Area         string   `json:"area"`
	City         string   `json:"city"`
	Latitude     *float64 `json:"latitude"`
	Longitude    *float64 `json:"longitude"`
	DistanceKM   float64  `json:"distanceKm"`
	IsActive     *bool    `json:"isActive"`
}

func (s *Store) CreateClinic(ctx context.Context, input ClinicInput) (Clinic, error) {
	normalizeClinicInput(&input)
	var slug string
	err := s.db.QueryRow(ctx, `
		INSERT INTO clinics (slug, name, image_url, phone, whatsapp, address_label, area, city, latitude, longitude, distance_km, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		RETURNING slug
	`, input.Slug, input.Name, input.ImageURL, input.Phone, input.WhatsApp, input.AddressLabel, input.Area, input.City, input.Latitude, input.Longitude, input.DistanceKM, boolOrDefault(input.IsActive, true)).Scan(&slug)
	if err != nil {
		return Clinic{}, err
	}
	return s.GetClinicBySlug(ctx, slug)
}

func (s *Store) UpdateClinic(ctx context.Context, slug string, input ClinicInput) (Clinic, error) {
	normalizeClinicInput(&input)
	if input.Slug == "" {
		input.Slug = slug
	}
	tag, err := s.db.Exec(ctx, `
		UPDATE clinics
		SET slug = $1, name = $2, image_url = $3, phone = $4, whatsapp = $5, address_label = $6,
			area = $7, city = $8, latitude = $9, longitude = $10, distance_km = $11, is_active = $12, updated_at = now()
		WHERE slug = $13
	`, input.Slug, input.Name, input.ImageURL, input.Phone, input.WhatsApp, input.AddressLabel, input.Area, input.City, input.Latitude, input.Longitude, input.DistanceKM, boolOrDefault(input.IsActive, true), slug)
	if err != nil {
		return Clinic{}, err
	}
	if tag.RowsAffected() == 0 {
		return Clinic{}, ErrNotFound
	}
	return s.GetClinicBySlug(ctx, input.Slug)
}

func (s *Store) DeleteClinic(ctx context.Context, slug string) error {
	tag, err := s.db.Exec(ctx, `UPDATE clinics SET is_active = FALSE, updated_at = now() WHERE slug = $1`, slug)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func normalizeClinicInput(input *ClinicInput) {
	if input.ImageURL == "" {
		input.ImageURL = "/mockup/im-pharmacy.jpg"
	}
	if input.Area == "" {
		input.Area = "Kozhikode"
	}
	if input.City == "" {
		input.City = "Kozhikode"
	}
	if input.AddressLabel == "" {
		input.AddressLabel = input.Name + ", " + input.Area + ", Kerala"
	}
	if input.DistanceKM <= 0 {
		input.DistanceKM = 1
	}
}

func boolOrDefault(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func (s *Store) doctorsForClinic(ctx context.Context, clinicID string) ([]Doctor, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, slug, name, speciality, experience, rating_average::float8, rating_count, next_slot, fee, image_url, services
		FROM doctors
		WHERE clinic_id = $1 AND is_active = TRUE
		ORDER BY rating_average DESC, name ASC
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var doctors []Doctor
	for rows.Next() {
		var item Doctor
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Speciality, &item.Experience, &item.Rating.Average, &item.Rating.Count, &item.NextSlot, &item.Fee, &item.ImageURL, &item.Services); err != nil {
			return nil, err
		}
		doctors = append(doctors, item)
	}
	return doctors, rows.Err()
}

type DoctorInput struct {
	ClinicSlug    string   `json:"clinicSlug"`
	Slug          string   `json:"slug"`
	Name          string   `json:"name"`
	Speciality    string   `json:"speciality"`
	Experience    string   `json:"experience"`
	RatingAverage float64  `json:"ratingAverage"`
	RatingCount   int      `json:"ratingCount"`
	NextSlot      string   `json:"nextSlot"`
	Fee           string   `json:"fee"`
	ImageURL      string   `json:"imageUrl"`
	Services      []string `json:"services"`
	IsActive      *bool    `json:"isActive"`
}

func (s *Store) CreateDoctor(ctx context.Context, input DoctorInput) (Doctor, error) {
	clinicID, err := s.clinicIDBySlug(ctx, input.ClinicSlug)
	if err != nil {
		return Doctor{}, err
	}
	normalizeDoctorInput(&input)
	input.Slug, err = s.uniqueDoctorSlug(ctx, slugOrName(input.Slug, input.Name))
	if err != nil {
		return Doctor{}, err
	}
	var slug string
	err = s.db.QueryRow(ctx, `
		INSERT INTO doctors (clinic_id, slug, name, speciality, experience, rating_average, rating_count, next_slot, fee, image_url, services, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		RETURNING slug
	`, clinicID, input.Slug, input.Name, input.Speciality, input.Experience, input.RatingAverage, input.RatingCount, input.NextSlot, input.Fee, input.ImageURL, input.Services, boolOrDefault(input.IsActive, true)).Scan(&slug)
	if err != nil {
		return Doctor{}, err
	}
	return s.GetDoctorBySlug(ctx, slug)
}

func (s *Store) UpdateDoctor(ctx context.Context, slug string, input DoctorInput) (Doctor, error) {
	clinicID, err := s.clinicIDBySlug(ctx, input.ClinicSlug)
	if err != nil {
		return Doctor{}, err
	}
	normalizeDoctorInput(&input)
	if input.Slug == "" {
		input.Slug = slug
	}
	tag, err := s.db.Exec(ctx, `
		UPDATE doctors
		SET clinic_id = $1, slug = $2, name = $3, speciality = $4, experience = $5,
			rating_average = $6, rating_count = $7, next_slot = $8, fee = $9,
			image_url = $10, services = $11, is_active = $12
		WHERE slug = $13
	`, clinicID, input.Slug, input.Name, input.Speciality, input.Experience, input.RatingAverage, input.RatingCount, input.NextSlot, input.Fee, input.ImageURL, input.Services, boolOrDefault(input.IsActive, true), slug)
	if err != nil {
		return Doctor{}, err
	}
	if tag.RowsAffected() == 0 {
		return Doctor{}, ErrNotFound
	}
	return s.GetDoctorBySlug(ctx, input.Slug)
}

func (s *Store) DeleteDoctor(ctx context.Context, slug string) error {
	tag, err := s.db.Exec(ctx, `UPDATE doctors SET is_active = FALSE WHERE slug = $1`, slug)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetDoctorBySlug(ctx context.Context, slug string) (Doctor, error) {
	var item Doctor
	err := s.db.QueryRow(ctx, `
		SELECT id, slug, name, speciality, experience, rating_average::float8, rating_count, next_slot, fee, image_url, services
		FROM doctors
		WHERE slug = $1 AND is_active = TRUE
	`, slug).Scan(&item.ID, &item.Slug, &item.Name, &item.Speciality, &item.Experience, &item.Rating.Average, &item.Rating.Count, &item.NextSlot, &item.Fee, &item.ImageURL, &item.Services)
	if errors.Is(err, pgx.ErrNoRows) {
		return Doctor{}, ErrNotFound
	}
	return item, err
}

func (s *Store) clinicIDBySlug(ctx context.Context, slug string) (string, error) {
	var id string
	if err := s.db.QueryRow(ctx, `SELECT id FROM clinics WHERE slug = $1 AND is_active = TRUE`, slug).Scan(&id); errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	} else if err != nil {
		return "", err
	}
	return id, nil
}

func normalizeDoctorInput(input *DoctorInput) {
	if input.Experience == "" {
		input.Experience = "1 yr exp"
	}
	if input.RatingAverage <= 0 {
		input.RatingAverage = 4.5
	}
	if input.NextSlot == "" {
		input.NextSlot = "Today"
	}
	if input.Fee == "" {
		input.Fee = "Contact clinic"
	}
	if input.ImageURL == "" {
		input.ImageURL = "/mockup/im-occ_reception.jpg"
	}
}

func (s *Store) uniqueDoctorSlug(ctx context.Context, base string) (string, error) {
	if base == "" {
		base = "doctor"
	}

	for index := 0; ; index++ {
		slug := base
		if index > 0 {
			slug = fmt.Sprintf("%s-%d", base, index+1)
		}

		var exists bool
		if err := s.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM doctors WHERE slug = $1)`, slug).Scan(&exists); err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
	}
}

func slugOrName(slug string, name string) string {
	source := strings.TrimSpace(slug)
	if source == "" {
		source = name
	}

	source = strings.ToLower(strings.TrimSpace(source))
	var builder strings.Builder
	lastDash := false
	for _, char := range source {
		if unicode.IsLetter(char) || unicode.IsDigit(char) {
			builder.WriteRune(char)
			lastDash = false
			continue
		}
		if !lastDash {
			builder.WriteByte('-')
			lastDash = true
		}
	}

	return strings.Trim(builder.String(), "-")
}

type BookingRequestInput struct {
	ClinicID      *string `json:"clinicId"`
	DoctorID      *string `json:"doctorId"`
	PatientName   string  `json:"patientName"`
	Phone         string  `json:"phone"`
	PreferredSlot string  `json:"preferredSlot"`
	Message       string  `json:"message"`
}

type BookingRequest struct {
	ID            string  `json:"id"`
	ClinicID      *string `json:"clinicId"`
	DoctorID      *string `json:"doctorId"`
	PatientName   string  `json:"patientName"`
	Phone         string  `json:"phone"`
	PreferredSlot string  `json:"preferredSlot"`
	Message       string  `json:"message"`
	Status        string  `json:"status"`
}

func (s *Store) CreateBookingRequest(ctx context.Context, input BookingRequestInput) (BookingRequest, error) {
	var created BookingRequest
	err := s.db.QueryRow(ctx, `
		INSERT INTO booking_requests (clinic_id, doctor_id, patient_name, phone, preferred_slot, message)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, clinic_id, doctor_id, patient_name, phone, COALESCE(preferred_slot, ''), COALESCE(message, ''), status
	`, input.ClinicID, input.DoctorID, strings.TrimSpace(input.PatientName), strings.TrimSpace(input.Phone), input.PreferredSlot, input.Message).
		Scan(&created.ID, &created.ClinicID, &created.DoctorID, &created.PatientName, &created.Phone, &created.PreferredSlot, &created.Message, &created.Status)
	return created, err
}

type CategoryInput struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Icon        string `json:"icon"`
	AccentColor string `json:"accentColor"`
	SortOrder   int    `json:"sortOrder"`
	IsActive    *bool  `json:"isActive"`
}

func (s *Store) CreateCategory(ctx context.Context, input CategoryInput) (Category, error) {
	if input.Icon == "" {
		input.Icon = "category"
	}
	if input.AccentColor == "" {
		input.AccentColor = "#0B2F74"
	}
	var category Category
	err := s.db.QueryRow(ctx, `
		INSERT INTO categories (name, slug, icon, accent_color, sort_order)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, slug, name, icon, accent_color, is_active, sort_order
	`, input.Name, input.Slug, input.Icon, input.AccentColor, input.SortOrder).
		Scan(&category.ID, &category.Slug, &category.Name, &category.Icon, &category.AccentColor, &category.IsActive, &category.SortOrder)
	return category, err
}

func (s *Store) UpdateCategory(ctx context.Context, slug string, input CategoryInput) (Category, error) {
	if input.Icon == "" {
		input.Icon = "category"
	}
	if input.AccentColor == "" {
		input.AccentColor = "#0B2F74"
	}
	if input.Slug == "" {
		input.Slug = slug
	}
	active := true
	if input.IsActive != nil {
		active = *input.IsActive
	}
	var category Category
	err := s.db.QueryRow(ctx, `
		UPDATE categories
		SET name = $1, slug = $2, icon = $3, accent_color = $4, sort_order = $5, is_active = $6, updated_at = now()
		WHERE slug = $7
		RETURNING id, slug, name, icon, accent_color, is_active, sort_order
	`, input.Name, input.Slug, input.Icon, input.AccentColor, input.SortOrder, active, slug).
		Scan(&category.ID, &category.Slug, &category.Name, &category.Icon, &category.AccentColor, &category.IsActive, &category.SortOrder)
	if errors.Is(err, pgx.ErrNoRows) {
		return Category{}, ErrNotFound
	}
	return category, err
}

func (s *Store) DeleteCategory(ctx context.Context, slug string) error {
	tag, err := s.db.Exec(ctx, `UPDATE categories SET is_active = FALSE, updated_at = now() WHERE slug = $1`, slug)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

type BusinessInput struct {
	CategorySlug     string   `json:"categorySlug"`
	Slug             string   `json:"slug"`
	Name             string   `json:"name"`
	ShortDescription string   `json:"shortDescription"`
	ThumbnailURL     *string  `json:"thumbnailUrl"`
	LogoURL          *string  `json:"logoUrl"`
	Phone            *string  `json:"phone"`
	WhatsApp         *string  `json:"whatsapp"`
	Email            *string  `json:"email"`
	Website          *string  `json:"website"`
	Area             string   `json:"area"`
	AddressLabel     string   `json:"addressLabel"`
	Tags             []string `json:"tags"`
	IsFeatured       bool     `json:"isFeatured"`
	IsPopular        bool     `json:"isPopular"`
	BadgeText        *string  `json:"badgeText"`
	BadgeColor       *string  `json:"badgeColor"`
}

func (s *Store) CreateBusiness(ctx context.Context, input BusinessInput) (Business, error) {
	var categoryID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM categories WHERE slug = $1`, input.CategorySlug).Scan(&categoryID); errors.Is(err, pgx.ErrNoRows) {
		return Business{}, ErrNotFound
	} else if err != nil {
		return Business{}, err
	}

	if input.ShortDescription == "" {
		input.ShortDescription = "Local business listed on BNC"
	}
	if input.Area == "" {
		input.Area = "Kozhikode"
	}
	if input.AddressLabel == "" {
		input.AddressLabel = input.Area + ", Kozhikode, Kerala"
	}
	searchText := strings.ToLower(strings.Join([]string{input.Name, input.ShortDescription, input.Area, strings.Join(input.Tags, " ")}, " "))

	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO businesses (
			category_id, slug, name, short_description, logo_url, thumbnail_url, phone, whatsapp, email, website,
			area, address_label, is_featured, is_popular, badge_text, badge_color, tags, search_text
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
		RETURNING id
	`, categoryID, input.Slug, input.Name, input.ShortDescription, input.LogoURL, input.ThumbnailURL, input.Phone, input.WhatsApp, input.Email, input.Website, input.Area, input.AddressLabel, input.IsFeatured, input.IsPopular, input.BadgeText, input.BadgeColor, input.Tags, searchText).Scan(&id)
	if err != nil {
		return Business{}, err
	}
	return s.GetBusinessBySlug(ctx, input.Slug)
}

func (s *Store) UpdateBusiness(ctx context.Context, slug string, input BusinessInput) (Business, error) {
	var categoryID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM categories WHERE slug = $1`, input.CategorySlug).Scan(&categoryID); errors.Is(err, pgx.ErrNoRows) {
		return Business{}, ErrNotFound
	} else if err != nil {
		return Business{}, err
	}
	if input.Slug == "" {
		input.Slug = slug
	}
	if input.ShortDescription == "" {
		input.ShortDescription = "Local business listed on BNC"
	}
	if input.Area == "" {
		input.Area = "Kozhikode"
	}
	if input.AddressLabel == "" {
		input.AddressLabel = input.Area + ", Kozhikode, Kerala"
	}
	searchText := strings.ToLower(strings.Join([]string{input.Name, input.ShortDescription, input.Area, strings.Join(input.Tags, " ")}, " "))
	tag, err := s.db.Exec(ctx, `
		UPDATE businesses
		SET category_id = $1, slug = $2, name = $3, short_description = $4, logo_url = $5, thumbnail_url = $6,
			phone = $7, whatsapp = $8, email = $9, website = $10, area = $11, address_label = $12,
			is_featured = $13, is_popular = $14, badge_text = $15, badge_color = $16, tags = $17,
			search_text = $18, updated_at = now()
		WHERE slug = $19 AND is_active = TRUE
	`, categoryID, input.Slug, input.Name, input.ShortDescription, input.LogoURL, input.ThumbnailURL, input.Phone, input.WhatsApp, input.Email, input.Website, input.Area, input.AddressLabel, input.IsFeatured, input.IsPopular, input.BadgeText, input.BadgeColor, input.Tags, searchText, slug)
	if err != nil {
		return Business{}, err
	}
	if tag.RowsAffected() == 0 {
		return Business{}, ErrNotFound
	}
	return s.GetBusinessBySlug(ctx, input.Slug)
}

func (s *Store) DeleteBusiness(ctx context.Context, slug string) error {
	tag, err := s.db.Exec(ctx, `UPDATE businesses SET is_active = FALSE, updated_at = now() WHERE slug = $1`, slug)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
