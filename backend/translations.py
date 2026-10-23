import json
import logging
import os
import re

import httpx

logger = logging.getLogger("crcoppe-translations")

# Campi testuali traducibili. deep=True include descrizioni lunghe e sottostrutture.
BASE_FIELDS = {
    "product": ["name", "short_description", "image_alt"],
    "category": ["name", "description"],
    "page": ["title"],
    "settings": ["tagline", "hero_title", "hero_subtitle", "about_short", "opening_hours"],
}
DEEP_EXTRA = {
    "product": ["full_description", "materials", "dimensions", "colors", "variants", "customization_info"],
}

_SYSTEM_PROMPT = (
    "Sei un traduttore professionale italiano→inglese per il sito aziendale di CR Coppe & Gadget "
    "(coppe, trofei, targhe, medaglie e gadget personalizzati). Usa un inglese commerciale scorrevole. "
    "Non tradurre URL, email, numeri di telefono, unità di misura, nomi propri. "
    "Lascia invariati i testi tra parentesi quadre [segnaposto]. "
    "Restituisci SOLO JSON valido con la STESSA struttura e le stesse chiavi dell'input, valori tradotti."
)


def _llm_config():
    """(base_url, model, api_key) in base alla chiave disponibile nell'ambiente.
    - OPENAI_API_KEY  → API pubblica OpenAI (indipendenza totale da Emergent)
    - EMERGENT_LLM_KEY → endpoint pubblico OpenAI-compatibile https://integrations.emergentagent.com/llm
    Entrambi raggiungibili da qualsiasi hosting (incluso Vercel)."""
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        return "https://api.openai.com/v1", os.environ.get("LLM_MODEL", "gpt-4o-mini"), openai_key
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if emergent_key:
        base = os.environ.get("EMERGENT_LLM_BASE_URL", "https://integrations.emergentagent.com/llm").rstrip("/")
        return base, os.environ.get("LLM_MODEL", "gpt-5.4-mini"), emergent_key
    return None


def _extract(kind: str, doc: dict, deep: bool) -> dict:
    """Campi da tradurre per un documento (solo testo non vuoto)."""
    fields = list(BASE_FIELDS.get(kind, []))
    if deep and kind in DEEP_EXTRA:
        fields += DEEP_EXTRA[kind]
    payload = {}
    for k in fields:
        v = doc.get(k)
        if isinstance(v, str) and v.strip():
            payload[k] = v
    if deep and kind == "product":
        specs = [
            {"label": s.get("label", ""), "value": s.get("value", "")}
            for s in (doc.get("specs") or [])
            if isinstance(s, dict) and (s.get("label") or s.get("value"))
        ]
        if specs:
            payload["specs"] = specs
    if kind == "page":
        blocks = [
            {"heading": b.get("heading", ""), "text": b.get("text", "")}
            for b in (doc.get("blocks") or [])
            if isinstance(b, dict) and (b.get("heading") or b.get("text"))
        ]
        if blocks:
            payload["blocks"] = blocks
    seo = doc.get("seo") or {}
    seo_payload = {
        k: seo[k]
        for k in ("seo_title", "meta_description")
        if isinstance(seo.get(k), str) and seo[k].strip()
    }
    if seo_payload:
        payload["seo"] = seo_payload
    return payload


def _apply(doc: dict, cache: dict) -> None:
    """Sovrascrive i campi del documento con le versioni inglesi presenti in cache."""
    for k, v in cache.items():
        if k in ("specs", "blocks") and isinstance(v, list) and v:
            doc[k] = v
        elif k == "seo" and isinstance(v, dict):
            doc["seo"] = {**(doc.get("seo") or {}), **v}
        elif isinstance(v, str) and k in doc and isinstance(doc[k], str):
            doc[k] = v


async def _llm_translate(payload: dict) -> dict | None:
    """Una chiamata LLM per lotto: traduce il JSON IT→EN restituendo la stessa struttura.
    Implementazione indipendente da SDK proprietari: HTTP diretto (httpx) su endpoint
    OpenAI-compatibile pubblico."""
    cfg = _llm_config()
    if not cfg or not payload:
        return None
    base_url, model, api_key = cfg
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            res = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": "Traduci in inglese:\n\n" + json.dumps(payload, ensure_ascii=False)},
                    ],
                },
            )
            res.raise_for_status()
            text = ((res.json().get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    except Exception:
        logger.exception("Chiamata LLM non riuscita: fallback sull'italiano")
        return None
    try:
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip())
        out = json.loads(text)
        return out if isinstance(out, dict) else None
    except Exception:
        logger.exception("Risposta LLM non è JSON valido: fallback sull'italiano")
        return None


async def apply_english(kind: str, docs: list, persist, deep: bool = False) -> None:
    """Traduce i documenti senza traduzione in cache (una sola chiamata LLM per l'intero lotto),
    salva la cache via `persist(cache, doc)` e sovrascrive i campi dei doc con la versione inglese."""
    if not docs:
        return
    caches = [dict(d.get("translations_en") or {}) for d in docs]
    batch = {}
    for i, d in enumerate(docs):
        for k, v in _extract(kind, d, deep).items():
            if k not in caches[i]:
                batch.setdefault(str(i), {})[k] = v
    if batch:
        tr = await _llm_translate(batch)
        if not tr:
            return  # nessuna chiave/errore LLM: i documenti restano in italiano
        for idx, fields in tr.items():
            try:
                i = int(idx)
            except (TypeError, ValueError):
                continue
            if 0 <= i < len(docs) and isinstance(fields, dict):
                caches[i].update(fields)
    for i, d in enumerate(docs):
        d["translations_en"] = caches[i]
        _apply(d, caches[i])
        try:
            await persist(d["translations_en"], d)
        except Exception:
            logger.exception("Salvataggio cache traduzioni non riuscito")
