import os
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        url = os.environ["SUPABASE_DB_URL"]
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        _engine = create_async_engine(url, pool_size=5, max_overflow=5, pool_pre_ping=True)
    return _engine


def get_sessions():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _session_factory


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


# ---------- Modelli ORM ----------


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    image: Mapped[Optional[str]] = mapped_column(Text, default="")
    parent_slug: Mapped[Optional[str]] = mapped_column(String(80), ForeignKey("categories.slug"))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    translations_en: Mapped[dict] = mapped_column(JSON, default=dict)  # cache traduzioni EN
    seo_title: Mapped[Optional[str]] = mapped_column(String(70), default="")
    seo_description: Mapped[Optional[str]] = mapped_column(String(180), default="")
    seo_noindex: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    seo_og_image: Mapped[Optional[str]] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(40), default="")
    short_description: Mapped[Optional[str]] = mapped_column(String(400), default="")
    full_description: Mapped[Optional[str]] = mapped_column(Text, default="")
    category_slug: Mapped[Optional[str]] = mapped_column(String(80), ForeignKey("categories.slug"))
    main_image: Mapped[Optional[str]] = mapped_column(Text, default="")
    image_alt: Mapped[Optional[str]] = mapped_column(String(200), default="")
    materials: Mapped[Optional[str]] = mapped_column(String(300), default="")
    dimensions: Mapped[Optional[str]] = mapped_column(String(300), default="")
    colors: Mapped[Optional[str]] = mapped_column(String(300), default="")
    variants: Mapped[Optional[str]] = mapped_column(String(300), default="")
    price: Mapped[Optional[str]] = mapped_column(String(40), default="")
    availability: Mapped[Optional[str]] = mapped_column(String(80), default="")
    customization_info: Mapped[Optional[str]] = mapped_column(Text, default="")
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    translations_en: Mapped[dict] = mapped_column(JSON, default=dict)  # cache traduzioni EN
    seo_title: Mapped[Optional[str]] = mapped_column(String(70), default="")
    seo_description: Mapped[Optional[str]] = mapped_column(String(180), default="")
    seo_noindex: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    seo_og_image: Mapped[Optional[str]] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    images = relationship("ProductImage", cascade="all, delete-orphan", order_by="ProductImage.position", lazy="selectin")
    specs = relationship("ProductSpec", cascade="all, delete-orphan", order_by="ProductSpec.position", lazy="selectin")


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProductSpec(Base):
    __tablename__ = "product_specs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    value: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    hero_image: Mapped[Optional[str]] = mapped_column(Text, default="")
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    translations_en: Mapped[dict] = mapped_column(JSON, default=dict)  # cache traduzioni EN
    seo_title: Mapped[Optional[str]] = mapped_column(String(70), default="")
    seo_description: Mapped[Optional[str]] = mapped_column(String(180), default="")
    seo_noindex: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    seo_og_image: Mapped[Optional[str]] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    blocks = relationship("PageBlock", cascade="all, delete-orphan", order_by="PageBlock.position", lazy="selectin")


class PageBlock(Base):
    __tablename__ = "page_blocks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    page_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    heading: Mapped[Optional[str]] = mapped_column(String(200), default="")
    text: Mapped[Optional[str]] = mapped_column(Text, default="")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class QuoteRequest(Base):
    __tablename__ = "quote_requests"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="preventivo")
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(120), default="")
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(40), default="")
    product_slug: Mapped[Optional[str]] = mapped_column(String(160), default="")
    product_name: Mapped[Optional[str]] = mapped_column(String(200), default="")
    quantity: Mapped[Optional[str]] = mapped_column(String(40), default="")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    privacy_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="nuova")
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, default="")
    ip: Mapped[Optional[str]] = mapped_column(String(60), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default="site_settings")
    company_name: Mapped[Optional[str]] = mapped_column(String(120), default="CR Coppe & Gadget")
    tagline: Mapped[Optional[str]] = mapped_column(String(300), default="")
    hero_title: Mapped[Optional[str]] = mapped_column(Text, default="")
    hero_subtitle: Mapped[Optional[str]] = mapped_column(Text, default="")
    about_short: Mapped[Optional[str]] = mapped_column(Text, default="")
    email: Mapped[Optional[str]] = mapped_column(String(200), default="")
    phone: Mapped[Optional[str]] = mapped_column(String(60), default="")
    address: Mapped[Optional[str]] = mapped_column(String(300), default="")
    opening_hours: Mapped[Optional[str]] = mapped_column(Text, default="")
    map_embed_url: Mapped[Optional[str]] = mapped_column(Text, default="")
    facebook: Mapped[Optional[str]] = mapped_column(Text, default="")
    instagram: Mapped[Optional[str]] = mapped_column(Text, default="")
    linkedin: Mapped[Optional[str]] = mapped_column(Text, default="")
    site_url: Mapped[Optional[str]] = mapped_column(Text, default="")
    google_analytics_id: Mapped[Optional[str]] = mapped_column(String(60), default="")
    translations_en: Mapped[dict] = mapped_column(JSON, default=dict)  # cache traduzioni EN
    seo_title: Mapped[Optional[str]] = mapped_column(String(70), default="")
    seo_description: Mapped[Optional[str]] = mapped_column(String(180), default="")
    seo_noindex: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    seo_og_image: Mapped[Optional[str]] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class Redirect(Base):
    __tablename__ = "redirects"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    from_slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    to_slug: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    event: Mapped[str] = mapped_column(String(20), nullable=False)
    path: Mapped[Optional[str]] = mapped_column(String(200), default="")
    label: Mapped[Optional[str]] = mapped_column(String(80), default="")
    referrer: Mapped[Optional[str]] = mapped_column(String(300), default="")
    session_id: Mapped[Optional[str]] = mapped_column(String(60), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    identifier: Mapped[str] = mapped_column(String(160), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


# ---------- Schemi Pydantic (API JSON identiche all'attuale) ----------


class SeoMeta(BaseModel):
    model_config = ConfigDict(extra="ignore")

    seo_title: str = Field(default="", max_length=70)
    meta_description: str = Field(default="", max_length=180)
    noindex: bool = False
    og_image: str = ""


class SpecItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label: str = Field(max_length=80)
    value: str = Field(max_length=200)


class ProductData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(default="", max_length=160)
    code: str = Field(default="", max_length=40)
    short_description: str = Field(default="", max_length=400)
    full_description: str = Field(default="", max_length=20000)
    category_slug: str = Field(default="", max_length=80)
    main_image: str = Field(default="", max_length=600)
    image_alt: str = Field(default="", max_length=200)
    gallery: List[str] = Field(default_factory=list)
    materials: str = Field(default="", max_length=300)
    dimensions: str = Field(default="", max_length=300)
    colors: str = Field(default="", max_length=300)
    variants: str = Field(default="", max_length=300)
    specs: List[SpecItem] = Field(default_factory=list)
    price: str = Field(default="", max_length=40)
    availability: str = Field(default="", max_length=80)
    customization_info: str = Field(default="", max_length=2000)
    published: bool = True
    featured: bool = False
    is_demo: bool = False
    seo: SeoMeta = Field(default_factory=SeoMeta)


class ProductOut(ProductData):
    id: str = ""
    views: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category_label: str = ""


class CategoryData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=2, max_length=80)
    slug: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=500)
    image: str = Field(default="", max_length=600)
    parent_slug: str = Field(default="", max_length=80)
    order: int = 0
    seo: SeoMeta = Field(default_factory=SeoMeta)


class CategoryOut(CategoryData):
    id: str = ""
    created_at: Optional[datetime] = None


class QuoteRequestCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str = Field(default="preventivo", pattern="^(preventivo|contatto|informazioni)$")
    first_name: str = Field(min_length=2, max_length=80)
    last_name: str = Field(min_length=2, max_length=80)
    company: str = Field(default="", max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    product_slug: str = Field(default="", max_length=160)
    quantity: str = Field(default="", max_length=40)
    message: str = Field(min_length=10, max_length=4000)
    privacy_accepted: bool
    website: str = Field(default="", max_length=200)


class PageData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(min_length=2, max_length=160)
    hero_image: str = Field(default="", max_length=600)
    blocks: List[Dict[str, str]] = Field(default_factory=list)
    seo: SeoMeta = Field(default_factory=SeoMeta)


class PageOut(PageData):
    id: str = ""
    slug: str = ""
    published: bool = True
    updated_at: Optional[datetime] = None


class SettingsData(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = "site_settings"
    company_name: str = "CR Coppe & Gadget"
    tagline: str = ""
    hero_title: str = ""
    hero_subtitle: str = ""
    about_short: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    opening_hours: str = ""
    map_embed_url: str = ""
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    site_url: str = ""
    google_analytics_id: str = ""
    seo: SeoMeta = Field(default_factory=SeoMeta)
    updated_at: Optional[datetime] = None


class RedirectCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    from_slug: str = Field(min_length=1, max_length=160)
    to_slug: str = Field(min_length=1, max_length=160)


class TrackEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    event: str = Field(pattern="^(pageview|click)$")
    path: str = Field(default="", max_length=200)
    label: str = Field(default="", max_length=80)
    referrer: str = Field(default="", max_length=300)
    session_id: str = Field(default="", max_length=60)


class RequestUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: str = Field(default=None, pattern="^(nuova|in_lavorazione|completata)$")
    admin_notes: str = Field(default=None, max_length=4000)


class CredentialsUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    current_password: str = Field(min_length=1, max_length=200)
    new_username: str | None = Field(default=None, pattern="^[a-zA-Z0-9._-]{3,80}$")
    new_email: EmailStr | None = None
    new_password: str | None = Field(default=None, min_length=8, max_length=200)


class SignedUploadRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    filename: str = Field(min_length=1, max_length=200)
    content_type: str = Field(min_length=1, max_length=100)


# ---------- Serializzazione (stessi JSON dell'API attuale) ----------


def product_serialize(p: Product, cmap: dict) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "slug": p.slug,
        "code": p.code or "",
        "short_description": p.short_description or "",
        "full_description": p.full_description or "",
        "category_slug": p.category_slug or "",
        "main_image": p.main_image or "",
        "image_alt": p.image_alt or "",
        "gallery": [i.url for i in sorted(p.images, key=lambda x: x.position)],
        "materials": p.materials or "",
        "dimensions": p.dimensions or "",
        "colors": p.colors or "",
        "variants": p.variants or "",
        "specs": [{"label": s.label, "value": s.value} for s in sorted(p.specs, key=lambda x: x.position)],
        "price": p.price or "",
        "availability": p.availability or "",
        "customization_info": p.customization_info or "",
        "published": bool(p.published),
        "featured": bool(p.featured),
        "is_demo": bool(p.is_demo),
        "views": p.views or 0,
        "seo": {
            "seo_title": p.seo_title or "",
            "meta_description": p.seo_description or "",
            "noindex": bool(p.seo_noindex),
            "og_image": p.seo_og_image or "",
        },
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "category_label": cmap.get(p.category_slug, "") if p.category_slug else "",
    }


def category_serialize(c: Category) -> dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "slug": c.slug,
        "description": c.description or "",
        "image": c.image or "",
        "parent_slug": c.parent_slug or "",
        "order": c.sort_order or 0,
        "seo": {
            "seo_title": c.seo_title or "",
            "meta_description": c.seo_description or "",
            "noindex": bool(c.seo_noindex),
            "og_image": c.seo_og_image or "",
        },
        "created_at": c.created_at,
    }


def page_serialize(pg: Page) -> dict:
    return {
        "id": str(pg.id),
        "slug": pg.slug,
        "title": pg.title,
        "hero_image": pg.hero_image or "",
        "published": bool(pg.published),
        "blocks": [{"heading": b.heading or "", "text": b.text or ""} for b in sorted(pg.blocks, key=lambda x: x.position)],
        "seo": {
            "seo_title": pg.seo_title or "",
            "meta_description": pg.seo_description or "",
            "noindex": bool(pg.seo_noindex),
            "og_image": pg.seo_og_image or "",
        },
        "updated_at": pg.updated_at,
    }


def settings_serialize(s: Settings) -> dict:
    return {
        "id": s.id,
        "company_name": s.company_name or "",
        "tagline": s.tagline or "",
        "hero_title": s.hero_title or "",
        "hero_subtitle": s.hero_subtitle or "",
        "about_short": s.about_short or "",
        "email": s.email or "",
        "phone": s.phone or "",
        "address": s.address or "",
        "opening_hours": s.opening_hours or "",
        "map_embed_url": s.map_embed_url or "",
        "facebook": s.facebook or "",
        "instagram": s.instagram or "",
        "linkedin": s.linkedin or "",
        "site_url": s.site_url or "",
        "google_analytics_id": s.google_analytics_id or "",
        "seo": {
            "seo_title": s.seo_title or "",
            "meta_description": s.seo_description or "",
            "noindex": bool(s.seo_noindex),
            "og_image": s.seo_og_image or "",
        },
        "updated_at": s.updated_at,
    }


def request_serialize(r: QuoteRequest) -> dict:
    return {
        "id": str(r.id),
        "type": r.type,
        "first_name": r.first_name,
        "last_name": r.last_name,
        "company": r.company or "",
        "email": r.email,
        "phone": r.phone or "",
        "product_slug": r.product_slug or "",
        "product_name": r.product_name or "",
        "quantity": r.quantity or "",
        "message": r.message,
        "privacy_accepted": bool(r.privacy_accepted),
        "status": r.status,
        "admin_notes": r.admin_notes or "",
        "created_at": r.created_at,
    }