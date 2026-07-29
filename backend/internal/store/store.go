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
	IsActive    bool
	SortOrder   int
}

var defaultCategories = []defaultCategory{
	{Name: "Grocery", Slug: "grocery", Icon: "shopping-cart", AccentColor: "#FF5A4C", IsActive: true, SortOrder: 1},
	{Name: "Restaurants", Slug: "restaurants", Icon: "utensils-crossed", AccentColor: "#FFB01E", IsActive: true, SortOrder: 2},
	{Name: "Bakery & Sweets", Slug: "bakery-sweets", Icon: "utensils-crossed", AccentColor: "#D94842", IsActive: false, SortOrder: 3},
	{Name: "Tailors", Slug: "tailors", Icon: "scissors", AccentColor: "#0B285E", IsActive: true, SortOrder: 4},
	{Name: "Beauty", Slug: "beauty", Icon: "sparkles", AccentColor: "#FF7186", IsActive: true, SortOrder: 5},
	{Name: "Electronics", Slug: "electronics", Icon: "monitor-smartphone", AccentColor: "#6A66FF", IsActive: true, SortOrder: 6},
	{Name: "Home Services", Slug: "home-services", Icon: "house-plus", AccentColor: "#4AB64B", IsActive: true, SortOrder: 7},
	{Name: "Pharmacy", Slug: "pharmacy", Icon: "layout-grid", AccentColor: "#1F9D7A", IsActive: false, SortOrder: 8},
	{Name: "Gifts & Stationery", Slug: "gifts-stationery", Icon: "layout-grid", AccentColor: "#8A5BFF", IsActive: false, SortOrder: 9},
	{Name: "More", Slug: "more", Icon: "layout-grid", AccentColor: "#7183A6", IsActive: false, SortOrder: 10},
}

var retiredCategorySlugs = []string{"restaurant", "clinic", "bakery", "mobile", "doctor-booking"}

func (s *Store) EnsureDefaultCategories(ctx context.Context) error {
	for _, category := range defaultCategories {
		_, err := s.db.Exec(ctx, `
			INSERT INTO categories (name, slug, icon, accent_color, sort_order, is_active)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (slug) DO UPDATE
			SET name = excluded.name,
				icon = excluded.icon,
				accent_color = excluded.accent_color,
				sort_order = excluded.sort_order,
				is_active = $6,
				updated_at = now()
		`, category.Name, category.Slug, category.Icon, category.AccentColor, category.SortOrder, category.IsActive)
		if err != nil {
			return err
		}
	}
	for _, slug := range retiredCategorySlugs {
		if _, err := s.db.Exec(ctx, `UPDATE categories SET is_active = FALSE, updated_at = now() WHERE slug = $1`, slug); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) EnsureProductSchema(ctx context.Context) error {
	_, err := s.db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS products (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
			business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
			category_slug TEXT NOT NULL,
			subcategory_slug TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			short_description TEXT NOT NULL DEFAULT '',
			image_url TEXT NOT NULL,
			gallery_urls TEXT[] NOT NULL DEFAULT '{}',
			unit TEXT NOT NULL DEFAULT '1 kg',
			price NUMERIC(8,2) NOT NULL DEFAULT 0,
			old_price NUMERIC(8,2) NOT NULL DEFAULT 0,
			discount_text TEXT NOT NULL DEFAULT '',
			brand TEXT NOT NULL DEFAULT 'Local shop',
			product_type TEXT NOT NULL DEFAULT '',
			organic TEXT NOT NULL DEFAULT 'No',
			form_factor TEXT NOT NULL DEFAULT 'Whole',
			shelf_life TEXT NOT NULL DEFAULT '7 Days',
			is_perishable BOOLEAN NOT NULL DEFAULT TRUE,
			food_type TEXT NOT NULL DEFAULT 'Fresh',
			origin TEXT NOT NULL DEFAULT 'India',
			packaging TEXT NOT NULL DEFAULT '',
			tags TEXT[] NOT NULL DEFAULT '{}',
			unit_options TEXT[] NOT NULL DEFAULT '{}',
			size_options TEXT[] NOT NULL DEFAULT '{}',
			stock_status TEXT NOT NULL DEFAULT 'in_stock',
			delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
			delivery_areas TEXT[] NOT NULL DEFAULT '{}',
			delivery_fee TEXT NOT NULL DEFAULT '',
			delivery_eta TEXT NOT NULL DEFAULT '',
			delivery_contact TEXT NOT NULL DEFAULT '',
			order_instructions TEXT NOT NULL DEFAULT '',
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_options TEXT[] NOT NULL DEFAULT '{}';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS size_options TEXT[] NOT NULL DEFAULT '{}';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT NOT NULL DEFAULT 'in_stock';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE;
		ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_areas TEXT[] NOT NULL DEFAULT '{}';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee TEXT NOT NULL DEFAULT '';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_eta TEXT NOT NULL DEFAULT '';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_contact TEXT NOT NULL DEFAULT '';
		ALTER TABLE products ADD COLUMN IF NOT EXISTS order_instructions TEXT NOT NULL DEFAULT '';
		CREATE INDEX IF NOT EXISTS idx_products_lookup ON products(is_active, category_slug, subcategory_slug, business_id);
	`)
	return err
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
	normalizeDealInput(&input)
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1`, input.BusinessSlug).Scan(&businessID); errors.Is(err, pgx.ErrNoRows) {
		return Deal{}, ErrNotFound
	} else if err != nil {
		return Deal{}, err
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
	normalizeDealInput(&input)
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1 AND is_active = TRUE`, input.BusinessSlug).Scan(&businessID); errors.Is(err, pgx.ErrNoRows) {
		return Deal{}, ErrNotFound
	} else if err != nil {
		return Deal{}, err
	}
	if input.Slug == "" {
		input.Slug = slug
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

func normalizeDealInput(input *DealInput) {
	input.BusinessSlug = strings.TrimSpace(input.BusinessSlug)
	input.Title = strings.TrimSpace(input.Title)
	input.Slug = slugOrName(input.Slug, input.Title)
	input.Code = strings.TrimSpace(input.Code)
	if input.Code == "" {
		input.Code = "OFFER"
	}
	if input.Description == "" {
		input.Description = "Special offer from a BNC merchant shop."
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
}

type Product struct {
	ID                string   `json:"id"`
	BusinessSlug      string   `json:"businessSlug"`
	CategorySlug      string   `json:"categorySlug"`
	SubcategorySlug   string   `json:"subcategorySlug"`
	Slug              string   `json:"slug"`
	Name              string   `json:"name"`
	ShortDescription  string   `json:"shortDescription"`
	ImageURL          string   `json:"imageUrl"`
	GalleryURLs       []string `json:"galleryUrls"`
	Unit              string   `json:"unit"`
	Price             float64  `json:"price"`
	OldPrice          float64  `json:"oldPrice"`
	DiscountText      string   `json:"discountText"`
	Brand             string   `json:"brand"`
	ProductType       string   `json:"productType"`
	Organic           string   `json:"organic"`
	FormFactor        string   `json:"formFactor"`
	ShelfLife         string   `json:"shelfLife"`
	IsPerishable      bool     `json:"isPerishable"`
	FoodType          string   `json:"foodType"`
	Origin            string   `json:"origin"`
	Packaging         string   `json:"packaging"`
	Tags              []string `json:"tags"`
	UnitOptions       []string `json:"unitOptions"`
	SizeOptions       []string `json:"sizeOptions"`
	StockStatus       string   `json:"stockStatus"`
	IsSoldOut         bool     `json:"isSoldOut"`
	DeliveryEnabled   bool     `json:"deliveryEnabled"`
	DeliveryAreas     []string `json:"deliveryAreas"`
	DeliveryFee       string   `json:"deliveryFee"`
	DeliveryEta       string   `json:"deliveryEta"`
	DeliveryContact   string   `json:"deliveryContact"`
	OrderInstructions string   `json:"orderInstructions"`
	IsActive          bool     `json:"isActive"`
	SortOrder         int      `json:"sortOrder"`
	Business          Business `json:"business"`
}

type ProductQuery struct {
	BusinessSlug    string
	CategorySlug    string
	SubcategorySlug string
	Query           string
	IncludeInactive bool
}

type ProductInput struct {
	BusinessSlug      string   `json:"businessSlug"`
	CategorySlug      string   `json:"categorySlug"`
	SubcategorySlug   string   `json:"subcategorySlug"`
	Slug              string   `json:"slug"`
	Name              string   `json:"name"`
	ShortDescription  string   `json:"shortDescription"`
	ImageURL          string   `json:"imageUrl"`
	GalleryURLs       []string `json:"galleryUrls"`
	Unit              string   `json:"unit"`
	Price             float64  `json:"price"`
	OldPrice          float64  `json:"oldPrice"`
	DiscountText      string   `json:"discountText"`
	Brand             string   `json:"brand"`
	ProductType       string   `json:"productType"`
	Organic           string   `json:"organic"`
	FormFactor        string   `json:"formFactor"`
	ShelfLife         string   `json:"shelfLife"`
	IsPerishable      bool     `json:"isPerishable"`
	FoodType          string   `json:"foodType"`
	Origin            string   `json:"origin"`
	Packaging         string   `json:"packaging"`
	Tags              []string `json:"tags"`
	UnitOptions       []string `json:"unitOptions"`
	SizeOptions       []string `json:"sizeOptions"`
	StockStatus       string   `json:"stockStatus"`
	DeliveryEnabled   bool     `json:"deliveryEnabled"`
	DeliveryAreas     []string `json:"deliveryAreas"`
	DeliveryFee       string   `json:"deliveryFee"`
	DeliveryEta       string   `json:"deliveryEta"`
	DeliveryContact   string   `json:"deliveryContact"`
	OrderInstructions string   `json:"orderInstructions"`
	IsActive          bool     `json:"isActive"`
	SortOrder         int      `json:"sortOrder"`
}

func (s *Store) GetProducts(ctx context.Context, query ProductQuery) ([]Product, error) {
	args := []any{}
	conditions := []string{}
	if !query.IncludeInactive {
		conditions = append(conditions, "p.is_active = TRUE")
	}
	if query.BusinessSlug != "" {
		args = append(args, strings.ToLower(query.BusinessSlug))
		conditions = append(conditions, fmt.Sprintf("LOWER(b.slug) = $%d", len(args)))
	}
	if query.CategorySlug != "" {
		args = append(args, strings.ToLower(query.CategorySlug))
		conditions = append(conditions, fmt.Sprintf("LOWER(p.category_slug) = $%d", len(args)))
	}
	if query.SubcategorySlug != "" {
		args = append(args, strings.ToLower(query.SubcategorySlug))
		conditions = append(conditions, fmt.Sprintf("LOWER(p.subcategory_slug) = $%d", len(args)))
	}
	if query.Query != "" {
		args = append(args, "%"+strings.ToLower(query.Query)+"%")
		conditions = append(conditions, fmt.Sprintf("LOWER(p.name || ' ' || p.short_description || ' ' || array_to_string(p.tags, ' ')) LIKE $%d", len(args)))
	}
	where := "TRUE"
	if len(conditions) > 0 {
		where = strings.Join(conditions, " AND ")
	}

	rows, err := s.db.Query(ctx, `
		SELECT p.id, b.slug, p.category_slug, p.subcategory_slug, p.slug, p.name,
			p.short_description, p.image_url, p.gallery_urls, p.unit,
			p.price::float8, p.old_price::float8, p.discount_text, p.brand,
			p.product_type, p.organic, p.form_factor, p.shelf_life,
			p.is_perishable, p.food_type, p.origin, p.packaging, p.tags,
			p.unit_options, p.size_options, p.stock_status, p.delivery_enabled,
			p.delivery_areas, p.delivery_fee, p.delivery_eta, p.delivery_contact,
			p.order_instructions,
			p.is_active, p.sort_order
		FROM products p
		JOIN businesses b ON b.id = p.business_id
		WHERE `+where+`
		ORDER BY p.sort_order ASC, p.created_at DESC
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var product Product
		if err := rows.Scan(
			&product.ID, &product.BusinessSlug, &product.CategorySlug, &product.SubcategorySlug,
			&product.Slug, &product.Name, &product.ShortDescription, &product.ImageURL,
			&product.GalleryURLs, &product.Unit, &product.Price, &product.OldPrice,
			&product.DiscountText, &product.Brand, &product.ProductType, &product.Organic,
			&product.FormFactor, &product.ShelfLife, &product.IsPerishable, &product.FoodType,
			&product.Origin, &product.Packaging, &product.Tags, &product.UnitOptions,
			&product.SizeOptions, &product.StockStatus, &product.DeliveryEnabled,
			&product.DeliveryAreas, &product.DeliveryFee, &product.DeliveryEta,
			&product.DeliveryContact, &product.OrderInstructions, &product.IsActive,
			&product.SortOrder,
		); err != nil {
			return nil, err
		}
		product.IsSoldOut = product.StockStatus == "sold_out"
		business, err := s.GetBusinessBySlug(ctx, product.BusinessSlug)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
		product.Business = business
		products = append(products, product)
	}
	return products, rows.Err()
}

func (s *Store) CreateProduct(ctx context.Context, input ProductInput) (Product, error) {
	normalizeProductInput(&input)
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1 AND is_active = TRUE`, input.BusinessSlug).Scan(&businessID); errors.Is(err, pgx.ErrNoRows) {
		return Product{}, ErrNotFound
	} else if err != nil {
		return Product{}, err
	}
	if input.Slug == "" {
		input.Slug = slugOrName("", input.Name)
	}
	var slug string
	err := s.db.QueryRow(ctx, `
		INSERT INTO products (
			business_id, category_slug, subcategory_slug, slug, name, short_description,
			image_url, gallery_urls, unit, price, old_price, discount_text, brand,
			product_type, organic, form_factor, shelf_life, is_perishable, food_type,
			origin, packaging, tags, unit_options, size_options, stock_status,
			delivery_enabled, delivery_areas, delivery_fee, delivery_eta,
			delivery_contact, order_instructions, is_active, sort_order
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)
		RETURNING slug
	`, businessID, input.CategorySlug, input.SubcategorySlug, input.Slug, input.Name, input.ShortDescription,
		input.ImageURL, input.GalleryURLs, input.Unit, input.Price, input.OldPrice, input.DiscountText, input.Brand,
		input.ProductType, input.Organic, input.FormFactor, input.ShelfLife, input.IsPerishable, input.FoodType,
		input.Origin, input.Packaging, input.Tags, input.UnitOptions, input.SizeOptions, input.StockStatus,
		input.DeliveryEnabled, input.DeliveryAreas, input.DeliveryFee, input.DeliveryEta, input.DeliveryContact,
		input.OrderInstructions, input.IsActive, input.SortOrder).Scan(&slug)
	if err != nil {
		return Product{}, err
	}
	return s.GetProductBySlug(ctx, slug)
}

func (s *Store) UpdateProduct(ctx context.Context, slug string, input ProductInput) (Product, error) {
	normalizeProductInput(&input)
	if input.Slug == "" {
		input.Slug = slug
	}
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1 AND is_active = TRUE`, input.BusinessSlug).Scan(&businessID); errors.Is(err, pgx.ErrNoRows) {
		return Product{}, ErrNotFound
	} else if err != nil {
		return Product{}, err
	}
	tag, err := s.db.Exec(ctx, `
		UPDATE products
		SET business_id = $1, category_slug = $2, subcategory_slug = $3, slug = $4,
			name = $5, short_description = $6, image_url = $7, gallery_urls = $8,
			unit = $9, price = $10, old_price = $11, discount_text = $12,
			brand = $13, product_type = $14, organic = $15, form_factor = $16,
			shelf_life = $17, is_perishable = $18, food_type = $19, origin = $20,
			packaging = $21, tags = $22, unit_options = $23, size_options = $24,
			stock_status = $25, delivery_enabled = $26, delivery_areas = $27,
			delivery_fee = $28, delivery_eta = $29, delivery_contact = $30,
			order_instructions = $31, is_active = $32, sort_order = $33,
			updated_at = now()
		WHERE slug = $34
	`, businessID, input.CategorySlug, input.SubcategorySlug, input.Slug, input.Name, input.ShortDescription,
		input.ImageURL, input.GalleryURLs, input.Unit, input.Price, input.OldPrice, input.DiscountText, input.Brand,
		input.ProductType, input.Organic, input.FormFactor, input.ShelfLife, input.IsPerishable, input.FoodType,
		input.Origin, input.Packaging, input.Tags, input.UnitOptions, input.SizeOptions, input.StockStatus,
		input.DeliveryEnabled, input.DeliveryAreas, input.DeliveryFee, input.DeliveryEta, input.DeliveryContact,
		input.OrderInstructions, input.IsActive, input.SortOrder, slug)
	if err != nil {
		return Product{}, err
	}
	if tag.RowsAffected() == 0 {
		return Product{}, ErrNotFound
	}
	return s.GetProductBySlug(ctx, input.Slug)
}

func (s *Store) GetProductBySlug(ctx context.Context, slug string) (Product, error) {
	products, err := s.GetProducts(ctx, ProductQuery{IncludeInactive: true})
	if err != nil {
		return Product{}, err
	}
	for _, product := range products {
		if product.Slug == slug {
			return product, nil
		}
	}
	return Product{}, ErrNotFound
}

func (s *Store) DeleteProduct(ctx context.Context, slug string) error {
	tag, err := s.db.Exec(ctx, `UPDATE products SET is_active = FALSE, updated_at = now() WHERE slug = $1`, slug)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func normalizeProductInput(input *ProductInput) {
	input.BusinessSlug = strings.TrimSpace(input.BusinessSlug)
	input.CategorySlug = strings.TrimSpace(input.CategorySlug)
	input.SubcategorySlug = strings.TrimSpace(input.SubcategorySlug)
	input.Slug = slugOrName(input.Slug, input.Name)
	input.Name = strings.TrimSpace(input.Name)
	if input.Slug == "" {
		input.Slug = slugOrName("", input.Name)
	}
	if input.CategorySlug == "" {
		input.CategorySlug = "grocery"
	}
	if input.SubcategorySlug == "" {
		input.SubcategorySlug = input.CategorySlug
	}
	if input.ShortDescription == "" {
		input.ShortDescription = "Available from a trusted BNC shop."
	}
	if input.ImageURL == "" {
		input.ImageURL = "/mockup/products/veg-tomato.jpg"
	}
	if len(input.GalleryURLs) == 0 {
		input.GalleryURLs = []string{input.ImageURL}
	}
	if input.Unit == "" {
		input.Unit = defaultUnitForProduct(input.CategorySlug, input.Name)
	}
	if len(input.UnitOptions) == 0 {
		input.UnitOptions = defaultUnitOptions(input.CategorySlug, input.Name)
	}
	if len(input.SizeOptions) == 0 {
		input.SizeOptions = defaultSizeOptions(input.CategorySlug)
	}
	if input.StockStatus == "" {
		input.StockStatus = "in_stock"
	}
	if input.StockStatus != "sold_out" && input.StockStatus != "low_stock" && input.StockStatus != "preorder" {
		input.StockStatus = "in_stock"
	}
	if input.DeliveryEta == "" {
		input.DeliveryEta = "Same day"
	}
	if len(input.DeliveryAreas) == 0 {
		input.DeliveryAreas = []string{"Nearby areas"}
	}
	if input.Brand == "" {
		input.Brand = "Local shop"
	}
	if input.ProductType == "" {
		input.ProductType = input.Name + " Local"
	}
	if input.Organic == "" {
		input.Organic = "No"
	}
	if input.FormFactor == "" {
		input.FormFactor = "Whole"
	}
	if input.ShelfLife == "" {
		input.ShelfLife = "7 Days"
	}
	if input.FoodType == "" {
		input.FoodType = "Fresh"
	}
	if input.Origin == "" {
		input.Origin = "India"
	}
	if input.Packaging == "" {
		input.Packaging = "Shop packed"
	}
}

func defaultUnitForProduct(categorySlug, name string) string {
	options := defaultUnitOptions(categorySlug, name)
	if len(options) == 0 {
		return "1 pc"
	}
	return options[0]
}

func defaultUnitOptions(categorySlug, name string) []string {
	key := strings.ToLower(categorySlug + " " + name)
	switch {
	case strings.Contains(key, "tailor") || strings.Contains(key, "fashion"):
		return []string{"Free size", "S", "M", "L", "XL", "Custom"}
	case strings.Contains(key, "restaurant") || strings.Contains(key, "food") || strings.Contains(key, "bakery"):
		return []string{"1 plate", "Half", "Full", "Family pack"}
	case strings.Contains(key, "electronics") || strings.Contains(key, "mobile"):
		return []string{"1 pc", "With warranty", "Combo"}
	case strings.Contains(key, "beauty") || strings.Contains(key, "service"):
		return []string{"1 session", "Package", "Home service"}
	case strings.Contains(key, "oil"):
		return []string{"500 ml", "1 L", "5 L"}
	case strings.Contains(key, "rice") || strings.Contains(key, "dal") || strings.Contains(key, "atta"):
		return []string{"1 kg", "5 kg", "10 kg", "25 kg"}
	default:
		return []string{"1 kg", "500 g", "1 pc", "Free size"}
	}
}

func defaultSizeOptions(categorySlug string) []string {
	key := strings.ToLower(categorySlug)
	if strings.Contains(key, "tailor") || strings.Contains(key, "fashion") {
		return []string{"Free size", "S", "M", "L", "XL", "Custom"}
	}
	return []string{}
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
	active := true
	if input.IsActive != nil {
		active = *input.IsActive
	}
	var category Category
	err := s.db.QueryRow(ctx, `
		INSERT INTO categories (name, slug, icon, accent_color, sort_order, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, slug, name, icon, accent_color, is_active, sort_order
	`, input.Name, input.Slug, input.Icon, input.AccentColor, input.SortOrder, active).
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
	ImageURLs        []string `json:"imageUrls"`
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
	if err := s.replaceBusinessImages(ctx, id, input.Name, input.ThumbnailURL, input.ImageURLs); err != nil {
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
	var businessID string
	if err := s.db.QueryRow(ctx, `SELECT id FROM businesses WHERE slug = $1`, input.Slug).Scan(&businessID); err != nil {
		return Business{}, err
	}
	if err := s.replaceBusinessImages(ctx, businessID, input.Name, input.ThumbnailURL, input.ImageURLs); err != nil {
		return Business{}, err
	}
	return s.GetBusinessBySlug(ctx, input.Slug)
}

func (s *Store) replaceBusinessImages(ctx context.Context, businessID, businessName string, thumbnailURL *string, imageURLs []string) error {
	urls := cleanedStrings(imageURLs)
	if len(urls) == 0 && thumbnailURL != nil && strings.TrimSpace(*thumbnailURL) != "" {
		urls = []string{strings.TrimSpace(*thumbnailURL)}
	}
	if len(urls) == 0 {
		return nil
	}
	if _, err := s.db.Exec(ctx, `DELETE FROM business_images WHERE business_id = $1`, businessID); err != nil {
		return err
	}
	for index, url := range urls {
		if _, err := s.db.Exec(ctx, `
			INSERT INTO business_images (business_id, url, alt, variant, is_primary, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, businessID, url, businessName+" image", "shop", index == 0, index+1); err != nil {
			return err
		}
	}
	return nil
}

func cleanedStrings(values []string) []string {
	cleaned := []string{}
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			cleaned = append(cleaned, value)
		}
	}
	return cleaned
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
