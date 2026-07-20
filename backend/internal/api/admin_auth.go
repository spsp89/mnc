package api

import (
	"net/http"
	"strings"
)

const adminSessionCookie = "bnc_admin_session"

func (s *Server) adminLoginPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(adminLoginHTML(r.URL.Query().Get("error") == "1")))
}

func (s *Server) adminLogin(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Redirect(w, r, "/admin/login?error=1", http.StatusSeeOther)
		return
	}

	username := strings.TrimSpace(r.FormValue("username"))
	password := strings.TrimSpace(r.FormValue("password"))
	expectedPassword := s.cfg.AdminPassword
	if expectedPassword == "" {
		expectedPassword = s.cfg.AdminToken
	}

	if username != s.cfg.AdminUsername || password != expectedPassword {
		http.Redirect(w, r, "/admin/login?error=1", http.StatusSeeOther)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     adminSessionCookie,
		Value:    s.cfg.AdminToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 12,
	})
	http.Redirect(w, r, "/admin?view=panel", http.StatusSeeOther)
}

func (s *Server) adminLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     adminSessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	http.Redirect(w, r, "/admin/login", http.StatusSeeOther)
}

func (s *Server) hasAdminSession(r *http.Request) bool {
	cookie, err := r.Cookie(adminSessionCookie)
	return err == nil && cookie.Value != "" && cookie.Value == s.cfg.AdminToken
}

func adminLoginHTML(showError bool) string {
	errorHTML := ""
	if showError {
		errorHTML = `<div class="error">The username or password is incorrect.</div>`
	}

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BNC Admin Login</title>
  <style>
    :root {
      --navy:#0b2f74;
      --deep:#061f5f;
      --ink:#06245f;
      --gold:#f4b227;
      --line:#dbe5f4;
      --muted:#6d7fa0;
      --bg:#f6f8fc;
    }
    * { box-sizing:border-box; }
    body {
      margin:0;
      min-height:100vh;
      display:grid;
      place-items:center;
      padding:24px;
      font-family:Inter, "Segoe UI", system-ui, sans-serif;
      color:var(--ink);
      background:
        radial-gradient(circle at 18% 18%, rgba(244,178,39,.22), transparent 26%),
        linear-gradient(135deg, #061f5f 0%, #0b2f74 44%, #1f58a8 100%);
    }
    .card {
      width:min(100%, 500px);
      padding:34px;
      border-radius:28px;
      background:white;
      box-shadow:0 28px 80px rgba(2,16,52,.28);
      border:1px solid rgba(255,255,255,.65);
    }
    .icon {
      width:66px;
      height:66px;
      display:grid;
      place-items:center;
      margin-bottom:26px;
      border-radius:20px;
      color:var(--navy);
      background:#eef4ff;
      font-size:34px;
      font-weight:900;
    }
    .eyebrow {
      margin:0 0 10px;
      color:var(--muted);
      font-size:13px;
      font-weight:950;
      letter-spacing:.22em;
      text-transform:uppercase;
    }
    h1 { margin:0; font-size:36px; line-height:1.05; letter-spacing:0; }
    p { margin:18px 0 26px; color:var(--muted); font-size:17px; line-height:1.55; font-weight:750; }
    form { display:grid; gap:18px; }
    label { display:grid; gap:8px; color:var(--muted); font-size:12px; font-weight:950; text-transform:uppercase; }
    input {
      width:100%;
      border:1px solid var(--line);
      border-radius:18px;
      padding:17px 18px;
      font:inherit;
      color:var(--ink);
      outline:none;
      font-weight:800;
      background:#fbfdff;
    }
    input:focus { border-color:var(--gold); box-shadow:0 0 0 4px rgba(244,178,39,.18); }
    button {
      margin-top:2px;
      border:0;
      border-radius:18px;
      padding:17px;
      color:white;
      background:var(--navy);
      font:inherit;
      font-size:18px;
      font-weight:900;
      cursor:pointer;
    }
    .error {
      margin:0 0 22px;
      padding:15px 18px;
      border-radius:18px;
      color:#b80f0f;
      background:#fff1f1;
      border:1px solid #ffc9c9;
      font-weight:900;
    }
    .hint {
      margin-top:24px;
      padding:16px 18px;
      border-radius:18px;
      color:var(--muted);
      background:var(--bg);
      font-weight:800;
      line-height:1.5;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="icon">B</div>
    <div class="eyebrow">Admin Access</div>
    <h1>Sign in to BNC</h1>
    <p>Login first, then manage shops, categories, clinics, doctors, deals and offers.</p>
    ` + errorHTML + `
    <form method="post" action="/admin/login">
      <label>Username
        <input name="username" autocomplete="username" required />
      </label>
      <label>Password
        <input name="password" type="password" autocomplete="current-password" required />
      </label>
      <button type="submit">Sign in</button>
    </form>
    <div class="hint">Local default username is <strong>admin</strong>. Password uses ADMIN_PASSWORD, or ADMIN_TOKEN when ADMIN_PASSWORD is not set.</div>
  </main>
</body>
</html>`
}
