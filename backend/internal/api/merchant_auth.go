package api

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"bnc-backend/internal/store"
)

const merchantSessionCookie = "bnc_merchant_session"

type merchantSession struct {
	ID  string `json:"id"`
	Sig string `json:"sig"`
}

func (s *Server) merchantLoginPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(merchantLoginHTML(r.URL.Query().Get("error") == "1", false)))
}

func (s *Server) merchantSignupPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(merchantLoginHTML(r.URL.Query().Get("error") == "1", true)))
}

func (s *Server) merchantLogin(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Redirect(w, r, "/merchant/login?error=1", http.StatusSeeOther)
		return
	}
	account, err := s.store.AuthenticateMerchant(r.Context(), r.FormValue("email"), r.FormValue("password"))
	if err != nil {
		http.Redirect(w, r, "/merchant/login?error=1", http.StatusSeeOther)
		return
	}
	s.setMerchantCookie(w, account.ID)
	http.Redirect(w, r, "/merchant?view=panel", http.StatusSeeOther)
}

func (s *Server) merchantSignup(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Redirect(w, r, "/merchant/signup?error=1", http.StatusSeeOther)
		return
	}
	input := store.MerchantSignupInput{
		OwnerName:        strings.TrimSpace(r.FormValue("ownerName")),
		Email:            strings.TrimSpace(r.FormValue("email")),
		Password:         r.FormValue("password"),
		Phone:            optionalFormValue(r, "phone"),
		BusinessName:     strings.TrimSpace(r.FormValue("businessName")),
		BusinessSlug:     strings.TrimSpace(r.FormValue("businessSlug")),
		CategorySlug:     strings.TrimSpace(r.FormValue("categorySlug")),
		Purpose:          strings.TrimSpace(r.FormValue("purpose")),
		ShortDescription: strings.TrimSpace(r.FormValue("shortDescription")),
		ThumbnailURL:     optionalFormValue(r, "thumbnailUrl"),
		WhatsApp:         optionalFormValue(r, "whatsapp"),
		Website:          optionalFormValue(r, "website"),
		Area:             strings.TrimSpace(r.FormValue("area")),
		AddressLabel:     strings.TrimSpace(r.FormValue("addressLabel")),
		Tags:             splitCSV(r.FormValue("tags")),
	}
	dashboard, err := s.store.CreateMerchantWithBusiness(r.Context(), input)
	if err != nil {
		http.Redirect(w, r, "/merchant/signup?error=1", http.StatusSeeOther)
		return
	}
	s.setMerchantCookie(w, dashboard.Merchant.ID)
	http.Redirect(w, r, "/merchant?view=panel", http.StatusSeeOther)
}

func (s *Server) merchantLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: merchantSessionCookie, Value: "", Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode, MaxAge: -1})
	http.Redirect(w, r, "/merchant/login", http.StatusSeeOther)
}

func (s *Server) merchantIDFromRequest(r *http.Request) (string, bool) {
	cookie, err := r.Cookie(merchantSessionCookie)
	if err != nil || cookie.Value == "" {
		return "", false
	}
	raw, err := base64.RawURLEncoding.DecodeString(cookie.Value)
	if err != nil {
		return "", false
	}
	var session merchantSession
	if err := json.Unmarshal(raw, &session); err != nil || session.ID == "" {
		return "", false
	}
	return session.ID, hmac.Equal([]byte(session.Sig), []byte(s.signMerchantID(session.ID)))
}

func (s *Server) requireMerchantAccount(r *http.Request) (store.MerchantAccount, bool) {
	id, ok := s.merchantIDFromRequest(r)
	if !ok {
		return store.MerchantAccount{}, false
	}
	account, err := s.store.GetMerchantAccount(r.Context(), id)
	return account, err == nil
}

func (s *Server) setMerchantCookie(w http.ResponseWriter, id string) {
	payload, _ := json.Marshal(merchantSession{ID: id, Sig: s.signMerchantID(id)})
	http.SetCookie(w, &http.Cookie{
		Name:     merchantSessionCookie,
		Value:    base64.RawURLEncoding.EncodeToString(payload),
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 30,
	})
}

func (s *Server) signMerchantID(id string) string {
	mac := hmac.New(sha256.New, []byte(s.cfg.AdminToken))
	mac.Write([]byte("merchant:" + id))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *Server) merchantMe(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	dashboard, err := s.store.GetMerchantDashboard(r.Context(), account.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load merchant dashboard.", nil)
		return
	}
	writeJSON(w, http.StatusOK, dashboard)
}

func (s *Server) updateMerchantBusiness(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.BusinessInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	input.Slug = account.BusinessSlug
	input.IsFeatured = false
	input.IsPopular = false
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.CategorySlug) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Shop name and category are required.", nil)
		return
	}
	business, err := s.store.UpdateBusiness(r.Context(), account.BusinessSlug, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update merchant shop.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"business": business})
}

func (s *Server) createMerchantProduct(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	input.BusinessSlug = account.BusinessSlug
	product, err := s.store.CreateProduct(r.Context(), input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create product.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"product": product})
}

func (s *Server) updateMerchantProduct(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/merchant/products/")
	if err := s.ensureProductOwner(r, slug, account.BusinessSlug); err != nil {
		writeError(w, http.StatusForbidden, "forbidden", "This product belongs to another shop.", nil)
		return
	}
	var input store.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	input.BusinessSlug = account.BusinessSlug
	product, err := s.store.UpdateProduct(r.Context(), slug, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update product.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"product": product})
}

func (s *Server) deleteMerchantProduct(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/merchant/products/")
	if err := s.ensureProductOwner(r, slug, account.BusinessSlug); err != nil {
		writeError(w, http.StatusForbidden, "forbidden", "This product belongs to another shop.", nil)
		return
	}
	if err := s.store.DeleteProduct(r.Context(), slug); err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete product.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createMerchantDeal(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.DealInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	input.BusinessSlug = account.BusinessSlug
	if strings.TrimSpace(input.Title) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Offer title is required.", nil)
		return
	}
	deal, err := s.store.CreateDeal(r.Context(), input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create deal.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"deal": deal})
}

func (s *Server) updateMerchantDeal(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/merchant/deals/")
	if err := s.ensureDealOwner(r, slug, account.BusinessSlug); err != nil {
		writeError(w, http.StatusForbidden, "forbidden", "This deal belongs to another shop.", nil)
		return
	}
	var input store.DealInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	input.BusinessSlug = account.BusinessSlug
	deal, err := s.store.UpdateDeal(r.Context(), slug, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update deal.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deal": deal})
}

func (s *Server) deleteMerchantDeal(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/merchant/deals/")
	if err := s.ensureDealOwner(r, slug, account.BusinessSlug); err != nil {
		writeError(w, http.StatusForbidden, "forbidden", "This deal belongs to another shop.", nil)
		return
	}
	if err := s.store.DeleteDeal(r.Context(), slug); err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete deal.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createMerchantDeliveryBoy(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.DeliveryBoyInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.Name) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Delivery boy name is required.", nil)
		return
	}
	item, err := s.store.CreateDeliveryBoy(r.Context(), account.ID, input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not save delivery boy.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"deliveryBoy": item})
}

func (s *Server) updateMerchantDeliveryBoy(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.DeliveryBoyInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	item, err := s.store.UpdateDeliveryBoy(r.Context(), account.ID, pathSlug(r, "/api/merchant/delivery-boys/"), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Delivery boy not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update delivery boy.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deliveryBoy": item})
}

func (s *Server) deleteMerchantDeliveryBoy(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	err := s.store.DeleteDeliveryBoy(r.Context(), account.ID, pathSlug(r, "/api/merchant/delivery-boys/"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Delivery boy not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not remove delivery boy.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createMerchantOrder(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.MerchantOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.Location) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Delivery location is required.", nil)
		return
	}
	order, err := s.store.CreateMerchantOrder(r.Context(), account.ID, account.BusinessSlug, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Delivery boy not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create order.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"order": order})
}

func (s *Server) updateMerchantOrder(w http.ResponseWriter, r *http.Request) {
	account, ok := s.requireMerchantAccount(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Merchant login is required.", nil)
		return
	}
	var input store.MerchantOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	order, err := s.store.UpdateMerchantOrder(r.Context(), account.ID, pathSlug(r, "/api/merchant/orders/"), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Order or delivery boy not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update order.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"order": order})
}

func (s *Server) ensureProductOwner(r *http.Request, slug, businessSlug string) error {
	product, err := s.store.GetProductBySlug(r.Context(), slug)
	if err != nil {
		return err
	}
	if product.BusinessSlug != businessSlug {
		return errors.New("not owner")
	}
	return nil
}

func (s *Server) ensureDealOwner(r *http.Request, slug, businessSlug string) error {
	deals, err := s.store.GetDeals(r.Context(), "", false)
	if err != nil {
		return err
	}
	for _, deal := range deals {
		if deal.Slug == slug && deal.Business.Slug == businessSlug {
			return nil
		}
	}
	return errors.New("not owner")
}

func optionalFormValue(r *http.Request, name string) *string {
	value := strings.TrimSpace(r.FormValue(name))
	if value == "" {
		return nil
	}
	return &value
}

func splitCSV(value string) []string {
	items := []string{}
	for _, item := range strings.Split(value, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			items = append(items, item)
		}
	}
	return items
}
