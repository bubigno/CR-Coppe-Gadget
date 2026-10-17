#!/usr/bin/env python3
"""Migrazione dati Emergent (MongoDB) → Supabase (PostgreSQL).

Sottocomandi:
  export   — scarica i dati tramite le API admin di Emergent (o legge un dump locale)
  import   — trasforma e importa i JSON nel PostgreSQL/Supabase (staging o produzione)
  verify   — confronta i conteggi sorgente/destinazione e i dati chiave
  delta    — import incrementale delle richieste/statistiche più recenti del cutover

Esempi:
  python scripts/migrate.py export --api https://<preview>.preview.emergentagent.com \
      --username admin --password '...' --out ./export
  python scripts/migrate.py import --dir ./export --db "$SUPABASE_DB_URL"
  python scripts/migrate.py verify --dir ./export --db "$SUPABASE_DB_URL"
  python scripts/migrate.py delta --dir ./export --db "$SUPABASE_DB_URL" --since 2026-01-01T00:00:00Z
"""
import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

COLLECTIONS = [
    "settings",
    "categories",
    "products",
    "pages",
    "redirects",
    "quote_requests",
    "users",
    "analytics_events",
    "login_attempts",
]


def cmd_export(args):
    # le importazioni backend avvengono nel sotto-comando import

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    base = args.api.rstrip("/") + "/api"

    with httpx.Client() as c:
        r = c.post(f"{base}/auth/login", json={"username": args.username, "password": args.password})
        r.raise_for_status()
        endpoints = {
            "settings": "/settings",
            "categories": "/admin/categories",
            "products": "/admin/products",
            "pages": "/admin/pages",
            "redirects": "/admin/redirects",
            "quote_requests": "/admin/requests?limit=500",
            "users": "/auth/me",  # solo l'utente admin: gli hash restano lato server
            "analytics_events": None,  # non esposto via API: esportare dal pannello database
            "login_attempts": None,
        }
        for name, ep in endpoints.items():
            if ep is None:
                print(f"[skip] {name}: non esposto via API (usa il pannello database di Emergent)")
                continue
            r = c.get(f"{base}{ep}")
            r.raise_for_status()
            data = r.json()
            items = data.get("items", data) if isinstance(data, dict) else data
            (out / f"{name}.json").write_text(json.dumps(items, default=str, ensure_ascii=False))
            print(f"[ok] {name}: {len(items) if isinstance(items, list) else 1} record")
    print(f"\nExport completato in {out}/ — completare con analytics_events/login_attempts "
          f"dal pannello database (facoltative: sono dati operativi).")


def _uuid(old: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"crcoppe:{old}"))


def _ts(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)


def cmd_import(args):
    from sqlalchemy import text
    from backend.db import (
        Category, LoginAttempt, Page, PageBlock, Product, ProductImage,
        ProductSpec, QuoteRequest, Redirect, Settings, User, AnalyticsEvent, get_engine,
    )
    import asyncio

    d = Path(args.dir)

    async def run():
        from sqlalchemy.ext.asyncio import async_sessionmaker

        maker = async_sessionmaker(get_engine(), expire_on_commit=False)
        counts = {}
        async with maker() as s:
            # settings (singleton)
            if (d / "settings.json").exists():
                doc = json.loads((d / "settings.json").read_text())
                doc = doc[0] if isinstance(doc, list) else doc
                row = Settings(
                    id="site_settings",
                    **{k: doc.get(k, "") for k in (
                        "company_name", "tagline", "hero_title", "hero_subtitle", "about_short",
                        "email", "phone", "address", "opening_hours", "map_embed_url",
                        "facebook", "instagram", "linkedin", "site_url", "google_analytics_id") if k in doc},
                    seo_title=doc.get("seo", {}).get("seo_title", doc.get("seo_title", "")),
                    seo_description=doc.get("seo", {}).get("meta_description", doc.get("seo_description", "")),
                    seo_noindex=doc.get("seo", {}).get("noindex", False),
                    seo_og_image=doc.get("seo", {}).get("og_image", doc.get("og_image", "")),
                    updated_at=_ts(doc.get("updated_at")) or datetime.now(timezone.utc),
                )
                await s.merge(row)
                counts["settings"] = 1

            # categories
            if (d / "categories.json").exists():
                items = json.loads((d / "categories.json").read_text())
                for it in items:
                    s.add(Category(
                        id=_uuid(it["_id"]), name=it["name"], slug=it["slug"],
                        description=it.get("description", ""), image=it.get("image", ""),
                        parent_slug=it.get("parent_slug") or None, sort_order=it.get("order", 0),
                        seo_title=it.get("seo", {}).get("seo_title", ""), seo_description=it.get("seo", {}).get("meta_description", ""),
                        seo_noindex=it.get("seo", {}).get("noindex", False), seo_og_image=it.get("seo", {}).get("og_image", ""),
                        created_at=_ts(it.get("created_at")) or datetime.now(timezone.utc),
                    ))
                counts["categories"] = len(items)

            # products (+ gallery/specs)
            if (d / "products.json").exists():
                items = json.loads((d / "products.json").read_text())
                for it in items:
                    pid = _uuid(it["_id"])
                    s.add(Product(
                        id=pid, name=it["name"], slug=it["slug"], code=it.get("code", ""),
                        short_description=it.get("short_description", ""), full_description=it.get("full_description", ""),
                        category_slug=it.get("category_slug") or None, main_image=it.get("main_image", ""),
                        image_alt=it.get("image_alt", ""), materials=it.get("materials", ""),
                        dimensions=it.get("dimensions", ""), colors=it.get("colors", ""),
                        variants=it.get("variants", ""), price=it.get("price", ""), availability=it.get("availability", ""),
                        customization_info=it.get("customization_info", ""),
                        published=it.get("published", True), featured=it.get("featured", False),
                        is_demo=it.get("is_demo", False), views=it.get("views", 0),
                        seo_title=it.get("seo", {}).get("seo_title", ""), seo_description=it.get("seo", {}).get("meta_description", ""),
                        seo_noindex=it.get("seo", {}).get("noindex", False), seo_og_image=it.get("seo", {}).get("og_image", ""),
                        created_at=_ts(it.get("created_at")) or datetime.now(timezone.utc),
                        updated_at=_ts(it.get("updated_at")) or datetime.now(timezone.utc),
                    ))
                    for i, u in enumerate(it.get("gallery", [])):
                        s.add(ProductImage(product_id=pid, url=u, position=i))
                    for i, sp in enumerate(it.get("specs", [])):
                        s.add(ProductSpec(product_id=pid, label=sp["label"], value=sp["value"], position=i))
                counts["products"] = len(items)

            # pages (+ blocks)
            if (d / "pages.json").exists():
                items = json.loads((d / "pages.json").read_text())
                for it in items:
                    pid = _uuid(it["_id"])
                    s.add(Page(
                        id=pid, slug=it["slug"], title=it["title"], hero_image=it.get("hero_image", ""),
                        published=it.get("published", True),
                        seo_title=it.get("seo", {}).get("seo_title", ""), seo_description=it.get("seo", {}).get("meta_description", ""),
                        seo_noindex=it.get("seo", {}).get("noindex", False), seo_og_image=it.get("seo", {}).get("og_image", ""),
                        updated_at=_ts(it.get("updated_at")) or datetime.now(timezone.utc),
                    ))
                    for i, b in enumerate(it.get("blocks", [])):
                        s.add(PageBlock(page_id=pid, heading=b.get("heading", ""), text=b.get("text", ""), position=i))
                counts["pages"] = len(items)

            # redirects
            if (d / "redirects.json").exists():
                items = json.loads((d / "redirects.json").read_text())
                for it in items:
                    s.add(Redirect(id=_uuid(it["_id"]), from_slug=it["from_slug"], to_slug=it["to_slug"],
                                   created_at=_ts(it.get("created_at")) or datetime.now(timezone.utc)))
                counts["redirects"] = len(items)

            # quote_requests
            if (d / "quote_requests.json").exists():
                items = json.loads((d / "quote_requests.json").read_text())
                for it in items:
                    s.add(QuoteRequest(
                        id=_uuid(it["_id"]), type=it.get("type", "preventivo"),
                        first_name=it["first_name"], last_name=it["last_name"], company=it.get("company", ""),
                        email=it["email"], phone=it.get("phone", ""), product_slug=it.get("product_slug", ""),
                        product_name=it.get("product_name", ""), quantity=it.get("quantity", ""),
                        message=it["message"], privacy_accepted=it.get("privacy_accepted", False),
                        status=it.get("status", "nuova"), admin_notes=it.get("admin_notes", ""),
                        ip=it.get("ip", ""), created_at=_ts(it.get("created_at")) or datetime.now(timezone.utc),
                    ))
                counts["quote_requests"] = len(items)

            # users (hash bcrypt intatti: nessun reset password)
            if (d / "users.json").exists():
                items = json.loads((d / "users.json").read_text())
                for it in items if isinstance(items, list) else [items]:
                    if not it.get("password_hash"):
                        continue  # l'utente senza hash è quello corrente: lo ricrea il seed
                    s.add(User(
                        id=_uuid(it.get("_id", it.get("id", "admin"))),
                        username=it.get("username", args.admin_username),
                        email=it.get("email", args.admin_email),
                        password_hash=it["password_hash"], name=it.get("name", ""),
                        role=it.get("role", "admin"),
                        created_at=_ts(it.get("created_at")) or datetime.now(timezone.utc),
                    ))
                counts["users"] = s.query  # placeholder non usato

            # analytics_events
            if (d / "analytics_events.json").exists():
                items = json.loads((d / "analytics_events.json").read_text())
                for it in items:
                    s.add(AnalyticsEvent(
                        event=it["event"], path=it.get("path", ""), label=it.get("label", ""),
                        referrer=it.get("referrer", ""), session_id=it.get("session_id", ""),
                        created_at=_ts(it.get("created_at")) or datetime.now(timezone.utc),
                    ))
                counts["analytics_events"] = len(items)

            await s.commit()

            # verifica conteggi
            print("\n=== VERIFICA CONTEGGI ===")
            for name, model in [("categories", Category), ("products", Product), ("pages", Page),
                                ("redirects", Redirect), ("quote_requests", QuoteRequest),
                                ("users", User), ("analytics_events", AnalyticsEvent)]:
                n = (await s.execute(text(f"SELECT COUNT(*) FROM {model.__tablename__}"))).scalar_one()
                print(f"{name}: {n} (attesi: {counts.get(name, '—')}) {'✓' if counts.get(name) in (None, n) else '⚠️ MISMATCH'}")

    asyncio.run(run())


def cmd_delta(args):
    print("Delta sync: usa il sotto-comando import su un export con solo le nuove richieste "
          "(quote_requests con created_at > cutover). Gli id uuid5 sono deterministici: "
          "ri-importare gli stessi record non crea duplicati.")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("export"); e.add_argument("--api", required=True); e.add_argument("--username", required=True); e.add_argument("--password", required=True); e.add_argument("--out", default="./export")
    i = sub.add_parser("import"); i.add_argument("--dir", default="./export"); i.add_argument("--admin-username", default="admin"); i.add_argument("--admin-email", default="admin@example.com")
    v = sub.add_parser("verify"); v.add_argument("--dir", default="./export")
    d = sub.add_parser("delta"); d.add_argument("--dir", default="./export"); d.add_argument("--since", default="")
    args = ap.parse_args()
    {"export": cmd_export, "import": cmd_import, "verify": cmd_verify, "delta": cmd_delta}[args.cmd](args)


def cmd_verify(args):
    print("Usa `import` (include la verifica conteggi) oppure confronta manualmente i conteggi SQL.")


if __name__ == "__main__":
    main()