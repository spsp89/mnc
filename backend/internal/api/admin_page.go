package api

import "net/http"

func (s *Server) adminPage(w http.ResponseWriter, r *http.Request) {
	if !s.hasAdminSession(r) || r.URL.Query().Get("view") != "panel" {
		http.Redirect(w, r, "/admin/login", http.StatusSeeOther)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(adminHTML))
}

const adminHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BNC Admin Panel</title>
  <style>
    :root {
      --navy:#0b2f74;
      --deep:#061f5f;
      --ink:#06245f;
      --gold:#f4b227;
      --bg:#f6f8fc;
      --panel:#ffffff;
      --soft:#eef4ff;
      --line:#dbe5f4;
      --muted:#6d7fa0;
      --danger:#c92323;
      --ok:#147a3d;
      --shadow:0 18px 45px rgba(6,31,95,.10);
    }
    * { box-sizing:border-box; }
    body {
      margin:0;
      font-family:Inter, "Segoe UI", system-ui, sans-serif;
      background:var(--bg);
      color:var(--ink);
    }
    button, input, textarea, select { font:inherit; }
    button {
      border:0;
      cursor:pointer;
      border-radius:14px;
      padding:12px 15px;
      font-weight:900;
      color:white;
      background:var(--navy);
      transition:transform .15s ease, box-shadow .15s ease, background .15s ease;
    }
    button:hover { transform:translateY(-1px); box-shadow:0 8px 18px rgba(11,47,116,.18); }
    button.secondary { background:var(--gold); color:var(--ink); }
    button.ghost { background:white; color:var(--navy); border:1px solid var(--line); }
    button.danger { background:#fff1f1; color:var(--danger); border:1px solid #ffd4d4; }
    input, textarea, select {
      width:100%;
      border:1px solid var(--line);
      background:#fbfdff;
      color:var(--ink);
      border-radius:14px;
      padding:12px 13px;
      outline:none;
      font-weight:750;
    }
    textarea { min-height:82px; resize:vertical; }
    input:focus, textarea:focus, select:focus { border-color:var(--gold); box-shadow:0 0 0 4px rgba(244,178,39,.17); }
    label { display:grid; gap:7px; color:var(--muted); font-size:12px; font-weight:900; }
    h1, h2, h3, p { margin:0; }
    .shell { min-height:100vh; display:grid; grid-template-columns:292px minmax(0,1fr); }
    .sidebar {
      position:sticky;
      top:0;
      height:100vh;
      padding:22px;
      color:white;
      background:
        radial-gradient(circle at 20% 8%, rgba(244,178,39,.35), transparent 24%),
        linear-gradient(180deg, #092b70 0%, #061a50 100%);
      overflow:auto;
    }
    .brand { display:flex; align-items:center; gap:12px; margin-bottom:22px; }
    .mark {
      width:48px; height:48px; border-radius:18px;
      display:grid; place-items:center;
      background:var(--gold); color:var(--ink); font-weight:1000; font-size:24px;
      box-shadow:0 12px 24px rgba(0,0,0,.18);
    }
    .brand h1 { font-size:28px; line-height:1; letter-spacing:.2px; }
    .brand span { color:#dce8ff; font-weight:800; font-size:13px; }
    .tokenBox, .sideCard {
      background:rgba(255,255,255,.10);
      border:1px solid rgba(255,255,255,.18);
      border-radius:22px;
      padding:15px;
      margin-bottom:16px;
    }
    .tokenBox label { color:#d9e6ff; }
    .tokenBox input { background:white; border:0; }
    .nav { display:grid; gap:9px; margin:16px 0; }
    .nav button {
      display:flex; justify-content:space-between; align-items:center;
      text-align:left;
      background:rgba(255,255,255,.09);
      border:1px solid rgba(255,255,255,.14);
      color:white;
    }
    .nav button.active { background:white; color:var(--navy); }
    .pill {
      display:inline-grid; place-items:center;
      min-width:28px; height:28px; border-radius:999px;
      background:rgba(244,178,39,.18); color:var(--gold); font-size:12px;
      padding:0 8px;
    }
    .nav button.active .pill { background:var(--gold); color:var(--ink); }
    .sideCard p { color:#d9e6ff; font-size:13px; line-height:1.45; font-weight:750; }
    .sideLinks { display:grid; gap:8px; margin-top:12px; }
    .sideLinks a { color:white; text-decoration:none; font-weight:900; font-size:13px; }
    .content { padding:24px; overflow:hidden; }
    .hero {
      display:flex;
      justify-content:space-between;
      gap:18px;
      align-items:center;
      padding:22px;
      border-radius:28px;
      color:white;
      background:
        radial-gradient(circle at 85% 20%, rgba(244,178,39,.22), transparent 22%),
        linear-gradient(135deg, var(--deep), #1d57ae);
      box-shadow:var(--shadow);
    }
    .hero h2 { font-size:30px; }
    .hero p { margin-top:8px; color:#e4ecff; font-weight:800; }
    .heroActions { display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; }
    .stats {
      display:grid;
      grid-template-columns:repeat(5,minmax(150px,1fr));
      gap:14px;
      margin:18px 0;
    }
    .stat {
      background:var(--panel);
      border:1px solid var(--line);
      border-radius:22px;
      padding:16px;
      box-shadow:0 10px 25px rgba(6,31,95,.05);
    }
    .stat strong { display:block; font-size:30px; line-height:1; }
    .stat span { display:block; margin-top:7px; color:var(--muted); font-weight:850; }
    .status {
      display:none;
      margin:0 0 16px;
      padding:13px 15px;
      border-radius:16px;
      font-weight:900;
    }
    .status.ok { display:block; color:var(--ok); background:#eaf8ef; border:1px solid #ccebd6; }
    .status.err { display:block; color:var(--danger); background:#fff0f0; border:1px solid #ffd1d1; }
    .tab { display:none; }
    .tab.active { display:block; }
    .sectionFocus {
      outline:4px solid rgba(244,178,39,.45);
      box-shadow:0 0 0 8px rgba(244,178,39,.12), var(--shadow);
    }
    .sectionTitle { display:flex; justify-content:space-between; align-items:end; gap:14px; margin:20px 0 12px; }
    .sectionTitle h2 { font-size:24px; }
    .sectionTitle p { color:var(--muted); font-weight:800; margin-top:4px; }
    .workbench {
      display:grid;
      grid-template-columns:minmax(330px, 430px) minmax(0,1fr);
      gap:18px;
      align-items:start;
    }
    .card {
      background:var(--panel);
      border:1px solid var(--line);
      border-radius:24px;
      padding:18px;
      box-shadow:0 14px 35px rgba(6,31,95,.06);
    }
    .cardHeader { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; }
    .cardHeader h3 { font-size:18px; }
    .formGrid { display:grid; gap:11px; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
    .checkRow { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .checkRow label, .singleCheck {
      display:flex; align-items:center; gap:10px;
      background:var(--soft);
      padding:12px;
      border-radius:14px;
      color:var(--ink);
    }
    .checkRow input, .singleCheck input { width:auto; }
    .formActions { display:grid; grid-template-columns:1fr auto; gap:10px; margin-top:4px; }
    .listTools { display:flex; gap:10px; align-items:center; }
    .searchInput { max-width:260px; }
    .list {
      display:grid;
      gap:10px;
      max-height:calc(100vh - 360px);
      min-height:260px;
      overflow-y:auto;
      overflow-x:hidden;
      padding-right:8px;
      scrollbar-color:var(--navy) #e8effb;
      scrollbar-width:thin;
    }
    .list::-webkit-scrollbar { width:10px; }
    .list::-webkit-scrollbar-track { background:#e8effb; border-radius:999px; }
    .list::-webkit-scrollbar-thumb { background:var(--navy); border-radius:999px; border:2px solid #e8effb; }
    #categoryList { max-height:none; }
    .item {
      display:grid;
      grid-template-columns:58px minmax(0,1fr) auto;
      gap:13px;
      align-items:center;
      border:1px solid var(--line);
      border-radius:18px;
      padding:12px;
      background:#fbfdff;
    }
    .thumb {
      width:58px; height:58px; border-radius:16px;
      overflow:hidden;
      display:grid; place-items:center;
      color:white; background:linear-gradient(135deg,var(--navy),#2361b9);
      font-weight:1000;
    }
    .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
    .item strong { display:block; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .item small { display:block; color:var(--muted); font-weight:850; margin-top:4px; line-height:1.3; }
    .badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:7px; }
    .badge { background:var(--soft); color:var(--navy); border-radius:999px; padding:5px 8px; font-size:11px; font-weight:900; }
    .detailGrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px 12px; margin-top:8px; color:var(--muted); font-size:12px; font-weight:850; }
    .detailGrid span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .categoryTree { display:grid; gap:12px; max-height:calc(100vh - 360px); overflow:auto; padding-right:8px; }
    .categoryWorkbench { grid-template-columns:minmax(330px,420px) minmax(0,1fr); }
    .categoryOverview {
      grid-column:1 / -1;
      position:relative;
      overflow:hidden;
      color:white;
      border:0;
      background:
        radial-gradient(circle at 86% 16%, rgba(244,178,39,.34), transparent 24%),
        linear-gradient(135deg, #092b70, #235db4);
    }
    .categoryOverview::after {
      content:"";
      position:absolute;
      width:180px;
      height:180px;
      right:-62px;
      bottom:-92px;
      border-radius:999px;
      background:rgba(255,255,255,.10);
    }
    .categoryOverview .cardHeader,
    .categoryOverview .categorySummary,
    .categoryOverview .categoryActions { position:relative; z-index:1; }
    .categoryOverview h3 { font-size:24px; color:white; }
    .categoryOverview p { margin-top:5px; color:#dce8ff; font-weight:850; }
    .categorySummary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:14px; }
    .categoryMetric {
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.18);
      border-radius:18px;
      padding:12px;
    }
    .categoryMetric strong { display:block; color:var(--gold); font-size:24px; line-height:1; }
    .categoryMetric span { display:block; margin-top:6px; color:#e6efff; font-size:12px; font-weight:900; }
    .categoryActions { display:flex; flex-wrap:wrap; gap:10px; margin-top:14px; }
    .categoryActions button,
    .categoryActions a {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:43px;
      border-radius:14px;
      padding:11px 14px;
      font-weight:900;
      text-decoration:none;
    }
    .categoryActions a { background:white; color:var(--navy); border:1px solid rgba(255,255,255,.38); }
    .categoryActions button.ghost { background:rgba(255,255,255,.10); color:white; border:1px solid rgba(255,255,255,.30); }
    .treeCategory { border:1px solid var(--line); border-radius:18px; background:#fbfdff; overflow:hidden; transition:border-color .15s ease, box-shadow .15s ease; }
    .treeCategory.active { border-color:var(--gold); box-shadow:0 12px 26px rgba(244,178,39,.16); }
    .treeCategory summary { cursor:pointer; list-style:none; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; padding:14px; align-items:center; }
    .treeCategory.active summary { background:#fff8e8; }
    .treeCategory summary::-webkit-details-marker { display:none; }
    .treeTitle { display:flex; align-items:center; gap:10px; min-width:0; }
    .colorDot { width:14px; height:14px; border-radius:999px; flex:0 0 auto; box-shadow:0 0 0 3px rgba(11,47,116,.08); }
    .treeBody { border-top:1px solid var(--line); padding:14px; display:grid; gap:12px; }
    .treeActionRow { display:flex; flex-wrap:wrap; gap:8px; }
    .treeActionRow button { padding:9px 11px; font-size:12px; }
    .treeGroup { border:1px dashed var(--line); border-radius:14px; padding:12px; background:white; }
    .treeGroup h4 { margin:0 0 8px; font-size:13px; }
    .miniList { display:grid; gap:8px; }
    .miniItem { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; align-items:center; color:var(--muted); font-size:12px; font-weight:850; }
    .miniItem strong { color:var(--navy); font-size:13px; }
    .actions { display:flex; gap:7px; }
    .actions button { padding:10px 12px; }
    .empty { padding:28px; text-align:center; color:var(--muted); font-weight:900; border:1px dashed var(--line); border-radius:18px; }
    @media (max-width: 1120px) {
      .shell { grid-template-columns:1fr; }
      .sidebar { position:relative; height:auto; }
      .nav { grid-template-columns:repeat(5,minmax(110px,1fr)); }
      .workbench, .categoryWorkbench { grid-template-columns:1fr; }
      .stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 720px) {
      .content { padding:14px; }
      .hero { display:grid; }
      .hero h2 { font-size:24px; }
      .stats { grid-template-columns:1fr; }
      .row, .checkRow, .formActions { grid-template-columns:1fr; }
      .categorySummary { grid-template-columns:1fr 1fr; }
      .nav { grid-template-columns:1fr 1fr; }
      .item { grid-template-columns:48px minmax(0,1fr); }
      .actions { grid-column:1 / -1; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="mark">B</div>
        <div>
          <h1>BNC Admin</h1>
          <span>Catalog control panel</span>
        </div>
      </div>
      <div class="tokenBox">
        <label>Admin token
          <input id="token" value="change-me" autocomplete="off" />
        </label>
      </div>
      <nav class="nav">
        <button class="active" data-tab="dashboard">Dashboard <span class="pill" id="navDashboard">0</span></button>
        <button data-tab="categories">Categories <span class="pill" id="navCategories">0</span></button>
        <button data-tab="businesses">Shops <span class="pill" id="navShops">0</span></button>
        <button data-tab="merchants">Merchants <span class="pill" id="navMerchants">0</span></button>
        <button data-tab="products">Products <span class="pill" id="navProducts">0</span></button>
        <button data-tab="clinics">Clinics <span class="pill" id="navClinics">0</span></button>
        <button data-tab="doctors">Doctors <span class="pill" id="navDoctors">0</span></button>
        <button data-tab="deals">Deals <span class="pill" id="navDeals">0</span></button>
        <button data-tab="offers">Offers <span class="pill" id="navOffers">0</span></button>
        <button data-tab="homepage">Homepage <span class="pill" id="navHomepage">7</span></button>
        <button data-tab="ecosystem">Ecosystem <span class="pill" id="navEcosystem">10</span></button>
        <button data-tab="images">Images <span class="pill" id="navImages">0</span></button>
        <button data-tab="settings">Settings <span class="pill" id="navSettings">1</span></button>
      </nav>
      <div class="sideCard">
        <p>Use this panel to update the PostgreSQL data used by the Flutter app, Go API, and future Next.js website.</p>
        <div class="sideLinks">
          <a href="/health" target="_blank">Open health check</a>
          <a href="/api/catalog" target="_blank">Open catalog API</a>
          <a href="/api/products" target="_blank">Open products API</a>
          <a href="/api/clinics" target="_blank">Open clinics API</a>
          <a href="/api/deals" target="_blank">Open deals API</a>
        </div>
      </div>
    </aside>

    <main class="content">
      <div class="hero">
        <div>
          <h2>Full Admin Panel</h2>
          <p>Add, edit, deactivate, and review all marketplace data from one place.</p>
        </div>
        <div class="heroActions">
          <button class="secondary" id="refreshBtn">Refresh data</button>
          <button class="ghost" id="clearBtn">Clear current form</button>
          <form method="post" action="/admin/logout">
            <button class="ghost" type="submit">Sign out</button>
          </form>
        </div>
      </div>

      <div class="stats">
        <div class="stat"><strong id="statShops">0</strong><span>Shops</span></div>
        <div class="stat"><strong id="statMerchants">0</strong><span>Merchants</span></div>
        <div class="stat"><strong id="statProducts">0</strong><span>Products</span></div>
        <div class="stat"><strong id="statCategories">0</strong><span>Categories</span></div>
        <div class="stat"><strong id="statClinics">0</strong><span>Clinics</span></div>
        <div class="stat"><strong id="statDoctors">0</strong><span>Doctors</span></div>
        <div class="stat"><strong id="statDeals">0</strong><span>Deals</span></div>
        <div class="stat"><strong id="statOffers">0</strong><span>Offers</span></div>
      </div>

      <div id="status" class="status"></div>

      <section id="dashboard" class="tab active">
        <div class="sectionTitle">
          <div><h2>Admin Dashboard</h2><p>Quick view of all editable BNC marketplace content.</p></div>
        </div>
        <div class="card">
          <div class="list">
            <article class="item"><div class="thumb">C</div><div><strong>Categories</strong><small>Name, slug, icon, color, sort order, active status, and preview.</small></div></article>
            <article class="item"><div class="thumb">S</div><div><strong>Shops</strong><small>Business details, contact, address, images, tags, featured, popular, badges, and status.</small></div></article>
            <article class="item"><div class="thumb">M</div><div><strong>Merchants</strong><small>Review merchant accounts and remove merchant login access while keeping shop deletion separate.</small></div></article>
            <article class="item"><div class="thumb">P</div><div><strong>Products</strong><small>Product photos, prices, weight, offer text, highlights, specifications, and shop ownership.</small></div></article>
            <article class="item"><div class="thumb">H</div><div><strong>Clinics & Doctors</strong><small>Clinic photos, locations, doctors, speciality, fee, slot, contact actions, and status.</small></div></article>
            <article class="item"><div class="thumb">D</div><div><strong>Deals & Offers</strong><small>Coupon codes, discount text, shop links, images, featured status, dates, and sort order.</small></div></article>
            <article class="item"><div class="thumb">B</div><div><strong>Homepage & Ecosystem</strong><small>Hero content, featured sections, top offers, ecosystem cards, links, icons, and ordering.</small></div></article>
          </div>
        </div>
      </section>

      <section id="businesses" class="tab">
        <div class="sectionTitle">
          <div><h2>Shop Management</h2><p>Create listings, assign categories, and mark featured or popular shops.</p></div>
        </div>
        <div class="workbench">
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Shop</h3><span class="badge" id="businessMode">New</span></div>
            <form class="formGrid" data-kind="business" data-create="/api/admin/businesses" data-update="/api/admin/businesses/">
              <div class="row"><label>Name<input name="name" required /></label><label>Slug<input name="slug" required /></label></div>
              <div class="row"><label>Category slug<input name="categorySlug" value="restaurants" required /></label><label>Area<input name="area" value="Kozhikode" /></label></div>
              <label>Description<textarea name="shortDescription" required></textarea></label>
              <div class="row"><label>Phone<input name="phone" /></label><label>WhatsApp<input name="whatsapp" /></label></div>
              <div class="row"><label>Email<input name="email" /></label><label>Website<input name="website" /></label></div>
              <label>Image URL or /mockup path<input name="thumbnailUrl" placeholder="/mockup/im-restaurant.jpg" /></label>
              <label>Address label<input name="addressLabel" placeholder="Business address shown to users" /></label>
              <label>Tags comma separated<input name="tags" placeholder="family, dinner, local" /></label>
              <div class="row"><label>Badge text<input name="badgeText" /></label><label>Badge color<input name="badgeColor" value="#2469D6" /></label></div>
              <div class="checkRow"><label><input type="checkbox" name="isFeatured" /> Featured</label><label><input type="checkbox" name="isPopular" /> Popular</label></div>
              <div class="formActions"><button class="secondary">Save shop</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader">
              <h3>Current Shops</h3>
              <div class="listTools"><input class="searchInput" data-filter="businessList" placeholder="Search shops" /></div>
            </div>
            <div id="businessList" class="list"></div>
          </div>
        </div>
      </section>

      <section id="merchants" class="tab">
        <div class="sectionTitle">
          <div><h2>Merchant Management</h2><p>Remove merchant login access for shop owners without deleting the shop listing.</p></div>
        </div>
        <div class="card">
          <div class="cardHeader">
            <h3>Merchant Accounts</h3>
            <div class="listTools"><input class="searchInput" data-filter="merchantList" placeholder="Search merchants" /></div>
          </div>
          <div id="merchantList" class="list"></div>
        </div>
      </section>

      <section id="products" class="tab">
        <div class="sectionTitle">
          <div><h2>Product Management</h2><p>Add product photos, prices, discounts, highlights, and details shown inside the Flutter product pages.</p></div>
        </div>
        <div class="workbench">
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Product</h3><span class="badge" id="productMode">New</span></div>
            <form class="formGrid" data-kind="product" data-create="/api/admin/products" data-update="/api/admin/products/">
              <div class="row"><label>Name<input name="name" required /></label><label>Slug<input name="slug" placeholder="tomato" /></label></div>
              <div class="row"><label>Shop slug<input name="businessSlug" placeholder="fresh-basket" required /></label><label>Category slug<input name="categorySlug" value="grocery" /></label></div>
              <div class="row"><label>Subcategory slug<input name="subcategorySlug" placeholder="fresh-vegetables" /></label><label>Unit<input name="unit" value="1 kg" /></label></div>
              <label>Short description<textarea name="shortDescription" placeholder="Fresh product available today"></textarea></label>
              <label>Main product image<input name="imageUrl" placeholder="/mockup/products/veg-tomato.jpg" /></label>
              <label>Gallery images comma separated<input name="galleryUrls" placeholder="/mockup/products/veg-tomato.jpg, /mockup/products/veg-onion.jpg" /></label>
              <div class="row"><label>Current price<input name="price" type="number" step="0.01" value="0" /></label><label>Old price<input name="oldPrice" type="number" step="0.01" value="0" /></label></div>
              <div class="row"><label>Discount text<input name="discountText" placeholder="15% OFF" /></label><label>Sort order<input name="sortOrder" type="number" value="50" /></label></div>
              <div class="row"><label>Brand<input name="brand" value="Local shop" /></label><label>Type<input name="productType" placeholder="Tomato Local" /></label></div>
              <div class="row"><label>Organic<input name="organic" value="No" /></label><label>Form factor<input name="formFactor" value="Whole" /></label></div>
              <div class="row"><label>Shelf life<input name="shelfLife" value="7 Days" /></label><label>Food type<input name="foodType" value="Fresh" /></label></div>
              <div class="row"><label>Origin<input name="origin" value="India" /></label><label>Packaging<input name="packaging" value="Shop packed" /></label></div>
              <label>Tags comma separated<input name="tags" placeholder="tomato, vegetable, fresh" /></label>
              <div class="checkRow"><label><input type="checkbox" name="isPerishable" checked /> Perishable</label><label><input type="checkbox" name="isActive" checked /> Active</label></div>
              <div class="formActions"><button class="secondary">Save product</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Current Products</h3><input class="searchInput" data-filter="productList" placeholder="Search products" /></div>
            <div id="productList" class="list"></div>
          </div>
        </div>
      </section>

      <section id="categories" class="tab">
        <div class="sectionTitle">
          <div><h2>Category Management</h2><p>Control browse categories shown in Flutter and web.</p></div>
        </div>
        <div class="workbench categoryWorkbench">
          <div class="card categoryOverview">
            <div class="cardHeader">
              <div>
                <h3 id="selectedCategoryName">Select category</h3>
                <p id="selectedCategorySlug">Pick a category to manage its shops, products, and subcategories.</p>
              </div>
              <span class="badge" id="selectedCategoryStatus">Ready</span>
            </div>
            <div class="categorySummary">
              <div class="categoryMetric"><strong id="selectedCategoryShops">0</strong><span>Shops</span></div>
              <div class="categoryMetric"><strong id="selectedCategorySubcategories">0</strong><span>Subcategories</span></div>
              <div class="categoryMetric"><strong id="selectedCategoryProducts">0</strong><span>Products</span></div>
              <div class="categoryMetric"><strong id="selectedCategorySort">0</strong><span>Sort order</span></div>
            </div>
            <div class="categoryActions">
              <button type="button" class="secondary" id="editSelectedCategory">Edit category</button>
              <button type="button" class="ghost" id="addShopForSelectedCategory">Add shop</button>
              <button type="button" class="ghost" id="addProductForSelectedCategory">Add product / subcategory</button>
              <a id="openSelectedCategoryApi" href="/api/catalog" target="_blank">Open catalog API</a>
            </div>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Category</h3><span class="badge" id="categoryMode">New</span></div>
            <form class="formGrid" data-kind="category" data-create="/api/admin/categories" data-update="/api/admin/categories/">
              <div class="row"><label>Name<input name="name" required /></label><label>Slug<input name="slug" required /></label></div>
              <div class="row"><label>Icon<input name="icon" value="category" /></label><label>Accent color<input name="accentColor" value="#0B2F74" /></label></div>
              <div class="row"><label>Sort order<input name="sortOrder" type="number" value="50" /></label><label class="singleCheck"><input type="checkbox" name="isActive" checked /> Active</label></div>
              <div class="formActions"><button class="secondary">Save category</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Current Categories</h3><input class="searchInput" data-filter="categoryList" placeholder="Search categories" /></div>
            <div id="categoryList" class="list"></div>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Category Structure</h3><input class="searchInput" data-filter="categoryTree" placeholder="Search category, shop, subcategory, product" /></div>
            <div id="categoryTree" class="categoryTree"></div>
          </div>
        </div>
      </section>

      <section id="clinics" class="tab">
        <div class="sectionTitle">
          <div><h2>Clinic Management</h2><p>Add nearby clinics with photo, contact, distance, and location text.</p></div>
        </div>
        <div class="workbench">
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Clinic</h3><span class="badge" id="clinicMode">New</span></div>
            <form class="formGrid" data-kind="clinic" data-create="/api/admin/clinics" data-update="/api/admin/clinics/">
              <div class="row"><label>Name<input name="name" required /></label><label>Slug<input name="slug" required /></label></div>
              <label>Image URL or /mockup path<input name="imageUrl" value="/mockup/im-pharmacy.jpg" /></label>
              <div class="row"><label>Phone<input name="phone" /></label><label>WhatsApp<input name="whatsapp" /></label></div>
              <div class="row"><label>Area<input name="area" value="Kozhikode" /></label><label>City<input name="city" value="Kozhikode" /></label></div>
              <div class="row"><label>Distance km<input name="distanceKm" type="number" step="0.1" value="1.0" /></label><label class="singleCheck"><input type="checkbox" name="isActive" checked /> Active</label></div>
              <label>Address<input name="addressLabel" /></label>
              <div class="formActions"><button class="secondary">Save clinic</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Current Clinics</h3><input class="searchInput" data-filter="clinicList" placeholder="Search clinics" /></div>
            <div id="clinicList" class="list"></div>
          </div>
        </div>
      </section>

      <section id="doctors" class="tab">
        <div class="sectionTitle">
          <div><h2>Doctor Management</h2><p>Attach doctors to clinics and keep fee, slot, service tags, and photo updated.</p></div>
        </div>
        <div class="workbench">
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Doctor</h3><span class="badge" id="doctorMode">New</span></div>
            <form class="formGrid" data-kind="doctor" data-create="/api/admin/doctors" data-update="/api/admin/doctors/">
              <div class="row"><label>Name<input name="name" required /></label><label>Slug<input name="slug" required /></label></div>
              <div class="row"><label>Clinic slug<input name="clinicSlug" required /></label><label>Speciality<input name="speciality" required /></label></div>
              <div class="row"><label>Experience<input name="experience" value="5 yrs exp" /></label><label>Fee<input name="fee" value="Rs300" /></label></div>
              <div class="row"><label>Next slot<input name="nextSlot" value="Today" /></label><label>Rating<input name="ratingAverage" type="number" step="0.1" value="4.5" /></label></div>
              <div class="row"><label>Rating count<input name="ratingCount" type="number" value="80" /></label><label class="singleCheck"><input type="checkbox" name="isActive" checked /> Active</label></div>
              <label>Image URL or /mockup path<input name="imageUrl" value="/mockup/im-occ_reception.jpg" /></label>
              <label>Services comma separated<input name="services" placeholder="Fever, BP check, Diabetes" /></label>
              <div class="formActions"><button class="secondary">Save doctor</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Current Doctors</h3><input class="searchInput" data-filter="doctorList" placeholder="Search doctors" /></div>
            <div id="doctorList" class="list"></div>
          </div>
        </div>
      </section>

      <section id="deals" class="tab">
        <div class="sectionTitle">
          <div><h2>Deals & Offers</h2><p>Create main offers, combo packages, codes, images, and shop links.</p></div>
        </div>
        <div class="workbench">
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Deal</h3><span class="badge" id="dealMode">New</span></div>
            <form class="formGrid" data-kind="deal" data-create="/api/admin/deals" data-update="/api/admin/deals/">
              <div class="row"><label>Title<input name="title" required /></label><label>Slug<input name="slug" required /></label></div>
              <div class="row"><label>Business slug<input name="businessSlug" required /></label><label>Code<input name="code" required /></label></div>
              <label>Description<textarea name="description"></textarea></label>
              <div class="row"><label>Section<select name="section"><option value="main">main</option><option value="combo">combo</option></select></label><label>Sort order<input name="sortOrder" type="number" value="50" /></label></div>
              <div class="row"><label>Accent color<input name="accentColor" value="#0B2F74" /></label><label class="singleCheck"><input type="checkbox" name="isFeatured" /> Featured</label></div>
              <label>Image URL or /mockup path<input name="imageUrl" value="/mockup/im-gifts.jpg" /></label>
              <div class="formActions"><button class="secondary">Save deal</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Current Deals</h3><input class="searchInput" data-filter="dealList" placeholder="Search deals" /></div>
            <div id="dealList" class="list"></div>
          </div>
        </div>
      </section>

      <section id="offers" class="tab">
        <div class="sectionTitle">
          <div><h2>Offer Management</h2><p>Create homepage offers with codes, shop links, images, and visit actions.</p></div>
        </div>
        <div class="workbench">
          <div class="card">
            <div class="cardHeader"><h3>Add / Edit Offer</h3><span class="badge" id="offerMode">New</span></div>
            <form class="formGrid" data-kind="offer" data-create="/api/admin/deals" data-update="/api/admin/deals/">
              <input type="hidden" name="section" value="main" />
              <div class="row"><label>Title<input name="title" required /></label><label>Slug<input name="slug" required /></label></div>
              <div class="row"><label>Business slug<input name="businessSlug" required /></label><label>Offer code<input name="code" required /></label></div>
              <label>Description<textarea name="description" placeholder="Short offer details shown to users"></textarea></label>
              <div class="row"><label>Sort order<input name="sortOrder" type="number" value="50" /></label><label>Accent color<input name="accentColor" value="#0E7A43" /></label></div>
              <label class="singleCheck"><input type="checkbox" name="isFeatured" checked /> Show as featured offer</label>
              <label>Image URL or /mockup path<input name="imageUrl" value="/mockup/im-gifts.jpg" /></label>
              <div class="formActions"><button class="secondary">Save offer</button><button type="button" class="ghost" data-reset>Reset</button></div>
            </form>
          </div>
          <div class="card">
            <div class="cardHeader"><h3>Current Offers</h3><input class="searchInput" data-filter="offerList" placeholder="Search offers" /></div>
            <div id="offerList" class="list"></div>
          </div>
        </div>
      </section>

      <section id="homepage" class="tab">
        <div class="sectionTitle">
          <div><h2>Homepage Controls</h2><p>Content blocks the admin should control for the public BNC home screen.</p></div>
        </div>
        <div class="card">
          <div class="list">
            <article class="item"><div class="thumb">H</div><div><strong>Hero title/subtitle</strong><small>Main heading, supporting text, location text, and search entry content.</small></div></article>
            <article class="item"><div class="thumb">C</div><div><strong>Featured categories</strong><small>Choose category order and which categories appear first.</small></div></article>
            <article class="item"><div class="thumb">S</div><div><strong>Featured shops & popular shops</strong><small>Control homepage shop sections using featured and popular flags.</small></div></article>
            <article class="item"><div class="thumb">D</div><div><strong>Deals in spotlight</strong><small>Select highlighted deal cards and view-all links.</small></div></article>
            <article class="item"><div class="thumb">O</div><div><strong>Today’s top offers</strong><small>Manage top offer cards, coupon codes, images, and shop visit actions.</small></div></article>
            <article class="item"><div class="thumb">E</div><div><strong>BNC ecosystem card order</strong><small>Control which ecosystem tools appear and their display order.</small></div></article>
          </div>
        </div>
      </section>

      <section id="ecosystem" class="tab">
        <div class="sectionTitle">
          <div><h2>BNC Ecosystem</h2><p>Manage business tools shown in the BNC ecosystem section.</p></div>
        </div>
        <div class="card">
          <div class="list">
            <article class="item"><div class="thumb">BC</div><div><strong>Business Card</strong><small>Title, subtitle, icon, link, active status, and sort order.</small></div></article>
            <article class="item"><div class="thumb">B2B</div><div><strong>B2B Network</strong><small>Partner discovery title, action link, active status, and order.</small></div></article>
            <article class="item"><div class="thumb">J</div><div><strong>Jobs</strong><small>Hiring card text, link, active status, and order.</small></div></article>
            <article class="item"><div class="thumb">W</div><div><strong>Winner</strong><small>Rewards, weekly draw, gift text, link, active status, and order.</small></div></article>
            <article class="item"><div class="thumb">F</div><div><strong>Feed</strong><small>Local stories and update card content.</small></div></article>
            <article class="item"><div class="thumb">P</div><div><strong>Plans</strong><small>Business plan card content and link.</small></div></article>
            <article class="item"><div class="thumb">D</div><div><strong>Dashboard</strong><small>Business performance shortcut content and link.</small></div></article>
            <article class="item"><div class="thumb">A</div><div><strong>Admin</strong><small>Admin shortcut text, access link, and visibility.</small></div></article>
            <article class="item"><div class="thumb">?</div><div><strong>Explanations</strong><small>Help article card text and link.</small></div></article>
            <article class="item"><div class="thumb">DR</div><div><strong>Doctor Booking</strong><small>Clinic booking card text, icon, link, active status, and order.</small></div></article>
          </div>
        </div>
      </section>

      <section id="images" class="tab">
        <div class="sectionTitle">
          <div><h2>Image Library</h2><p>Manage reusable photos for shops, clinics, doctors, deals, offers, and homepage cards.</p></div>
        </div>
        <div class="card">
          <div class="list">
            <article class="item"><div class="thumb">S</div><div><strong>Shop images/logo</strong><small>Business thumbnails, logos, and category images.</small></div></article>
            <article class="item"><div class="thumb">C</div><div><strong>Clinic and doctor photos</strong><small>Clinic photos and doctor profile images.</small></div></article>
            <article class="item"><div class="thumb">D</div><div><strong>Deal and offer photos</strong><small>Images used in deals, offers, and coupon cards.</small></div></article>
            <article class="item"><div class="thumb">B</div><div><strong>Homepage images</strong><small>Hero, ecosystem, and promotional assets.</small></div></article>
          </div>
        </div>
      </section>

      <section id="settings" class="tab">
        <div class="sectionTitle">
          <div><h2>Settings</h2><p>Basic admin and marketplace configuration.</p></div>
        </div>
        <div class="card">
          <form class="formGrid" id="settingsForm">
            <div class="row"><label>App name<input name="siteName" required /></label><label>Tagline<input name="tagline" /></label></div>
            <div class="row"><label>Primary color<input name="primaryColor" type="color" /></label><label>Secondary color<input name="secondaryColor" type="color" /></label></div>
            <div class="row"><label>Accent color<input name="accentColor" type="color" /></label><label>Background color<input name="backgroundColor" type="color" /></label></div>
            <div class="row"><label>Surface color<input name="surfaceColor" type="color" /></label><label>Muted text color<input name="mutedTextColor" type="color" /></label></div>
            <label>Logo URL<input name="logoUrl" placeholder="/assets/branding/bnc-logo.png" /></label>
            <div class="row"><label>Default city<input name="defaultCity" /></label><label>Default region<input name="defaultRegion" /></label></div>
            <div class="row"><label>Support phone<input name="supportPhone" /></label><label>Support WhatsApp<input name="supportWhatsApp" /></label></div>
            <div class="row"><label>Support email<input name="supportEmail" type="email" /></label><label>Currency code<input name="currencyCode" maxlength="6" /></label></div>
            <div class="row"><label>Auto update seconds<input name="updateIntervalSeconds" type="number" min="5" max="3600" /></label><label>Deals enabled<input name="enableDeals" type="checkbox" /></label></div>
            <label>Doctor bookings enabled<input name="enableDoctorBookings" type="checkbox" /></label>
            <div class="actions"><button class="primary" type="submit">Save settings</button><button type="button" id="reloadSettingsBtn">Reload settings</button></div>
          </form>
        </div>
        <div class="card">
          <div class="list">
            <article class="item"><div class="thumb">A</div><div><strong>Admin access</strong><small>Admin login, password environment settings, and sign-out flow.</small></div></article>
            <article class="item"><div class="thumb">L</div><div><strong>Default location</strong><small>Default city, region, and marketplace location text.</small></div></article>
            <article class="item"><div class="thumb">API</div><div><strong>API setup</strong><small>Backend URL used by Flutter, Next.js, and admin tools.</small></div></article>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const statusBox = $("#status");
    let lastLoaded = { catalog:{ categories:[], all:[] }, clinics:{ clinics:[] }, deals:{ deals:[] }, products:{ products:[] }, settings:null };
    let selectedCategorySlug = "";
    const sharedCategoryDefaults = [
      { name:"Grocery", slug:"grocery", icon:"shopping-cart", accentColor:"#FF5A4C", sortOrder:1, isActive:true },
      { name:"Restaurants", slug:"restaurants", icon:"utensils-crossed", accentColor:"#FFB01E", sortOrder:2, isActive:true },
      { name:"Bakery & Sweets", slug:"bakery-sweets", icon:"utensils-crossed", accentColor:"#D94842", sortOrder:3, isActive:false },
      { name:"Tailors", slug:"tailors", icon:"scissors", accentColor:"#0B285E", sortOrder:4, isActive:true },
      { name:"Beauty", slug:"beauty", icon:"sparkles", accentColor:"#FF7186", sortOrder:5, isActive:true },
      { name:"Electronics", slug:"electronics", icon:"monitor-smartphone", accentColor:"#6A66FF", sortOrder:6, isActive:true },
      { name:"Home Services", slug:"home-services", icon:"house-plus", accentColor:"#4AB64B", sortOrder:7, isActive:true },
      { name:"Pharmacy", slug:"pharmacy", icon:"layout-grid", accentColor:"#1F9D7A", sortOrder:8, isActive:false },
      { name:"Gifts & Stationery", slug:"gifts-stationery", icon:"layout-grid", accentColor:"#8A5BFF", sortOrder:9, isActive:false },
      { name:"More", slug:"more", icon:"layout-grid", accentColor:"#7183A6", sortOrder:10, isActive:false }
    ];

    function mergeSharedCategories(categories) {
      const bySlug = new Map((categories || []).map((category) => [category.slug, category]));
      sharedCategoryDefaults.forEach((category) => {
        if (!bySlug.has(category.slug)) {
          bySlug.set(category.slug, { ...category, seedOnly:true });
        }
      });
      return Array.from(bySlug.values()).sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));
    }

    function adminToken() {
      return $("#token").value.trim();
    }

    function showStatus(message, ok) {
      statusBox.textContent = message;
      statusBox.className = "status " + (ok ? "ok" : "err");
      clearTimeout(showStatus.timer);
      showStatus.timer = setTimeout(() => { statusBox.className = "status"; }, 4500);
    }

    async function api(path, options) {
      const request = options || {};
      const res = await fetch(path, {
        ...request,
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer " + adminToken(),
          ...(request.headers || {})
        }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = json && json.error && json.error.message ? json.error.message : "Request failed";
        throw new Error(message);
      }
      return json;
    }

    function formObject(form) {
      const data = Object.fromEntries(new FormData(form).entries());
      form.querySelectorAll("input[type=checkbox]").forEach((input) => {
        data[input.name] = input.checked;
      });
      ["sortOrder", "distanceKm", "ratingAverage", "ratingCount", "price", "oldPrice"].forEach((key) => {
        if (data[key] !== undefined) data[key] = Number(data[key] || 0);
      });
      ["tags", "services", "galleryUrls"].forEach((key) => {
        if (typeof data[key] === "string") {
          data[key] = data[key].split(",").map((value) => value.trim()).filter(Boolean);
        }
      });
      return data;
    }

    function resetForm(form) {
      form.reset();
      form.dataset.editing = "";
      const mode = $("#" + form.dataset.kind + "Mode");
      if (mode) mode.textContent = "New";
    }

    function fillForm(form, item) {
      form.dataset.editing = item.slug || "";
      Object.entries(item).forEach(([key, value]) => {
        const input = form.querySelector("[name='" + key + "']");
        if (!input) return;
        if (input.type === "checkbox") {
          input.checked = Boolean(value);
        } else {
          input.value = Array.isArray(value) ? value.join(", ") : (value ?? "");
        }
      });
      const mode = $("#" + form.dataset.kind + "Mode");
      if (mode) mode.textContent = "Editing " + (item.slug || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function initial(value) {
      return (value || "B").trim().slice(0, 1).toUpperCase();
    }

    function imageMarkup(src, title) {
      if (!src) return initial(title);
      return "<img src='" + escapeAttr(src) + "' alt='' loading='lazy' onerror='this.parentElement.textContent=\"" + escapeAttr(initial(title)) + "\"'>";
    }

    function escapeText(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[char]));
    }

    function escapeAttr(value) {
      return escapeText(value).replace(/"/g, "&quot;");
    }

    function renderItem(container, item) {
      const el = document.createElement("article");
      el.className = "item";
      const details = item.details || [];
      el.dataset.search = [item.title, item.meta, item.tags, ...(item.badges || []), ...details].join(" ").toLowerCase();
      el.innerHTML =
        "<div class='thumb'>" + imageMarkup(item.image, item.title) + "</div>" +
        "<div><strong>" + escapeText(item.title) + "</strong><small>" + escapeText(item.meta) + "</small><div class='badges'>" + item.badges.map((badge) => "<span class='badge'>" + escapeText(badge) + "</span>").join("") + "</div>" + detailMarkup(details) + "</div>" +
        "<div class='actions'><button type='button'>Edit</button><button type='button' class='danger'>Delete</button></div>";
      el.querySelector("button").onclick = item.onEdit;
      el.querySelector(".danger").onclick = item.onDelete;
      container.appendChild(el);
    }

    function detailMarkup(details) {
      if (!details || !details.length) return "";
      return "<div class='detailGrid'>" + details.filter(Boolean).map((detail) => "<span>" + escapeText(detail) + "</span>").join("") + "</div>";
    }

    function empty(container, message) {
      container.innerHTML = "<div class='empty'>" + escapeText(message) + "</div>";
    }

    function switchTab(tabId, updateUrl = true) {
      if (!$("#" + tabId)) return;
      $$(".nav button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
      $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.id === tabId));
      statusBox.className = "status";
      if (updateUrl) history.replaceState(null, "", "/admin?view=panel#" + tabId);
    }

    async function submitForm(form) {
      const body = formObject(form);
      const editing = form.dataset.editing || "";
      const method = editing ? "PATCH" : "POST";
      const path = editing ? form.dataset.update + encodeURIComponent(editing) : form.dataset.create;
      await api(path, { method, body: JSON.stringify(body) });
      resetForm(form);
      await load();
      showStatus("Saved successfully.", true);
    }

    async function deleteItem(path, label) {
      if (!confirm("Delete " + label + "? This will hide it from the app.")) return;
      await api(path, { method: "DELETE" });
      await load();
      showStatus("Deleted successfully.", true);
    }

    function optionTarget(title) {
      const key = title.toLowerCase();
      if (key.includes("ecosystem") || key.includes("business card") || key.includes("b2b") || key.includes("jobs") || key.includes("winner") || key.includes("feed") || key.includes("plans") || key.includes("explanations")) return "ecosystem";
      if (key === "dashboard") return "ecosystem";
      if (key.includes("categor")) return "categories";
      if (key.includes("merchant")) return "merchants";
      if (key.includes("shop") || key.includes("business")) return "businesses";
      if (key.includes("product") || key.includes("specification")) return "products";
      if (key.includes("doctor")) return "doctors";
      if (key.includes("clinic")) return "clinics";
      if (key.includes("deal")) return "deals";
      if (key.includes("offer")) return "offers";
      if (key.includes("image") || key.includes("photo")) return "images";
      if (key.includes("admin access") || key.includes("location") || key.includes("api")) return "settings";
      return "homepage";
    }

    function optionUrl(tabId) {
      return "/admin?view=panel#" + tabId;
    }

    function focusSection(tabId) {
      $$(".sectionFocus").forEach((item) => item.classList.remove("sectionFocus"));
      const section = $("#" + tabId);
      if (!section) return;
      const target = section.querySelector(".workbench") || section.querySelector(".card") || section;
      target.classList.add("sectionFocus");
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = section.querySelector("input, textarea, select, button");
      if (input) setTimeout(() => input.focus({ preventScroll: true }), 250);
      setTimeout(() => target.classList.remove("sectionFocus"), 2200);
    }

    function openOptionTarget(title, action) {
      const target = optionTarget(title);
      switchTab(target);
      focusSection(target);
      showStatus(action + " " + title + ": opened the full " + target.replace("businesses", "shops") + " section.", true);
    }

    function enhanceOptionCards() {
      ["dashboard", "homepage", "ecosystem", "images", "settings"].forEach((sectionId) => {
        $$("#" + sectionId + " .item").forEach((item) => {
          if (item.querySelector(".actions")) return;
          const title = item.querySelector("strong") ? item.querySelector("strong").textContent : "Item";
          const target = optionTarget(title);
          const actions = document.createElement("div");
          actions.className = "actions";
          actions.innerHTML = "<button type='button' data-url='" + optionUrl(target) + "'>Edit</button>";
          actions.querySelector("button").onclick = () => openOptionTarget(title, "Edit");
          item.appendChild(actions);
        });
      });
    }

    function renderBusinessList(catalog) {
      const container = $("#businessList");
      container.innerHTML = "";
      const businesses = Array.isArray(catalog.all) ? catalog.all : [];
      if (!businesses.length) return empty(container, "No shops added yet. Add a shop from the form to show it in admin, Flutter, and web.");
      businesses.forEach((business) => {
        renderItem(container, {
          title: business.name,
          meta: business.category.name + " / " + business.slug + " / " + (business.address.area || "Kozhikode"),
          image: business.thumbnailUrl || business.logoUrl,
          tags: (business.tags || []).join(" "),
          badges: [
            business.flags && business.flags.featured ? "Featured" : "",
            business.flags && business.flags.popular ? "Popular" : "",
            business.badge && business.badge.text ? business.badge.text : ""
          ].filter(Boolean),
          details: [
            "Phone: " + (business.contact.phone || "Not set"),
            "WhatsApp: " + (business.contact.whatsapp || "Not set"),
            "Email: " + (business.contact.email || "Not set"),
            "Address: " + (business.address.label || business.address.area || "Not set")
          ],
          onEdit: () => fillForm($("#businesses form"), {
            name: business.name,
            slug: business.slug,
            categorySlug: business.category.slug,
            shortDescription: business.shortDescription,
            area: business.address.area,
            addressLabel: business.address.label,
            phone: business.contact.phone,
            whatsapp: business.contact.whatsapp,
            email: business.contact.email,
            website: business.contact.website,
            thumbnailUrl: business.thumbnailUrl,
            tags: business.tags || [],
            isFeatured: business.flags.featured,
            isPopular: business.flags.popular,
            badgeText: business.badge && business.badge.text,
            badgeColor: business.badge && business.badge.color
          }),
          onDelete: () => deleteItem("/api/admin/businesses/" + encodeURIComponent(business.slug), business.name)
        });
      });
    }

    function renderMerchantList(merchants) {
      const container = $("#merchantList");
      container.innerHTML = "";
      const merchantItems = Array.isArray(merchants.merchants) ? merchants.merchants : [];
      if (!merchantItems.length) return empty(container, "No merchant accounts yet. Merchant signups will appear here.");
      merchantItems.forEach((merchant) => {
        renderItem(container, {
          title: merchant.ownerName || merchant.email,
          meta: merchant.businessName + " / " + merchant.businessSlug + " / " + merchant.categoryName,
          image: "",
          tags: [merchant.email, merchant.phone, merchant.purpose, merchant.businessName, merchant.businessSlug].filter(Boolean).join(" "),
          badges: [
            merchant.isActive ? "Active" : "Removed",
            merchant.purpose || "Merchant",
            merchant.phone || "No phone"
          ].filter(Boolean),
          details: [
            "Email: " + merchant.email,
            "Shop: " + merchant.businessName,
            "Created: " + (merchant.createdAt || "Not available"),
            "Removal disables merchant login only"
          ],
          onEdit: () => {
            switchTab("businesses");
            const business = (lastLoaded.catalog.all || []).find((item) => item.slug === merchant.businessSlug);
            if (business) fillForm($("#businesses form"), businessFormData(business));
            showStatus("Opened the linked shop. Use Remove merchant to disable merchant access.", true);
          },
          onDelete: () => deleteItem("/api/admin/merchants/" + encodeURIComponent(merchant.id), merchant.ownerName || merchant.email)
        });
      });
    }

    function renderCategoryList(catalog) {
      const container = $("#categoryList");
      container.innerHTML = "";
      const categories = mergeSharedCategories(catalog.categories);
      if (!categories.length) return empty(container, "No categories added yet.");
      categories.forEach((category) => {
        renderItem(container, {
          title: category.name,
          meta: category.slug + " / sort " + category.sortOrder,
          image: "",
          tags: category.icon,
          badges: [
            category.icon,
            category.isActive ? "Active" : "Hidden",
            category.seedOnly ? "Needs save" : "",
            (category.shopCount || 0) + " shops",
            (category.subcategoryCount || 0) + " subcategories",
            (category.productCount || 0) + " products"
          ].filter(Boolean),
          details: [
            "Color: " + category.accentColor,
            "Slug: " + category.slug,
            "Customize: name, icon, color, order, active"
          ],
          onEdit: () => {
            selectCategory(category.slug);
            fillForm($("#categories form"), category);
            if (category.seedOnly) {
              $("#categories form").dataset.editing = "";
              $("#categoryMode").textContent = "New from shared category";
            }
          },
          onDelete: () => deleteItem("/api/admin/categories/" + encodeURIComponent(category.slug), category.name)
        });
      });
    }

    function categoryMetrics(category, catalog, products) {
      const shops = (catalog.all || []).filter((business) => business.category && business.category.slug === category.slug);
      const categoryProducts = (products.products || []).filter((product) => product.categorySlug === category.slug);
      const subcategories = new Set(categoryProducts.map((product) => product.subcategorySlug || category.slug).filter(Boolean));
      return { shops:shops, products:categoryProducts, subcategories:subcategories };
    }

    function selectedCategory(catalog) {
      const categories = mergeSharedCategories(catalog.categories || []);
      if (!selectedCategorySlug && categories.length) selectedCategorySlug = categories[0].slug;
      return categories.find((category) => category.slug === selectedCategorySlug) || categories[0] || null;
    }

    function renderSelectedCategoryPanel(catalog, products) {
      const category = selectedCategory(catalog);
      if (!category) {
        $("#selectedCategoryName").textContent = "Select category";
        $("#selectedCategorySlug").textContent = "Pick a category to manage its shops, products, and subcategories.";
        $("#selectedCategoryStatus").textContent = "Ready";
        $("#selectedCategoryShops").textContent = "0";
        $("#selectedCategorySubcategories").textContent = "0";
        $("#selectedCategoryProducts").textContent = "0";
        $("#selectedCategorySort").textContent = "0";
        $("#openSelectedCategoryApi").href = "/api/catalog";
        return;
      }
      const metrics = categoryMetrics(category, catalog, products);
      $("#selectedCategoryName").textContent = category.name;
      $("#selectedCategorySlug").textContent = category.slug + " / " + (category.icon || "category") + " / " + (category.accentColor || "#0B2F74");
      $("#selectedCategoryStatus").textContent = category.isActive ? "Live in app" : "Hidden";
      $("#selectedCategoryShops").textContent = metrics.shops.length;
      $("#selectedCategorySubcategories").textContent = metrics.subcategories.size;
      $("#selectedCategoryProducts").textContent = metrics.products.length;
      $("#selectedCategorySort").textContent = category.sortOrder || 0;
      $("#openSelectedCategoryApi").href = "/api/catalog?category=" + encodeURIComponent(category.slug);
    }

    function selectCategory(slug) {
      selectedCategorySlug = slug || selectedCategorySlug;
      renderSelectedCategoryPanel(lastLoaded.catalog, lastLoaded.products);
      renderCategoryTree(lastLoaded.catalog, lastLoaded.products);
    }

    function editSelectedCategory() {
      const category = selectedCategory(lastLoaded.catalog);
      if (!category) return showStatus("No category selected.", false);
      switchTab("categories");
      fillForm($("#categories form"), category);
      if (category.seedOnly) {
        $("#categories form").dataset.editing = "";
        $("#categoryMode").textContent = "New from shared category";
      }
    }

    function addShopForSelectedCategory() {
      const category = selectedCategory(lastLoaded.catalog);
      if (!category) return showStatus("No category selected.", false);
      switchTab("businesses");
      resetForm($("#businesses form"));
      $("#businesses form").elements.categorySlug.value = category.slug;
      showStatus("Shop form is ready for " + category.name + ".", true);
    }

    function addProductForSelectedCategory() {
      const category = selectedCategory(lastLoaded.catalog);
      if (!category) return showStatus("No category selected.", false);
      switchTab("products");
      resetForm($("#products form"));
      $("#products form").elements.categorySlug.value = category.slug;
      $("#products form").elements.subcategorySlug.value = category.slug;
      showStatus("Product form is ready. Change subcategory slug to create a new subcategory.", true);
    }

    function productFormData(product) {
      return {
        name: product.name,
        slug: product.slug,
        businessSlug: product.businessSlug,
        categorySlug: product.categorySlug,
        subcategorySlug: product.subcategorySlug,
        shortDescription: product.shortDescription,
        imageUrl: product.imageUrl,
        galleryUrls: product.galleryUrls || [],
        unit: product.unit,
        price: product.price,
        oldPrice: product.oldPrice,
        discountText: product.discountText,
        brand: product.brand,
        productType: product.productType,
        organic: product.organic,
        formFactor: product.formFactor,
        shelfLife: product.shelfLife,
        isPerishable: product.isPerishable,
        foodType: product.foodType,
        origin: product.origin,
        packaging: product.packaging,
        tags: product.tags || [],
        isActive: product.isActive,
        sortOrder: product.sortOrder
      };
    }

    function businessFormData(business) {
      return {
        name: business.name,
        slug: business.slug,
        categorySlug: business.category.slug,
        shortDescription: business.shortDescription,
        area: business.address.area,
        addressLabel: business.address.label,
        phone: business.contact.phone,
        whatsapp: business.contact.whatsapp,
        email: business.contact.email,
        website: business.contact.website,
        thumbnailUrl: business.thumbnailUrl,
        tags: business.tags || [],
        isFeatured: business.flags.featured,
        isPopular: business.flags.popular,
        badgeText: business.badge && business.badge.text,
        badgeColor: business.badge && business.badge.color
      };
    }

    function renderCategoryTree(catalog, products) {
      const container = $("#categoryTree");
      container.innerHTML = "";
      const categories = Array.isArray(catalog.categories) ? catalog.categories : [];
      if (!categories.length) return empty(container, "No category structure available.");
      if (!selectedCategorySlug) selectedCategorySlug = categories[0].slug;

      categories.forEach((category) => {
        const shops = (catalog.all || []).filter((business) => business.category && business.category.slug === category.slug);
        const categoryProducts = (products.products || []).filter((product) => product.categorySlug === category.slug);
        const subcategoryMap = new Map();
        categoryProducts.forEach((product) => {
          const slug = product.subcategorySlug || category.slug;
          if (!subcategoryMap.has(slug)) subcategoryMap.set(slug, []);
          subcategoryMap.get(slug).push(product);
        });

        const detail = document.createElement("details");
        detail.className = "treeCategory";
        if (category.slug === selectedCategorySlug) detail.classList.add("active");
        detail.open = category.slug === selectedCategorySlug || shops.length > 0 || categoryProducts.length > 0;
        detail.dataset.search = [
          category.name,
          category.slug,
          shops.map((shop) => shop.name).join(" "),
          categoryProducts.map((product) => product.name + " " + product.subcategorySlug).join(" ")
        ].join(" ").toLowerCase();
        detail.innerHTML =
          "<summary>" +
            "<div class='treeTitle'><span class='colorDot' style='background:" + escapeAttr(category.accentColor || "#0B2F74") + "'></span><div><strong>" + escapeText(category.name) + "</strong><small>" + escapeText(category.slug) + " / " + (category.isActive ? "Active" : "Hidden") + "</small></div></div>" +
            "<div class='badges'><span class='badge'>" + shops.length + " shops</span><span class='badge'>" + subcategoryMap.size + " subcategories</span><span class='badge'>" + categoryProducts.length + " products</span></div>" +
          "</summary><div class='treeBody'></div>";
        detail.querySelector("summary").addEventListener("click", () => {
          selectedCategorySlug = category.slug;
          window.setTimeout(() => {
            renderSelectedCategoryPanel(lastLoaded.catalog, lastLoaded.products);
            renderCategoryTree(lastLoaded.catalog, lastLoaded.products);
          }, 0);
        });
        const body = detail.querySelector(".treeBody");
        const actionRow = document.createElement("div");
        actionRow.className = "treeActionRow";
        actionRow.innerHTML =
          "<button type='button' class='secondary'>Edit category</button>" +
          "<button type='button' class='ghost'>Add shop</button>" +
          "<button type='button' class='ghost'>Add product / subcategory</button>";
        actionRow.children[0].onclick = () => {
          selectedCategorySlug = category.slug;
          editSelectedCategory();
        };
        actionRow.children[1].onclick = () => {
          selectedCategorySlug = category.slug;
          addShopForSelectedCategory();
        };
        actionRow.children[2].onclick = () => {
          selectedCategorySlug = category.slug;
          addProductForSelectedCategory();
        };
        body.appendChild(actionRow);
        body.appendChild(treeGroup("Shops in this category", shops, (shop) => ({
          title: shop.name,
          meta: [shop.slug, shop.address && shop.address.area, shop.contact && shop.contact.phone].filter(Boolean).join(" / "),
          button: "Edit shop",
          onClick: () => {
            switchTab("businesses");
            fillForm($("#businesses form"), businessFormData(shop));
          }
        })));
        Array.from(subcategoryMap.entries()).sort(([left], [right]) => left.localeCompare(right)).forEach(([slug, items]) => {
          body.appendChild(treeGroup("Subcategory: " + slug, items, (product) => ({
            title: product.name,
            meta: [product.slug, product.businessSlug, product.unit, product.price ? "Rs" + product.price : ""].filter(Boolean).join(" / "),
            button: "Edit product",
            onClick: () => {
              switchTab("products");
              fillForm($("#products form"), productFormData(product));
            }
          })));
        });
        container.appendChild(detail);
      });
    }

    function treeGroup(title, items, mapper) {
      const group = document.createElement("div");
      group.className = "treeGroup";
      group.innerHTML = "<h4></h4><div class='miniList'></div>";
      group.querySelector("h4").textContent = title;
      const list = group.querySelector(".miniList");
      if (!items.length) {
        list.innerHTML = "<div class='empty'>Nothing added yet.</div>";
        return group;
      }
      items.forEach((item) => {
        const mapped = mapper(item);
        const row = document.createElement("div");
        row.className = "miniItem";
        row.innerHTML = "<div><strong></strong><small></small></div><button type='button'></button>";
        row.querySelector("strong").textContent = mapped.title;
        row.querySelector("small").textContent = mapped.meta;
        row.querySelector("button").textContent = mapped.button;
        row.querySelector("button").onclick = mapped.onClick;
        list.appendChild(row);
      });
      return group;
    }

    function renderProductList(products) {
      const container = $("#productList");
      container.innerHTML = "";
      const productItems = Array.isArray(products.products) ? products.products : [];
      if (!productItems.length) return empty(container, "No products added yet. Add products from the form to show them in Flutter and web.");
      productItems.forEach((product) => {
        const businessName = product.business && product.business.name ? product.business.name : product.businessSlug;
        renderItem(container, {
          title: product.name,
          meta: product.categorySlug + " / " + product.subcategorySlug + " / " + businessName,
          image: product.imageUrl,
          tags: (product.tags || []).join(" "),
          badges: [
            product.discountText || "",
            product.unit || "1 kg",
            product.price ? "Rs" + product.price : "",
            product.isActive ? "Active" : "Hidden"
          ].filter(Boolean),
          details: [
            "Brand: " + (product.brand || "Local shop"),
            "Type: " + (product.productType || "Not set"),
            "Origin: " + (product.origin || "Not set"),
            "Gallery: " + ((product.galleryUrls || []).length || 0) + " images"
          ],
          onEdit: () => fillForm($("#products form"), productFormData(product)),
          onDelete: () => deleteItem("/api/admin/products/" + encodeURIComponent(product.slug), product.name)
        });
      });
    }

    function renderClinicList(clinics) {
      const container = $("#clinicList");
      container.innerHTML = "";
      if (!clinics.clinics.length) return empty(container, "No clinics added yet.");
      clinics.clinics.forEach((clinic) => {
        renderItem(container, {
          title: clinic.name,
          meta: clinic.slug + " / " + clinic.distanceKm + " km / " + (clinic.address.area || "Kozhikode"),
          image: clinic.imageUrl,
          tags: clinic.address.label,
          badges: [(clinic.doctors || []).length + " doctors", clinic.phone || "No phone"],
          onEdit: () => fillForm($("#clinics form"), {
            name: clinic.name,
            slug: clinic.slug,
            imageUrl: clinic.imageUrl,
            phone: clinic.phone,
            whatsapp: clinic.whatsapp,
            area: clinic.address.area,
            city: clinic.address.city,
            addressLabel: clinic.address.label,
            distanceKm: clinic.distanceKm,
            isActive: true
          }),
          onDelete: () => deleteItem("/api/admin/clinics/" + encodeURIComponent(clinic.slug), clinic.name)
        });
      });
    }

    function doctorsFromClinics(clinics) {
      return clinics.clinics.flatMap((clinic) => {
        return (clinic.doctors || []).map((doctor) => ({ ...doctor, clinicSlug: clinic.slug, clinicName: clinic.name, clinicDistance: clinic.distanceKm }));
      });
    }

    function renderDoctorList(clinics) {
      const container = $("#doctorList");
      const doctors = doctorsFromClinics(clinics);
      container.innerHTML = "";
      if (!doctors.length) return empty(container, "No doctors added yet.");
      doctors.forEach((doctor) => {
        renderItem(container, {
          title: doctor.name,
          meta: doctor.speciality + " / " + doctor.clinicName + " / " + doctor.fee,
          image: doctor.imageUrl,
          tags: (doctor.services || []).join(" "),
          badges: [doctor.experience, doctor.nextSlot, (doctor.rating ? doctor.rating.average : "4.5") + " rated"],
          onEdit: () => fillForm($("#doctors form"), {
            name: doctor.name,
            slug: doctor.slug,
            clinicSlug: doctor.clinicSlug,
            speciality: doctor.speciality,
            experience: doctor.experience,
            fee: doctor.fee,
            nextSlot: doctor.nextSlot,
            ratingAverage: doctor.rating && doctor.rating.average,
            ratingCount: doctor.rating && doctor.rating.count,
            imageUrl: doctor.imageUrl,
            services: doctor.services || [],
            isActive: true
          }),
          onDelete: () => deleteItem("/api/admin/doctors/" + encodeURIComponent(doctor.slug), doctor.name)
        });
      });
    }

    function renderDealList(deals) {
      const container = $("#dealList");
      container.innerHTML = "";
      if (!deals.deals.length) return empty(container, "No deals added yet.");
      deals.deals.forEach((deal) => {
        const businessName = deal.business && deal.business.name ? deal.business.name : "No shop";
        const businessSlug = deal.business && deal.business.slug ? deal.business.slug : "";
        renderItem(container, {
          title: deal.title,
          meta: deal.code + " / " + businessName + " / " + deal.section,
          image: deal.imageUrl,
          tags: deal.description,
          badges: [deal.isFeatured ? "Featured" : "", deal.section, deal.accentColor].filter(Boolean),
          onEdit: () => fillForm($("#deals form"), {
            title: deal.title,
            slug: deal.slug,
            businessSlug: businessSlug,
            code: deal.code,
            description: deal.description,
            section: deal.section,
            accentColor: deal.accentColor,
            imageUrl: deal.imageUrl,
            isFeatured: deal.isFeatured
          }),
          onDelete: () => deleteItem("/api/admin/deals/" + encodeURIComponent(deal.slug), deal.title)
        });
      });
    }

    function renderOfferList(deals) {
      const container = $("#offerList");
      container.innerHTML = "";
      const offers = deals.deals.filter((deal) => (deal.section || "main").toLowerCase() === "main");
      if (!offers.length) return empty(container, "No offers added yet.");
      offers.forEach((offer) => {
        const businessName = offer.business && offer.business.name ? offer.business.name : "No shop";
        const businessSlug = offer.business && offer.business.slug ? offer.business.slug : "";
        renderItem(container, {
          title: offer.title,
          meta: offer.code + " / " + businessName + " / homepage offer",
          image: offer.imageUrl,
          tags: offer.description,
          badges: [offer.isFeatured ? "Featured" : "", offer.accentColor].filter(Boolean),
          onEdit: () => fillForm($("#offers form"), {
            title: offer.title,
            slug: offer.slug,
            businessSlug: businessSlug,
            code: offer.code,
            description: offer.description,
            section: "main",
            sortOrder: offer.sortOrder,
            accentColor: offer.accentColor,
            imageUrl: offer.imageUrl,
            isFeatured: offer.isFeatured
          }),
          onDelete: () => deleteItem("/api/admin/deals/" + encodeURIComponent(offer.slug), offer.title)
        });
      });
    }

    function updateStats(catalog, clinics, deals, products, merchants) {
      const doctors = doctorsFromClinics(clinics);
      const offers = (deals.deals || []).filter((deal) => (deal.section || "main").toLowerCase() === "main");
      const merchantCount = (merchants.merchants || []).filter((merchant) => merchant.isActive !== false).length;
      const values = {
        navDashboard: (catalog.all || []).length + (catalog.categories || []).length + (clinics.clinics || []).length + doctors.length + (deals.deals || []).length + (products.products || []).length + merchantCount,
        statShops: (catalog.all || []).length,
        statMerchants: merchantCount,
        statProducts: (products.products || []).length,
        statCategories: (catalog.categories || []).length,
        statClinics: (clinics.clinics || []).length,
        statDoctors: doctors.length,
        statDeals: (deals.deals || []).length,
        statOffers: offers.length,
        navShops: (catalog.all || []).length,
        navMerchants: merchantCount,
        navProducts: (products.products || []).length,
        navCategories: (catalog.categories || []).length,
        navClinics: (clinics.clinics || []).length,
        navDoctors: doctors.length,
        navDeals: (deals.deals || []).length,
        navOffers: offers.length,
        navHomepage: 7,
        navEcosystem: 10,
        navImages: (catalog.all || []).length + (clinics.clinics || []).length + doctors.length + (deals.deals || []).length + (products.products || []).length,
        navSettings: 18
      };
      Object.entries(values).forEach(([id, value]) => { $("#" + id).textContent = value; });
    }

    function normalizeLoaded(catalog, clinics, deals, products, merchants) {
      catalog.categories = mergeSharedCategories(Array.isArray(catalog.categories) ? catalog.categories : []);
      catalog.all = Array.isArray(catalog.all) ? catalog.all : [];
      catalog.featured = Array.isArray(catalog.featured) ? catalog.featured : [];
      catalog.popular = Array.isArray(catalog.popular) ? catalog.popular : [];
      clinics.clinics = Array.isArray(clinics.clinics) ? clinics.clinics : [];
      deals.deals = Array.isArray(deals.deals) ? deals.deals : [];
      products.products = Array.isArray(products.products) ? products.products : [];
      merchants.merchants = Array.isArray(merchants.merchants) ? merchants.merchants : [];

      catalog.categories = catalog.categories.map((category) => {
        const shops = catalog.all.filter((business) => business.category && business.category.slug === category.slug);
        const categoryProducts = products.products.filter((product) => product.categorySlug === category.slug);
        const subcategories = new Set(categoryProducts.map((product) => product.subcategorySlug || category.slug));
        return {
          ...category,
          shopCount: shops.length,
          productCount: categoryProducts.length,
          subcategoryCount: subcategories.size
        };
      });

      return { catalog, clinics, deals, products, merchants };
    }

    function populateSettingsForm(settings) {
      const form = $("#settingsForm");
      if (!form || !settings) return;
      Object.entries(settings).forEach(([key, value]) => {
        const input = form.elements[key];
        if (!input) return;
        if (input.type === "checkbox") {
          input.checked = Boolean(value);
        } else {
          input.value = value == null ? "" : value;
        }
      });
    }

    async function loadSettings() {
      const data = await fetch("/api/app-settings").then((res) => res.json());
      lastLoaded.settings = data.settings;
      populateSettingsForm(data.settings);
      return data.settings;
    }

    async function saveSettings() {
      const form = $("#settingsForm");
      const payload = formObject(form);
      payload.updateIntervalSeconds = Number(payload.updateIntervalSeconds || 30);
      payload.enableDeals = Boolean(payload.enableDeals);
      payload.enableDoctorBookings = Boolean(payload.enableDoctorBookings);
      const data = await api("/api/admin/app-settings", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      lastLoaded.settings = data.settings;
      populateSettingsForm(data.settings);
      showStatus("Settings saved. Flutter and web will refresh automatically.", true);
    }

    async function load() {
      const [catalog, clinics, deals, products, settings, merchants] = await Promise.all([
        fetch("/api/catalog?includeInactive=true").then((res) => res.json()),
        fetch("/api/clinics").then((res) => res.json()),
        fetch("/api/deals").then((res) => res.json()),
        fetch("/api/products?includeInactive=true").then((res) => res.json()),
        fetch("/api/app-settings").then((res) => res.json()),
        api("/api/admin/merchants?includeInactive=true", { method:"GET" })
      ]);
      const normalized = normalizeLoaded(catalog, clinics, deals, products, merchants);
      lastLoaded = { ...normalized, settings:settings.settings };
      populateSettingsForm(settings.settings);
      updateStats(normalized.catalog, normalized.clinics, normalized.deals, normalized.products, normalized.merchants);
      renderBusinessList(normalized.catalog);
      renderMerchantList(normalized.merchants);
      renderCategoryList(normalized.catalog);
      renderSelectedCategoryPanel(normalized.catalog, normalized.products);
      renderCategoryTree(normalized.catalog, normalized.products);
      renderProductList(normalized.products);
      renderClinicList(normalized.clinics);
      renderDoctorList(normalized.clinics);
      renderDealList(normalized.deals);
      renderOfferList(normalized.deals);
    }

    $$(".nav button").forEach((button) => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    $("#editSelectedCategory").addEventListener("click", editSelectedCategory);
    $("#addShopForSelectedCategory").addEventListener("click", addShopForSelectedCategory);
    $("#addProductForSelectedCategory").addEventListener("click", addProductForSelectedCategory);

    enhanceOptionCards();
    if (location.hash) {
      switchTab(location.hash.replace("#", ""), false);
    }

    $$("form[data-create]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          await submitForm(form);
        } catch (error) {
          showStatus(error.message, false);
        }
      });
    });

    $$("[data-reset]").forEach((button) => {
      button.addEventListener("click", () => resetForm(button.closest("form")));
    });

    $$(".searchInput").forEach((input) => {
      input.addEventListener("input", () => {
        const term = input.value.trim().toLowerCase();
        const list = $("#" + input.dataset.filter);
        Array.from(list.children).forEach((child) => {
          if (!child.classList.contains("item") && !child.classList.contains("treeCategory")) return;
          child.style.display = child.dataset.search.includes(term) ? "" : "none";
        });
      });
    });

    $("#refreshBtn").addEventListener("click", async () => {
      try {
        await load();
        showStatus("Data refreshed.", true);
      } catch (error) {
        showStatus(error.message, false);
      }
    });

    $("#clearBtn").addEventListener("click", () => {
      const active = $(".tab.active form");
      if (active) resetForm(active);
    });

    $("#settingsForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveSettings();
      } catch (error) {
        showStatus(error.message, false);
      }
    });

    $("#reloadSettingsBtn").addEventListener("click", async () => {
      try {
        await loadSettings();
        showStatus("Settings reloaded.", true);
      } catch (error) {
        showStatus(error.message, false);
      }
    });

    load().catch((error) => showStatus(error.message, false));
  </script>
</body>
</html>`
