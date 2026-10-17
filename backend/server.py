import logging
import os
import re
import uuid as uuidlib
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload

from .auth import (
    auth_router,
    client_ip,
    hash_password,
    require_admin,
    verify_password,
)
from .db import (
    AnalyticsEvent,
    Category,
    CategoryData,
    CredentialsUpdate,
    LoginAttempt,
    Page,
    PageBlock,
    PageData,
    Product,
    ProductData,
    ProductImage,
    ProductSpec,
    QuoteRequest,
    QuoteRequestCreate,
    Redirect,
    RedirectCreate,
    RequestUpdate,
    Settings,
    SettingsData,
    TrackEvent,
    User,
    category_serialize,
    get_sessions,
    new_uuid,
    page_serialize,
    product_serialize,
    request_serialize,
    settings_serialize,
    utcnow,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("crcoppe")

app = FastAPI(title="CR Coppe & Gadget API")
api_router = APIRouter(prefix="/api")

SLUG_RE = re.compile(r"[^a-z0-9]+")
BUCKET = "uploads"


def slugify(text: str) -> str:
    return SLUG_RE.sub("-", (text or "").lower()).strip("-")[:80]


def parse_uuid(value: str) -> str:
    try:
        return str(uuidlib.UUID(str(value)))
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=400, detail="Identificativo non valido")


async def get_settings_row(s):
    row = (await s.execute(select(Settings).where(Settings.id == "site_settings"))).scalar_one_or_none()
    if not row:
        row = Settings(id="site_settings")
        s.add(row)
        await s.commit()
        await s.refresh(row)
    return row


async def category_map(s) -> dict:
    rows = (await s.execute(select(Category.slug, Category.name))).all()
    return {slug: name for slug, name in rows}


async def unique_slug(s, base: str, model, exclude_id=None) -> str:
    slug = slugify(base) or "elemento"
    candidate, i = slug, 1
    while True:
        found = (await s.execute(select(model.id).where(model.slug == candidate))).scalar_one_or_none()
        if not found or (exclude_id is not None and found == exclude_id):
            return candidate
        i += 1
        candidate = f"{slug}-{i}"


# ---------- Pubblico ----------


@app.get("/")
async def root():
    return {"name": "CR Coppe & Gadget API", "status": "ok"}


@api_router.get("/")
async def api_root():
    return {"name": "CR Coppe & Gadget API", "status": "ok"}


@api_router.get("/settings")
async def public_settings():
    async with get_sessions()() as s:
        row = await get_settings_row(s)
        return settings_serialize(row)


@api_router.get("/categories")
async def list_categories():
    async with get_sessions()() as s:
        rows = (await s.execute(select(Category).order_by(Category.sort_order, Category.name))).scalars().all()
        return {"items": [category_serialize(c) for c in rows]}


@api_router.get("/products")
async def list_products(
    category: str = "",
    search: str = "",
    featured: str = "",
    limit: int = 100,
    skip: int = 0,
):
    async with get_sessions()() as s:
        q = select(Product).where(Product.published.is_(True))
        if category:
            q = q.where(Product.category_slug == category)
        if featured == "true":
            q = q.where(Product.featured.is_(True))
        if search.strip():
            like = f"%{search.strip()}%"
            q = q.where(
                or_(
                    Product.name.ilike(like),
                    Product.short_description.ilike(like),
                    Product.full_description.ilike(like),
                    Product.code.ilike(like),
                )
            )
        count_q = select(func.count()).select_from(q.subquery())
        total = (await s.execute(count_q)).scalar_one()
        rows = (
            (await s.execute(q.order_by(Product.featured.desc(), Product.created_at.desc()).offset(max(skip, 0)).limit(min(max(limit, 1), 100))))
            .scalars()
            .unique()
            .all()
        )
        cmap = await category_map(s)
        return {"items": [product_serialize(p, cmap) for p in rows], "total": total}


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    async with get_sessions()() as s:
        redirect = (await s.execute(select(Redirect).where(Redirect.from_slug == slug))).scalar_one_or_none()
        if redirect and redirect.to_slug:
            return RedirectResponse(url=f"/api/products/{redirect.to_slug}", status_code=301)
        p = (await s.execute(select(Product).where(Product.slug == slug))).scalar_one_or_none()
        if not p or not p.published:
            raise HTTPException(status_code=404, detail="Prodotto non trovato")
        if p.published:
            p.views += 1
            await s.commit()
            await s.refresh(p)
        cmap = await category_map(s)
        related = (
            (
                await s.execute(
                    select(Product)
                    .where(Product.category_slug == p.category_slug, Product.slug != slug, Product.published.is_(True))
                    .limit(4)
                )
            )
            .scalars()
            .unique()
            .all()
        )
        return {
            "product": product_serialize(p, cmap),
            "related": [product_serialize(r, cmap) for r in related],
        }


@api_router.get("/pages/{slug}")
async def get_page(slug: str):
    async with get_sessions()() as s:
        pg = (await s.execute(select(Page).where(Page.slug == slug))).scalar_one_or_none()
        if not pg or not pg.published:
            raise HTTPException(status_code=404, detail="Pagina non trovata")
        return page_serialize(pg)


@api_router.post("/quote-requests", status_code=201)
async def create_quote_request(data: QuoteRequestCreate, request: Request):
    if data.website:
        # honeypot: probabilmente un bot, risposta generica senza salvataggio
        return {"ok": True}
    if not data.privacy_accepted:
        raise HTTPException(status_code=400, detail="È necessario accettare l'informativa privacy")
    ip = client_ip(request)
    hour_ago = utcnow() - timedelta(hours=1)

    async with get_sessions()() as s:
        recent = (
            await s.execute(
                select(func.count()).select_from(QuoteRequest).where(QuoteRequest.ip == ip, QuoteRequest.created_at >= hour_ago)
            )
        ).scalar_one()
        if recent >= 5:
            raise HTTPException(status_code=429, detail="Troppe richieste inviate in poco tempo. Riprova più tardi.")
        product_name = ""
        if data.product_slug:
            row = (await s.execute(select(Product.name).where(Product.slug == data.product_slug))).first()
            if row:
                product_name = row[0]
        qr = QuoteRequest(
            **data.model_dump(exclude={"website", "product_name"}),
            product_name=product_name,
            ip=ip,
        )
        s.add(qr)
        await s.commit()
        logger.info(f"Nuova richiesta {qr.type} da {qr.email}")
        return {"ok": True, "id": str(qr.id)}


@api_router.post("/track")
async def track_event(data: TrackEvent):
    if data.path.startswith("/admin"):
        return {"ok": True}
    async with get_sessions()() as s:
        s.add(AnalyticsEvent(**data.model_dump(), created_at=utcnow()))
        await s.commit()
    return {"ok": True}


@api_router.get("/sitemap.xml")
async def sitemap():
    async with get_sessions()() as s:
        row = await get_settings_row(s)
        base = (row.site_url or "").strip().rstrip("/")
        if not base.startswith("http"):
            raise HTTPException(status_code=404, detail="Dominio non configurato: imposta il sito nelle impostazioni SEO")
        urls = ["/", "/catalogo", "/chi-siamo", "/contatti", "/mappa-sito"]
        for slug in (await s.execute(select(Page.slug).where(Page.slug != "chi-siamo"))).all():
            urls.append(f"/informazioni/{slug[0]}")
        for slug in (await s.execute(select(Product.slug).where(Product.published.is_(True)))).all():
            urls.append(f"/prodotti/{slug[0]}")
        for slug in (await s.execute(select(Category.slug))).all():
            urls.append(f"/catalogo?categoria={slug[0]}")
        lastmod = utcnow().date().isoformat()
        xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        for u in urls:
            xml.append(f"<url><loc>{base}{u}</loc><lastmod>{lastmod}</lastmod></url>")
        xml.append("</urlset>")
        return Response(content="\n".join(xml), media_type="application/xml")


# ---------- Amministrazione ----------


@api_router.get("/admin/overview")
async def admin_overview(_: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        now = utcnow()
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        row = await get_settings_row(s)

        async def count(model, *conds):
            q = select(func.count()).select_from(model)
            if conds:
                q = q.where(*conds)
            return (await s.execute(q)).scalar_one()

        return {
            "products": await count(Product),
            "published": await count(Product, Product.published.is_(True)),
            "categories": await count(Category),
            "requests_total": await count(QuoteRequest),
            "requests_new": await count(QuoteRequest, QuoteRequest.status == "nuova"),
            "requests_open": await count(QuoteRequest, QuoteRequest.status.in_(["nuova", "in_lavorazione"])),
            "views_today": await count(AnalyticsEvent, AnalyticsEvent.event == "pageview", AnalyticsEvent.created_at >= day_ago),
            "views_7d": await count(AnalyticsEvent, AnalyticsEvent.event == "pageview", AnalyticsEvent.created_at >= week_ago),
            "ga4_configured": bool((row.google_analytics_id or "").strip()),
        }


@api_router.get("/admin/stats")
async def admin_stats(days: int = 7, _: dict = Depends(require_admin)):
    days = min(max(days, 1), 365)
    since = utcnow() - timedelta(days=days)

    async with get_sessions()() as s:
        base_conds = [AnalyticsEvent.created_at >= since]

        pageviews = (
            await s.execute(
                select(func.count()).select_from(AnalyticsEvent).where(*base_conds, AnalyticsEvent.event == "pageview")
            )
        ).scalar_one()
        sessions = (
            await s.execute(
                select(func.count(func.distinct(AnalyticsEvent.session_id))).where(*base_conds, AnalyticsEvent.event == "pageview")
            )
        ).scalar_one()

        timeseries_rows = (
            await s.execute(
                select(func.to_char(AnalyticsEvent.created_at, "YYYY-MM-DD").label("d"), func.count().label("v"))
                .where(*base_conds, AnalyticsEvent.event == "pageview")
                .group_by("d")
                .order_by("d")
            )
        ).all()
        timeseries = [{"d": r.d, "v": r.v} for r in timeseries_rows]

        top_pages_rows = (
            await s.execute(
                select(AnalyticsEvent.path.label("path"), func.count().label("v"))
                .where(*base_conds, AnalyticsEvent.event == "pageview", AnalyticsEvent.path.notin_(["/admin", "/admin/login"]))
                .group_by(AnalyticsEvent.path)
                .order_by(func.count().desc())
                .limit(8)
            )
        ).all()
        top_pages = [{"path": r.path or "/", "v": r.v} for r in top_pages_rows]

        sources_rows = (
            await s.execute(
                select(func.coalesce(AnalyticsEvent.referrer, "").label("r"), func.count().label("v"))
                .where(*base_conds, AnalyticsEvent.event == "pageview")
                .group_by("r")
                .order_by(func.count().desc())
                .limit(6)
            )
        ).all()
        sources = [{"referrer": r.r or "Diretto", "v": r.v} for r in sources_rows]

        top_products_rows = (await s.execute(select(Product.name, Product.slug, Product.views).order_by(Product.views.desc()).limit(5))).all()
        top_products = [{"name": r[0], "slug": r[1], "views": r[2] or 0} for r in top_products_rows]

        async def req_count(*conds):
            q = select(func.count()).select_from(QuoteRequest).where(QuoteRequest.created_at >= since)
            if conds:
                q = q.where(*conds)
            return (await s.execute(q)).scalar_one()

        return {
            "days": days,
            "pageviews": pageviews,
            "sessions": sessions,
            "timeseries": timeseries,
            "top_pages": top_pages,
            "sources": sources,
            "top_products": top_products,
            "clicks_quote": (await s.execute(select(func.count()).select_from(AnalyticsEvent).where(*base_conds, AnalyticsEvent.event == "click", AnalyticsEvent.label == "quote"))).scalar_one(),
            "clicks_contact": (await s.execute(select(func.count()).select_from(AnalyticsEvent).where(*base_conds, AnalyticsEvent.event == "click", AnalyticsEvent.label == "contact"))).scalar_one(),
            "requests_total": await req_count(),
            "requests_by_status": {
                "nuova": await req_count(QuoteRequest.status == "nuova"),
                "in_lavorazione": await req_count(QuoteRequest.status == "in_lavorazione"),
                "completata": await req_count(QuoteRequest.status == "completata"),
            },
        }


@api_router.get("/admin/products")
async def admin_list_products(_: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        rows = (await s.execute(select(Product).order_by(Product.created_at.desc()))).scalars().unique().all()
        cmap = await category_map(s)
        return {"items": [product_serialize(p, cmap) for p in rows]}


async def write_children(s, product: Product, data):
    s.add_all([ProductImage(product_id=product.id, url=u, position=i) for i, u in enumerate(data.gallery)])
    s.add_all([ProductSpec(product_id=product.id, label=x.label, value=x.value, position=i) for i, x in enumerate(data.specs)])


@api_router.post("/admin/products", status_code=201)
async def admin_create_product(data: ProductData, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        slug = await unique_slug(s, data.slug or data.name, Product)
        values = data.model_dump(exclude={"slug", "seo", "gallery", "specs"})
        if not values.get("category_slug"):
            values["category_slug"] = None  # FK: stringa vuota → NULL (nessuna categoria)
        p = Product(
            **values,
            slug=slug,
            seo_title=data.seo.seo_title,
            seo_description=data.seo.meta_description,
            seo_noindex=data.seo.noindex,
            seo_og_image=data.seo.og_image,
        )
        s.add(p)
        await s.flush()
        await write_children(s, p, data)
        await s.commit()
        await s.refresh(p)
        p = (await s.execute(
            select(Product).options(selectinload(Product.images), selectinload(Product.specs)).where(Product.id == p.id)
        )).scalar_one()
        cmap = await category_map(s)
        return product_serialize(p, cmap)


@api_router.put("/admin/products/{pid}")
async def admin_update_product(pid: str, data: ProductData, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        pid = parse_uuid(pid)
        p = (await s.execute(select(Product).where(Product.id == pid))).scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Prodotto non trovato")
        slug = await unique_slug(s, data.slug or data.name, Product, exclude_id=pid)
        old_slug = p.slug
        values = data.model_dump(exclude={"slug", "seo", "gallery", "specs"})
        if not values.get("category_slug"):
            values["category_slug"] = None  # FK: stringa vuota → NULL
        for k, v in values.items():
            setattr(p, k, v)
        p.slug = slug
        p.seo_title = data.seo.seo_title
        p.seo_description = data.seo.meta_description
        p.seo_noindex = data.seo.noindex
        p.seo_og_image = data.seo.og_image
        p.updated_at = utcnow()
        await s.execute(delete(ProductImage).where(ProductImage.product_id == pid))
        await s.execute(delete(ProductSpec).where(ProductSpec.product_id == pid))
        await write_children(s, p, data)
        if old_slug and old_slug != slug:
            await s.execute(
                pg_insert(Redirect)
                .values(from_slug=old_slug, to_slug=slug)
                .on_conflict_do_update(index_elements=["from_slug"], set_={"to_slug": slug})
            )
        await s.commit()
        p = (await s.execute(
            select(Product).options(selectinload(Product.images), selectinload(Product.specs)).where(Product.id == p.id)
        )).scalar_one()
        cmap = await category_map(s)
        return product_serialize(p, cmap)


@api_router.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        result = await s.execute(delete(Product).where(Product.id == parse_uuid(pid)))
        await s.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Prodotto non trovato")
        return {"ok": True}


@api_router.get("/admin/categories")
async def admin_list_categories(_: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        rows = (await s.execute(select(Category).order_by(Category.sort_order, Category.name))).scalars().all()
        return {"items": [category_serialize(c) for c in rows]}


@api_router.post("/admin/categories", status_code=201)
async def admin_create_category(data: CategoryData, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        slug = await unique_slug(s, data.slug or data.name, Category)
        values = data.model_dump(exclude={"slug", "seo", "order"})
        if not values.get("parent_slug"):
            values["parent_slug"] = None  # FK: stringa vuota → NULL
        c = Category(
            **values,
            slug=slug,
            sort_order=data.order,
            seo_title=data.seo.seo_title,
            seo_description=data.seo.meta_description,
            seo_noindex=data.seo.noindex,
            seo_og_image=data.seo.og_image,
        )
        s.add(c)
        await s.commit()
        return category_serialize(c)


@api_router.put("/admin/categories/{cid}")
async def admin_update_category(cid: str, data: CategoryData, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        cid = parse_uuid(cid)
        c = (await s.execute(select(Category).where(Category.id == cid))).scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=404, detail="Categoria non trovata")
        slug = await unique_slug(s, data.slug or data.name, Category, exclude_id=cid)
        old_slug = c.slug
        values = data.model_dump(exclude={"slug", "seo", "order"})
        if not values.get("parent_slug"):
            values["parent_slug"] = None  # FK: stringa vuota → NULL
        for k, v in values.items():
            setattr(c, k, v)
        c.slug = slug
        c.sort_order = data.order
        c.seo_title = data.seo.seo_title
        c.seo_description = data.seo.meta_description
        c.seo_noindex = data.seo.noindex
        c.seo_og_image = data.seo.og_image
        if old_slug and old_slug != slug:
            await s.execute(update(Product).where(Product.category_slug == old_slug).values(category_slug=slug))
        await s.commit()
        return category_serialize(c)


@api_router.delete("/admin/categories/{cid}")
async def admin_delete_category(cid: str, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        result = await s.execute(delete(Category).where(Category.id == parse_uuid(cid)))
        await s.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Categoria non trovata")
        return {"ok": True}


@api_router.get("/admin/requests")
async def admin_list_requests(
    status: str = "",
    date_from: str = "",
    date_to: str = "",
    limit: int = 200,
    _: dict = Depends(require_admin),
):
    async with get_sessions()() as s:
        q = select(QuoteRequest)
        if status in ("nuova", "in_lavorazione", "completata"):
            q = q.where(QuoteRequest.status == status)
        if date_from:
            try:
                q = q.where(QuoteRequest.created_at >= datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc))
            except ValueError:
                pass
        if date_to:
            try:
                q = q.where(QuoteRequest.created_at <= datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc) + timedelta(days=1))
            except ValueError:
                pass
        rows = (await s.execute(q.order_by(QuoteRequest.created_at.desc()).limit(min(max(limit, 1), 500)))).scalars().all()
        return {"items": [request_serialize(r) for r in rows]}


@api_router.patch("/admin/requests/{rid}")
async def admin_update_request(rid: str, data: RequestUpdate, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        r = (await s.execute(select(QuoteRequest).where(QuoteRequest.id == parse_uuid(rid)))).scalar_one_or_none()
        if not r:
            raise HTTPException(status_code=404, detail="Richiesta non trovata")
        if data.status is not None:
            r.status = data.status
        if data.admin_notes is not None:
            r.admin_notes = data.admin_notes
        await s.commit()
        return request_serialize(r)


@api_router.delete("/admin/requests/{rid}")
async def admin_delete_request(rid: str, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        result = await s.execute(delete(QuoteRequest).where(QuoteRequest.id == parse_uuid(rid)))
        await s.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Richiesta non trovata")
        return {"ok": True}


@api_router.get("/admin/pages")
async def admin_list_pages(_: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        rows = (await s.execute(select(Page).order_by(Page.slug))).scalars().unique().all()
        return {"items": [page_serialize(p) for p in rows]}


@api_router.put("/admin/pages/{slug}")
async def admin_update_page(slug: str, data: PageData, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        slug = slugify(slug)
        pg = (await s.execute(select(Page).where(Page.slug == slug))).scalar_one_or_none()
        if not pg:
            pg = Page(slug=slug)
            s.add(pg)
        pg.title = data.title
        pg.hero_image = data.hero_image
        pg.published = True
        pg.seo_title = data.seo.seo_title
        pg.seo_description = data.seo.meta_description
        pg.seo_noindex = data.seo.noindex
        pg.seo_og_image = data.seo.og_image
        pg.updated_at = utcnow()
        await s.flush()
        await s.execute(delete(PageBlock).where(PageBlock.page_id == pg.id))
        for i, b in enumerate(data.blocks):
            s.add(PageBlock(page_id=pg.id, heading=b.get("heading", ""), text=b.get("text", ""), position=i))
        await s.commit()
        await s.refresh(pg)
        return page_serialize(pg)


@api_router.put("/admin/settings")
async def admin_update_settings(data: SettingsData, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        values = data.model_dump(exclude={"id", "seo", "updated_at"})
        values.update(
            {
                "seo_title": data.seo.seo_title,
                "seo_description": data.seo.meta_description,
                "seo_noindex": data.seo.noindex,
                "seo_og_image": data.seo.og_image,
                "updated_at": utcnow(),
            }
        )
        await s.execute(
            pg_insert(Settings)
            .values(id="site_settings", **values)
            .on_conflict_do_update(index_elements=["id"], set_=values)
        )
        await s.commit()
        row = await get_settings_row(s)
        return settings_serialize(row)


@api_router.get("/admin/redirects")
async def admin_list_redirects(_: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        rows = (await s.execute(select(Redirect).order_by(Redirect.created_at.desc()))).scalars().all()
        return {"items": [{"id": str(r.id), "from_slug": r.from_slug, "to_slug": r.to_slug, "created_at": r.created_at} for r in rows]}


@api_router.post("/admin/redirects", status_code=201)
async def admin_create_redirect(data: RedirectCreate, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        await s.execute(
            pg_insert(Redirect)
            .values(from_slug=slugify(data.from_slug), to_slug=slugify(data.to_slug))
            .on_conflict_do_update(index_elements=["from_slug"], set_={"to_slug": slugify(data.to_slug)})
        )
        await s.commit()
        return {"ok": True}


@api_router.delete("/admin/redirects/{rid}")
async def admin_delete_redirect(rid: str, _: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        await s.execute(delete(Redirect).where(Redirect.id == parse_uuid(rid)))
        await s.commit()
        return {"ok": True}


@api_router.post("/admin/uploads")
async def admin_upload(request: Request, file: UploadFile = File(...), _: dict = Depends(require_admin)):
    from supabase import create_client

    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Sono ammesse solo immagini")
    data = await file.read()
    if len(data) > 4 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File troppo grande (massimo 4MB su Vercel: usa l'upload firmato per file grandi)")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg").lower()[:8]
    path = f"{uuidlib.uuid4().hex}.{ext}"
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    sb.storage.from_(BUCKET).upload(path, data, {"content-type": file.content_type or "image/jpeg"})
    return {"url": sb.storage.from_(BUCKET).get_public_url(path)}


@api_router.post("/admin/uploads/signed")
async def admin_upload_signed(data: dict, _: dict = Depends(require_admin)):
    from supabase import create_client

    filename = str(data.get("filename", "img.jpg"))
    ext = filename.rsplit(".", 1)[-1][:8] if "." in filename else "jpg"
    path = f"{uuidlib.uuid4().hex}.{ext}"
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    res = sb.storage.from_(BUCKET).create_signed_upload_url(path)
    signed = res.get("signed_url") or res.get("signedUrl") if isinstance(res, dict) else str(res)
    return {"url": signed, "path": path, "public_url": sb.storage.from_(BUCKET).get_public_url(path)}


@api_router.post("/admin/credentials")
async def admin_update_credentials(data: CredentialsUpdate, current: dict = Depends(require_admin)):
    async with get_sessions()() as s:
        user = (await s.execute(select(User).where(User.id == parse_uuid(current["id"])))).scalar_one_or_none()
        if not user or not verify_password(data.current_password.strip(), user.password_hash):
            raise HTTPException(status_code=401, detail="Password attuale non corretta")
        update = {}
        if data.new_username and data.new_username.lower().strip() != user.username:
            candidate = data.new_username.lower().strip()
            taken = (await s.execute(select(User.id).where(User.username == candidate))).scalar_one_or_none()
            if taken:
                raise HTTPException(status_code=400, detail="Username già in uso")
            update["username"] = candidate
        if data.new_email and data.new_email.lower().strip() != user.email:
            taken = (await s.execute(select(User.id).where(User.email == data.new_email.lower().strip()))).scalar_one_or_none()
            if taken:
                raise HTTPException(status_code=400, detail="Email già in uso")
            update["email"] = data.new_email.lower().strip()
        if data.new_password:
            update["password_hash"] = hash_password(data.new_password.strip())
        if not update:
            raise HTTPException(status_code=400, detail="Nessuna modifica richiesta: inserisci un nuovo username o una nuova password")
        for k, v in update.items():
            setattr(user, k, v)
        await s.commit()
        return {"id": str(user.id), "username": user.username, "email": user.email, "name": user.name or "", "role": user.role}


app.include_router(auth_router)
app.include_router(api_router)

from starlette.middleware.cors import CORSMiddleware  # noqa: E402

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auto-configurazione al primo avvio (admin, impostazioni e pagine essenziali).
# Via middleware e non lifespan: il runtime Python di Vercel non garantisce gli
# eventi di startup; il primo middleware eseguito per istanza fa da trigger.
from .seed import bootstrap_if_needed  # noqa: E402

_bootstrapped = False


@app.middleware("http")
async def _auto_bootstrap(request, call_next):
    global _bootstrapped
    if not _bootstrapped:
        _bootstrapped = True
        await bootstrap_if_needed(include_demo=False)
    return await call_next(request)