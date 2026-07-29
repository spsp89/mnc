package api

import (
	"errors"
	"net/http"

	"bnc-backend/internal/store"
)

func (s *Server) adminMerchants(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	merchants, err := s.store.ListMerchantAccounts(r.Context(), parseBool(r.URL.Query().Get("includeInactive")))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load merchants.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"merchants": merchants})
}

func (s *Server) deleteAdminMerchant(w http.ResponseWriter, r *http.Request) {
	if !s.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "invalid_query", "Admin token is required.", nil)
		return
	}
	if err := s.store.DeleteMerchantAccount(r.Context(), pathSlug(r, "/api/admin/merchants/")); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Merchant not found.", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not remove merchant.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}
