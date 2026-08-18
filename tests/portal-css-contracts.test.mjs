import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const globals = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("shared portal controls have real layout primitives", () => {
  for (const selector of [
    ".admin-modal-backdrop",
    ".admin-modal",
    ".admin-dashboard-shell .manager-table-card > header",
    ".status-pill",
    ".admin-back-link",
  ]) {
    assert.ok(globals.includes(selector), `Missing shared portal selector: ${selector}`);
  }

  assert.match(globals, /\.admin-modal-backdrop\s*\{[^}]*position:\s*fixed/s);
  assert.match(globals, /\.admin-modal\s*\{[^}]*max-height:/s);
});

test("admin and merchant shells collapse into off-canvas mobile navigation", () => {
  assert.match(globals, /@media \(max-width: 920px\)[\s\S]*?\.business-dashboard-shell \.dashboard-sidebar\s*\{[^}]*position:\s*fixed[^}]*left:\s*-292px/);
  assert.match(globals, /@media \(max-width: 920px\)[\s\S]*?\.admin-dashboard-shell \.dashboard-sidebar\s*\{[^}]*position:\s*fixed[^}]*left:\s*-292px/);
  assert.match(globals, /@media \(max-width: 920px\)[\s\S]*?\.business-dashboard-shell \.dashboard-sidebar\.open\s*\{[^}]*left:\s*0/);
  assert.match(globals, /@media \(max-width: 920px\)[\s\S]*?\.admin-dashboard-shell \.dashboard-sidebar\.open\s*\{[^}]*left:\s*0/);
  assert.match(globals, /\.business-dashboard-shell \.dashboard-main\s*\{[^}]*min-width:\s*0/s);
  assert.match(globals, /\.admin-dashboard-shell \.dashboard-main\s*\{[^}]*min-width:\s*0/s);
  assert.match(globals, /@media \(max-width: 680px\)[\s\S]*?\.business-dashboard-shell \.dashboard-page-heading > div:first-child,[\s\S]*?flex:\s*0 1 auto/);
});

test("public and authentication surfaces use bounded mobile widths", () => {
  assert.match(globals, /@media \(max-width: 640px\)[\s\S]*?\.hero-content\s*\{[^}]*width:\s*calc\(100% - 2[68]px\)/);
  assert.match(globals, /@media \(max-width: 680px\)[\s\S]*?\.login-page,[\s\S]*?\.account-page\s*\{[^}]*width:\s*min\(100% - 24px, 1180px\)/);
  assert.match(globals, /@media \(max-width: 680px\)[\s\S]*?\.login-card\s*\{[^}]*padding:\s*27px 20px/);
  assert.match(globals, /\.dashboard-page-heading > div:last-child:not\(:has\(> h1\)\)/);
});
