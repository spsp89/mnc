package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"bnc-backend/internal/config"
	"bnc-backend/internal/store"
)

type Server struct {
	store *store.Store
	cfg   config.Config
}

func NewServer(st *store.Store, cfg config.Config) http.Handler {
	s := &Server{store: st, cfg: cfg}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", s.health)
	mux.HandleFunc("GET /admin/login", s.adminLoginPage)
	mux.HandleFunc("POST /admin/login", s.adminLogin)
	mux.HandleFunc("POST /admin/logout", s.adminLogout)
	mux.HandleFunc("GET /admin", s.adminPage)
	mux.Handle("GET /mockup/", mockupFileServer())
	mux.HandleFunc("GET /api/catalog", s.catalog)
	mux.HandleFunc("GET /api/categories", s.categories)
	mux.HandleFunc("GET /api/business/", s.business)
	mux.HandleFunc("GET /api/deals", s.deals)
	mux.HandleFunc("GET /api/clinics", s.clinics)
	mux.HandleFunc("GET /api/clinics/", s.clinic)
	mux.HandleFunc("POST /api/booking-requests", s.createBookingRequest)
	mux.HandleFunc("POST /api/admin/categories", s.createCategory)
	mux.HandleFunc("PATCH /api/admin/categories/", s.updateCategory)
	mux.HandleFunc("DELETE /api/admin/categories/", s.deleteCategory)
	mux.HandleFunc("POST /api/admin/businesses", s.createBusiness)
	mux.HandleFunc("PATCH /api/admin/businesses/", s.updateBusiness)
	mux.HandleFunc("DELETE /api/admin/businesses/", s.deleteBusiness)
	mux.HandleFunc("POST /api/admin/clinics", s.createClinic)
	mux.HandleFunc("PATCH /api/admin/clinics/", s.updateClinic)
	mux.HandleFunc("DELETE /api/admin/clinics/", s.deleteClinic)
	mux.HandleFunc("POST /api/admin/doctors", s.createDoctor)
	mux.HandleFunc("PATCH /api/admin/doctors/", s.updateDoctor)
	mux.HandleFunc("DELETE /api/admin/doctors/", s.deleteDoctor)
	mux.HandleFunc("POST /api/admin/deals", s.createDeal)
	mux.HandleFunc("PATCH /api/admin/deals/", s.updateDeal)
	mux.HandleFunc("DELETE /api/admin/deals/", s.deleteDeal)

	return withCORS(mux)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) catalog(w http.ResponseWriter, r *http.Request) {
	query, err := catalogQueryFromRequest(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", err.Error(), nil)
		return
	}

	response, err := s.store.GetCatalog(r.Context(), query)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load catalog.", nil)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (s *Server) categories(w http.ResponseWriter, r *http.Request) {
	categories, err := s.store.GetCategories(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load categories.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"categories": categories})
}

func (s *Server) business(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/api/business/")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Business slug is required.", nil)
		return
	}

	business, err := s.store.GetBusinessBySlug(r.Context(), slug)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Business not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load business.", nil)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"business": business})
}

func (s *Server) deals(w http.ResponseWriter, r *http.Request) {
	deals, err := s.store.GetDeals(
		r.Context(),
		strings.TrimSpace(r.URL.Query().Get("section")),
		parseBool(r.URL.Query().Get("featured")),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load deals.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deals": deals})
}

func (s *Server) clinics(w http.ResponseWriter, r *http.Request) {
	clinics, err := s.store.GetClinics(r.Context(), strings.TrimSpace(r.URL.Query().Get("query")))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load clinics.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"clinics": clinics})
}

func (s *Server) clinic(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/api/clinics/")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Clinic slug is required.", nil)
		return
	}

	clinic, err := s.store.GetClinicBySlug(r.Context(), slug)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Clinic not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load clinic.", nil)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"clinic": clinic})
}

func (s *Server) createBookingRequest(w http.ResponseWriter, r *http.Request) {
	var input store.BookingRequestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.PatientName) == "" || strings.TrimSpace(input.Phone) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Patient name and phone are required.", nil)
		return
	}

	created, err := s.store.CreateBookingRequest(r.Context(), input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create booking request.", nil)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"bookingRequest": created})
}

func (s *Server) createCategory(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}

	var input store.CategoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Slug) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Category name and slug are required.", nil)
		return
	}

	category, err := s.store.CreateCategory(r.Context(), input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create category.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"category": category})
}

func (s *Server) updateCategory(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/admin/categories/")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Category slug is required.", nil)
		return
	}
	var input store.CategoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.Name) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Category name is required.", nil)
		return
	}
	category, err := s.store.UpdateCategory(r.Context(), slug, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Category not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update category.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"category": category})
}

func (s *Server) deleteCategory(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	if err := s.store.DeleteCategory(r.Context(), pathSlug(r, "/api/admin/categories/")); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Category not found.", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete category.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createBusiness(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}

	var input store.BusinessInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Slug) == "" || strings.TrimSpace(input.CategorySlug) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Business name, slug, and categorySlug are required.", nil)
		return
	}

	business, err := s.store.CreateBusiness(r.Context(), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusBadRequest, "invalid_query", "Category does not exist.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create business.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"business": business})
}

func (s *Server) updateBusiness(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/admin/businesses/")
	var input store.BusinessInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if slug == "" || strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.CategorySlug) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Business slug, name, and categorySlug are required.", nil)
		return
	}
	business, err := s.store.UpdateBusiness(r.Context(), slug, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Business or category not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update business.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"business": business})
}

func (s *Server) deleteBusiness(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	if err := s.store.DeleteBusiness(r.Context(), pathSlug(r, "/api/admin/businesses/")); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Business not found.", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete business.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createClinic(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	var input store.ClinicInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Slug) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Clinic name and slug are required.", nil)
		return
	}
	clinic, err := s.store.CreateClinic(r.Context(), input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create clinic.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"clinic": clinic})
}

func (s *Server) updateClinic(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/admin/clinics/")
	var input store.ClinicInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if slug == "" || strings.TrimSpace(input.Name) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Clinic slug and name are required.", nil)
		return
	}
	clinic, err := s.store.UpdateClinic(r.Context(), slug, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Clinic not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update clinic.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"clinic": clinic})
}

func (s *Server) deleteClinic(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	if err := s.store.DeleteClinic(r.Context(), pathSlug(r, "/api/admin/clinics/")); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Clinic not found.", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete clinic.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createDoctor(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	var input store.DoctorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.ClinicSlug) == "" || strings.TrimSpace(input.Name) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "clinicSlug and doctor name are required.", nil)
		return
	}
	doctor, err := s.store.CreateDoctor(r.Context(), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusBadRequest, "invalid_query", "Clinic does not exist.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create doctor.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"doctor": doctor})
}

func (s *Server) updateDoctor(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/admin/doctors/")
	var input store.DoctorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if slug == "" || strings.TrimSpace(input.ClinicSlug) == "" || strings.TrimSpace(input.Name) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Doctor slug, clinicSlug, and name are required.", nil)
		return
	}
	doctor, err := s.store.UpdateDoctor(r.Context(), slug, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Doctor or clinic not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update doctor.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"doctor": doctor})
}

func (s *Server) deleteDoctor(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	if err := s.store.DeleteDoctor(r.Context(), pathSlug(r, "/api/admin/doctors/")); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Doctor not found.", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete doctor.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) createDeal(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}

	var input store.DealInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if strings.TrimSpace(input.BusinessSlug) == "" || strings.TrimSpace(input.Slug) == "" || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Code) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "businessSlug, slug, title, and code are required.", nil)
		return
	}

	deal, err := s.store.CreateDeal(r.Context(), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusBadRequest, "invalid_query", "Business does not exist.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create deal.", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"deal": deal})
}

func (s *Server) updateDeal(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	slug := pathSlug(r, "/api/admin/deals/")
	var input store.DealInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "Invalid JSON body.", nil)
		return
	}
	if slug == "" || strings.TrimSpace(input.BusinessSlug) == "" || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Code) == "" {
		writeError(w, http.StatusBadRequest, "invalid_query", "Deal slug, businessSlug, title, and code are required.", nil)
		return
	}
	deal, err := s.store.UpdateDeal(r.Context(), slug, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Deal or business not found.", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update deal.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deal": deal})
}

func (s *Server) deleteDeal(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	if err := s.store.DeleteDeal(r.Context(), pathSlug(r, "/api/admin/deals/")); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Deal not found.", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete deal.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

func (s *Server) isAdmin(r *http.Request) bool {
	token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if token != "" && token == s.cfg.AdminToken {
		return true
	}
	return s.hasAdminSession(r)
}

func pathSlug(r *http.Request, prefix string) string {
	return strings.Trim(strings.TrimPrefix(r.URL.Path, prefix), "/")
}

func catalogQueryFromRequest(r *http.Request) (store.CatalogQuery, error) {
	values := r.URL.Query()
	limit := 0
	if raw := values.Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 100 {
			return store.CatalogQuery{}, errors.New("limit must be between 1 and 100")
		}
		limit = parsed
	}

	sort := values.Get("sort")
	if sort == "" {
		sort = "default"
	}
	if sort != "default" && sort != "rating" && sort != "distance" {
		return store.CatalogQuery{}, errors.New("sort must be default, rating, or distance")
	}

	return store.CatalogQuery{
		Query:        strings.TrimSpace(first(values.Get("query"), values.Get("q"))),
		CategorySlug: strings.TrimSpace(first(values.Get("categorySlug"), values.Get("category"))),
		Featured:     parseBool(values.Get("featured")),
		Popular:      parseBool(values.Get("popular")),
		Sort:         sort,
		Limit:        limit,
	}, nil
}

func first(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func parseBool(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == "true" || value == "1" || value == "yes"
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code, message string, details map[string]any) {
	writeJSON(w, status, map[string]any{
		"error": map[string]any{
			"code":    code,
			"message": message,
			"details": details,
		},
	})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
