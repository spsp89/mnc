package store

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type MerchantAccount struct {
	ID           string `json:"id"`
	BusinessSlug string `json:"businessSlug"`
	BusinessName string `json:"businessName"`
	CategoryName string `json:"categoryName"`
	OwnerName    string `json:"ownerName"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Purpose      string `json:"purpose"`
	IsActive     bool   `json:"isActive"`
	CreatedAt    string `json:"createdAt"`
}

type MerchantSignupInput struct {
	OwnerName        string   `json:"ownerName"`
	Email            string   `json:"email"`
	Password         string   `json:"password"`
	Phone            *string  `json:"phone"`
	BusinessName     string   `json:"businessName"`
	BusinessSlug     string   `json:"businessSlug"`
	CategorySlug     string   `json:"categorySlug"`
	Purpose          string   `json:"purpose"`
	ShortDescription string   `json:"shortDescription"`
	ThumbnailURL     *string  `json:"thumbnailUrl"`
	WhatsApp         *string  `json:"whatsapp"`
	Website          *string  `json:"website"`
	Area             string   `json:"area"`
	AddressLabel     string   `json:"addressLabel"`
	Tags             []string `json:"tags"`
}

type MerchantDashboard struct {
	Merchant     MerchantAccount `json:"merchant"`
	Business     Business        `json:"business"`
	Products     []Product       `json:"products"`
	Deals        []Deal          `json:"deals"`
	DeliveryBoys []DeliveryBoy   `json:"deliveryBoys"`
	Orders       []MerchantOrder `json:"orders"`
}

type DeliveryBoy struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	WhatsApp  string `json:"whatsapp"`
	Vehicle   string `json:"vehicle"`
	Area      string `json:"area"`
	Notes     string `json:"notes"`
	IsActive  bool   `json:"isActive"`
	CreatedAt string `json:"createdAt"`
}

type DeliveryBoyInput struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	WhatsApp string `json:"whatsapp"`
	Vehicle  string `json:"vehicle"`
	Area     string `json:"area"`
	Notes    string `json:"notes"`
	IsActive bool   `json:"isActive"`
}

type MerchantOrder struct {
	ID              string `json:"id"`
	OrderCode       string `json:"orderCode"`
	ProductSlug     string `json:"productSlug"`
	ProductName     string `json:"productName"`
	DeliveryBoyID   string `json:"deliveryBoyId"`
	DeliveryBoyName string `json:"deliveryBoyName"`
	CustomerName    string `json:"customerName"`
	CustomerPhone   string `json:"customerPhone"`
	Quantity        string `json:"quantity"`
	PaymentNote     string `json:"paymentNote"`
	Location        string `json:"location"`
	Landmark        string `json:"landmark"`
	DeliveryNote    string `json:"deliveryNote"`
	Status          string `json:"status"`
	Total           string `json:"total"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}

type MerchantOrderInput struct {
	ProductSlug   string `json:"productSlug"`
	ProductName   string `json:"productName"`
	DeliveryBoyID string `json:"deliveryBoyId"`
	CustomerName  string `json:"customerName"`
	CustomerPhone string `json:"customerPhone"`
	Quantity      string `json:"quantity"`
	PaymentNote   string `json:"paymentNote"`
	Location      string `json:"location"`
	Landmark      string `json:"landmark"`
	DeliveryNote  string `json:"deliveryNote"`
	Status        string `json:"status"`
	Total         string `json:"total"`
}

func (s *Store) EnsureMerchantSchema(ctx context.Context) error {
	_, err := s.db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS merchant_accounts (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
			business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
			owner_name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			phone TEXT NOT NULL DEFAULT '',
			purpose TEXT NOT NULL DEFAULT 'Local shop',
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_merchant_accounts_business ON merchant_accounts(business_id);
		CREATE TABLE IF NOT EXISTS merchant_delivery_boys (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
			merchant_id TEXT NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			phone TEXT NOT NULL DEFAULT '',
			whatsapp TEXT NOT NULL DEFAULT '',
			vehicle TEXT NOT NULL DEFAULT '',
			area TEXT NOT NULL DEFAULT '',
			notes TEXT NOT NULL DEFAULT '',
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_merchant_delivery_boys_merchant ON merchant_delivery_boys(merchant_id, is_active);
		CREATE TABLE IF NOT EXISTS merchant_orders (
			id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
			merchant_id TEXT NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
			business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
			product_slug TEXT NOT NULL DEFAULT '',
			product_name TEXT NOT NULL,
			delivery_boy_id TEXT REFERENCES merchant_delivery_boys(id) ON DELETE SET NULL,
			customer_name TEXT NOT NULL DEFAULT '',
			customer_phone TEXT NOT NULL DEFAULT '',
			quantity TEXT NOT NULL DEFAULT '',
			payment_note TEXT NOT NULL DEFAULT '',
			location TEXT NOT NULL DEFAULT '',
			landmark TEXT NOT NULL DEFAULT '',
			delivery_note TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'new',
			total TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_merchant_orders_merchant ON merchant_orders(merchant_id, created_at DESC);
	`)
	return err
}

func (s *Store) CreateMerchantWithBusiness(ctx context.Context, input MerchantSignupInput) (MerchantDashboard, error) {
	email := strings.ToLower(strings.TrimSpace(input.Email))
	if email == "" || strings.TrimSpace(input.Password) == "" || strings.TrimSpace(input.BusinessName) == "" {
		return MerchantDashboard{}, errors.New("owner email, password, and shop name are required")
	}
	if input.CategorySlug == "" {
		input.CategorySlug = "grocery"
	}
	businessInput := BusinessInput{
		CategorySlug:     input.CategorySlug,
		Slug:             slugOrName(input.BusinessSlug, input.BusinessName),
		Name:             strings.TrimSpace(input.BusinessName),
		ShortDescription: strings.TrimSpace(input.ShortDescription),
		ThumbnailURL:     input.ThumbnailURL,
		Phone:            input.Phone,
		WhatsApp:         input.WhatsApp,
		Website:          input.Website,
		Area:             input.Area,
		AddressLabel:     input.AddressLabel,
		Tags:             input.Tags,
		IsFeatured:       false,
		IsPopular:        false,
	}
	if businessInput.ShortDescription == "" {
		businessInput.ShortDescription = "Merchant-created shop on BNC Nearu."
	}
	business, err := s.CreateBusiness(ctx, businessInput)
	if err != nil {
		return MerchantDashboard{}, err
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return MerchantDashboard{}, err
	}
	phone := stringValue(input.Phone)
	account := MerchantAccount{}
	err = s.db.QueryRow(ctx, `
		INSERT INTO merchant_accounts (business_id, owner_name, email, password_hash, phone, purpose)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, owner_name, email, phone, purpose
	`, business.ID, strings.TrimSpace(input.OwnerName), email, string(passwordHash), phone, defaultString(input.Purpose, business.Category.Name)).
		Scan(&account.ID, &account.OwnerName, &account.Email, &account.Phone, &account.Purpose)
	if err != nil {
		_ = s.DeleteBusiness(ctx, business.Slug)
		return MerchantDashboard{}, err
	}
	account.BusinessSlug = business.Slug
	return s.GetMerchantDashboard(ctx, account.ID)
}

func (s *Store) AuthenticateMerchant(ctx context.Context, email, password string) (MerchantAccount, error) {
	var account MerchantAccount
	var hash string
	err := s.db.QueryRow(ctx, `
		SELECT m.id, b.slug, b.name, c.name, m.owner_name, m.email, m.phone, m.purpose, m.is_active, m.created_at::TEXT, m.password_hash
		FROM merchant_accounts m
		JOIN businesses b ON b.id = m.business_id
		JOIN categories c ON c.id = b.category_id
		WHERE lower(m.email) = lower($1) AND m.is_active = TRUE AND b.is_active = TRUE
	`, strings.TrimSpace(email)).Scan(&account.ID, &account.BusinessSlug, &account.BusinessName, &account.CategoryName, &account.OwnerName, &account.Email, &account.Phone, &account.Purpose, &account.IsActive, &account.CreatedAt, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return MerchantAccount{}, ErrNotFound
	}
	if err != nil {
		return MerchantAccount{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return MerchantAccount{}, ErrNotFound
	}
	return account, nil
}

func (s *Store) GetMerchantAccount(ctx context.Context, id string) (MerchantAccount, error) {
	var account MerchantAccount
	err := s.db.QueryRow(ctx, `
		SELECT m.id, b.slug, b.name, c.name, m.owner_name, m.email, m.phone, m.purpose, m.is_active, m.created_at::TEXT
		FROM merchant_accounts m
		JOIN businesses b ON b.id = m.business_id
		JOIN categories c ON c.id = b.category_id
		WHERE m.id = $1 AND m.is_active = TRUE AND b.is_active = TRUE
	`, id).Scan(&account.ID, &account.BusinessSlug, &account.BusinessName, &account.CategoryName, &account.OwnerName, &account.Email, &account.Phone, &account.Purpose, &account.IsActive, &account.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return MerchantAccount{}, ErrNotFound
	}
	return account, err
}

func (s *Store) ListMerchantAccounts(ctx context.Context, includeInactive bool) ([]MerchantAccount, error) {
	where := "WHERE m.is_active = TRUE"
	if includeInactive {
		where = ""
	}
	rows, err := s.db.Query(ctx, `
		SELECT m.id, b.slug, b.name, c.name, m.owner_name, m.email, m.phone, m.purpose, m.is_active, m.created_at::TEXT
		FROM merchant_accounts m
		JOIN businesses b ON b.id = m.business_id
		JOIN categories c ON c.id = b.category_id
		`+where+`
		ORDER BY m.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accounts := []MerchantAccount{}
	for rows.Next() {
		var account MerchantAccount
		if err := rows.Scan(&account.ID, &account.BusinessSlug, &account.BusinessName, &account.CategoryName, &account.OwnerName, &account.Email, &account.Phone, &account.Purpose, &account.IsActive, &account.CreatedAt); err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}
	return accounts, rows.Err()
}

func (s *Store) DeleteMerchantAccount(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, `UPDATE merchant_accounts SET is_active = FALSE, updated_at = now() WHERE id = $1`, strings.TrimSpace(id))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetMerchantDashboard(ctx context.Context, merchantID string) (MerchantDashboard, error) {
	account, err := s.GetMerchantAccount(ctx, merchantID)
	if err != nil {
		return MerchantDashboard{}, err
	}
	business, err := s.GetBusinessBySlug(ctx, account.BusinessSlug)
	if err != nil {
		return MerchantDashboard{}, err
	}
	products, err := s.GetProducts(ctx, ProductQuery{BusinessSlug: account.BusinessSlug, IncludeInactive: true})
	if err != nil {
		return MerchantDashboard{}, err
	}
	allDeals, err := s.GetDeals(ctx, "", false)
	if err != nil {
		return MerchantDashboard{}, err
	}
	deals := []Deal{}
	for _, deal := range allDeals {
		if deal.Business.Slug == account.BusinessSlug {
			deals = append(deals, deal)
		}
	}
	deliveryBoys, err := s.ListDeliveryBoys(ctx, merchantID)
	if err != nil {
		return MerchantDashboard{}, err
	}
	orders, err := s.ListMerchantOrders(ctx, merchantID)
	if err != nil {
		return MerchantDashboard{}, err
	}
	return MerchantDashboard{Merchant: account, Business: business, Products: products, Deals: deals, DeliveryBoys: deliveryBoys, Orders: orders}, nil
}

func (s *Store) ListMerchantOrders(ctx context.Context, merchantID string) ([]MerchantOrder, error) {
	rows, err := s.db.Query(ctx, `
		SELECT o.id, upper(substr(o.id, 1, 8)), o.product_slug, o.product_name,
			COALESCE(o.delivery_boy_id, ''), COALESCE(d.name, ''),
			o.customer_name, o.customer_phone, o.quantity, o.payment_note, o.location,
			o.landmark, o.delivery_note, o.status, o.total, o.created_at::TEXT, o.updated_at::TEXT
		FROM merchant_orders o
		LEFT JOIN merchant_delivery_boys d ON d.id = o.delivery_boy_id
		WHERE o.merchant_id = $1
		ORDER BY o.created_at DESC
		LIMIT 200
	`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []MerchantOrder{}
	for rows.Next() {
		var item MerchantOrder
		if err := rows.Scan(&item.ID, &item.OrderCode, &item.ProductSlug, &item.ProductName, &item.DeliveryBoyID, &item.DeliveryBoyName, &item.CustomerName, &item.CustomerPhone, &item.Quantity, &item.PaymentNote, &item.Location, &item.Landmark, &item.DeliveryNote, &item.Status, &item.Total, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateMerchantOrder(ctx context.Context, merchantID, businessSlug string, input MerchantOrderInput) (MerchantOrder, error) {
	normalizeMerchantOrderInput(&input)
	business, err := s.GetBusinessBySlug(ctx, businessSlug)
	if err != nil {
		return MerchantOrder{}, err
	}
	if input.DeliveryBoyID != "" {
		if _, err := s.GetDeliveryBoy(ctx, merchantID, input.DeliveryBoyID); err != nil {
			return MerchantOrder{}, err
		}
	}
	var id string
	var deliveryBoyID any
	if input.DeliveryBoyID != "" {
		deliveryBoyID = input.DeliveryBoyID
	}
	err = s.db.QueryRow(ctx, `
		INSERT INTO merchant_orders (merchant_id, business_id, product_slug, product_name, delivery_boy_id, customer_name, customer_phone, quantity, payment_note, location, landmark, delivery_note, status, total)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id
	`, merchantID, business.ID, input.ProductSlug, input.ProductName, deliveryBoyID, input.CustomerName, input.CustomerPhone, input.Quantity, input.PaymentNote, input.Location, input.Landmark, input.DeliveryNote, input.Status, input.Total).Scan(&id)
	if err != nil {
		return MerchantOrder{}, err
	}
	return s.GetMerchantOrder(ctx, merchantID, id)
}

func (s *Store) UpdateMerchantOrder(ctx context.Context, merchantID, id string, input MerchantOrderInput) (MerchantOrder, error) {
	normalizeMerchantOrderInput(&input)
	if input.DeliveryBoyID != "" {
		if _, err := s.GetDeliveryBoy(ctx, merchantID, input.DeliveryBoyID); err != nil {
			return MerchantOrder{}, err
		}
	}
	var deliveryBoyID any
	if input.DeliveryBoyID != "" {
		deliveryBoyID = input.DeliveryBoyID
	}
	tag, err := s.db.Exec(ctx, `
		UPDATE merchant_orders
		SET delivery_boy_id = $1, customer_name = $2, customer_phone = $3, quantity = $4,
			payment_note = $5, location = $6, landmark = $7, delivery_note = $8,
			status = $9, total = $10, updated_at = now()
		WHERE merchant_id = $11 AND id = $12
	`, deliveryBoyID, input.CustomerName, input.CustomerPhone, input.Quantity, input.PaymentNote, input.Location, input.Landmark, input.DeliveryNote, input.Status, input.Total, merchantID, id)
	if err != nil {
		return MerchantOrder{}, err
	}
	if tag.RowsAffected() == 0 {
		return MerchantOrder{}, ErrNotFound
	}
	return s.GetMerchantOrder(ctx, merchantID, id)
}

func (s *Store) GetMerchantOrder(ctx context.Context, merchantID, id string) (MerchantOrder, error) {
	var item MerchantOrder
	err := s.db.QueryRow(ctx, `
		SELECT o.id, upper(substr(o.id, 1, 8)), o.product_slug, o.product_name,
			COALESCE(o.delivery_boy_id, ''), COALESCE(d.name, ''),
			o.customer_name, o.customer_phone, o.quantity, o.payment_note, o.location,
			o.landmark, o.delivery_note, o.status, o.total, o.created_at::TEXT, o.updated_at::TEXT
		FROM merchant_orders o
		LEFT JOIN merchant_delivery_boys d ON d.id = o.delivery_boy_id
		WHERE o.merchant_id = $1 AND o.id = $2
	`, merchantID, id).Scan(&item.ID, &item.OrderCode, &item.ProductSlug, &item.ProductName, &item.DeliveryBoyID, &item.DeliveryBoyName, &item.CustomerName, &item.CustomerPhone, &item.Quantity, &item.PaymentNote, &item.Location, &item.Landmark, &item.DeliveryNote, &item.Status, &item.Total, &item.CreatedAt, &item.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return MerchantOrder{}, ErrNotFound
	}
	return item, err
}

func (s *Store) ListDeliveryBoys(ctx context.Context, merchantID string) ([]DeliveryBoy, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, phone, whatsapp, vehicle, area, notes, is_active, created_at::TEXT
		FROM merchant_delivery_boys
		WHERE merchant_id = $1 AND is_active = TRUE
		ORDER BY name ASC
	`, merchantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []DeliveryBoy{}
	for rows.Next() {
		var item DeliveryBoy
		if err := rows.Scan(&item.ID, &item.Name, &item.Phone, &item.WhatsApp, &item.Vehicle, &item.Area, &item.Notes, &item.IsActive, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateDeliveryBoy(ctx context.Context, merchantID string, input DeliveryBoyInput) (DeliveryBoy, error) {
	normalizeDeliveryBoyInput(&input)
	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO merchant_delivery_boys (merchant_id, name, phone, whatsapp, vehicle, area, notes, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING id
	`, merchantID, input.Name, input.Phone, input.WhatsApp, input.Vehicle, input.Area, input.Notes, input.IsActive).Scan(&id)
	if err != nil {
		return DeliveryBoy{}, err
	}
	return s.GetDeliveryBoy(ctx, merchantID, id)
}

func (s *Store) UpdateDeliveryBoy(ctx context.Context, merchantID, id string, input DeliveryBoyInput) (DeliveryBoy, error) {
	normalizeDeliveryBoyInput(&input)
	tag, err := s.db.Exec(ctx, `
		UPDATE merchant_delivery_boys
		SET name = $1, phone = $2, whatsapp = $3, vehicle = $4, area = $5,
			notes = $6, is_active = $7, updated_at = now()
		WHERE merchant_id = $8 AND id = $9
	`, input.Name, input.Phone, input.WhatsApp, input.Vehicle, input.Area, input.Notes, input.IsActive, merchantID, id)
	if err != nil {
		return DeliveryBoy{}, err
	}
	if tag.RowsAffected() == 0 {
		return DeliveryBoy{}, ErrNotFound
	}
	return s.GetDeliveryBoy(ctx, merchantID, id)
}

func (s *Store) DeleteDeliveryBoy(ctx context.Context, merchantID, id string) error {
	tag, err := s.db.Exec(ctx, `UPDATE merchant_delivery_boys SET is_active = FALSE, updated_at = now() WHERE merchant_id = $1 AND id = $2`, merchantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetDeliveryBoy(ctx context.Context, merchantID, id string) (DeliveryBoy, error) {
	var item DeliveryBoy
	err := s.db.QueryRow(ctx, `
		SELECT id, name, phone, whatsapp, vehicle, area, notes, is_active, created_at::TEXT
		FROM merchant_delivery_boys
		WHERE merchant_id = $1 AND id = $2 AND is_active = TRUE
	`, merchantID, id).Scan(&item.ID, &item.Name, &item.Phone, &item.WhatsApp, &item.Vehicle, &item.Area, &item.Notes, &item.IsActive, &item.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return DeliveryBoy{}, ErrNotFound
	}
	return item, err
}

func normalizeDeliveryBoyInput(input *DeliveryBoyInput) {
	input.Name = strings.TrimSpace(input.Name)
	input.Phone = strings.TrimSpace(input.Phone)
	input.WhatsApp = strings.TrimSpace(input.WhatsApp)
	input.Vehicle = strings.TrimSpace(input.Vehicle)
	input.Area = strings.TrimSpace(input.Area)
	input.Notes = strings.TrimSpace(input.Notes)
	if input.WhatsApp == "" {
		input.WhatsApp = input.Phone
	}
	if input.Vehicle == "" {
		input.Vehicle = "Bike"
	}
	if input.Area == "" {
		input.Area = "Nearby areas"
	}
}

func normalizeMerchantOrderInput(input *MerchantOrderInput) {
	input.ProductSlug = strings.TrimSpace(input.ProductSlug)
	input.ProductName = strings.TrimSpace(input.ProductName)
	input.DeliveryBoyID = strings.TrimSpace(input.DeliveryBoyID)
	input.CustomerName = strings.TrimSpace(input.CustomerName)
	input.CustomerPhone = strings.TrimSpace(input.CustomerPhone)
	input.Quantity = strings.TrimSpace(input.Quantity)
	input.PaymentNote = strings.TrimSpace(input.PaymentNote)
	input.Location = strings.TrimSpace(input.Location)
	input.Landmark = strings.TrimSpace(input.Landmark)
	input.DeliveryNote = strings.TrimSpace(input.DeliveryNote)
	input.Status = strings.TrimSpace(input.Status)
	input.Total = strings.TrimSpace(input.Total)
	if input.ProductName == "" {
		input.ProductName = "Customer order"
	}
	if input.Quantity == "" {
		input.Quantity = "1 item"
	}
	if input.Status == "" {
		input.Status = "new"
	}
	switch input.Status {
	case "new", "assigned", "picked_up", "delivered", "cancelled":
	default:
		input.Status = "new"
	}
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func defaultString(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}
