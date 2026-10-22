# NUOVO SITO CR COPPE & GADGET — Deployment Vercel + Supabase

Pacchetto pronto per sostituire il vecchio sito nel repository GitHub, pubblicato su Vercel con database Supabase. **Nessun file del vecchio repo viene toccato fino all'approvazione.**

## Contenuto del pacchetto

```
api/index.py            → entrypoint ASGI per Vercel Functions (FastAPI)
backend/                → backend convertito a PostgreSQL/Supabase (stesse API JSON)
frontend/               → React identico allo stato attuale, senza script Emergent/PostHog
supabase/schema.sql     → DDL delle 10 tabelle + indici + RLS + bucket uploads
scripts/migrate.py      → export/import/verifica dati (Mongo → PostgreSQL, id uuid5 deterministici)
requirements.txt        → dipendenze backend per il runtime Python di Vercel
vercel.json             → build frontend + rewrite /api → funzione + fallback SPA
```

## Procedura (fase per fase)

### 1. Backup del VECCHIO codice (da fare PRIMA di tutto)
- Nel repository GitHub crea un branch/tag `vecchio-sito` puntato su `main`: `git branch vecchio-sito && git push origin vecchio-sito` (o da interfaccia web). Così il vecchio codice è sempre recuperabile.

### 2. Supabase — usa un progetto NUOVO (consigliato)
- Puoi usare un progetto NUOVO oppure lo STESSO progetto del vecchio sito: le tabelle del nuovo schema (users, products, …) non collidono con quelle del vecchio (servizi, site_content), che restano intatte.
- Nel progetto: SQL Editor → incolla ed esegui `supabase/schema.sql` (idempotente, rieseguibile senza errori).
- Segnati: connection string (Pooler, porta 6543), Project URL, service_role key → vanno SOLO nelle env vars di Vercel, mai in chat/repo/frontend.

### 3. Vercel — deploy su BRANCH (il vecchio sito resta online)
- Il progetto Vercel già collegato al repo genera automaticamente una **preview URL** per il branch `nuovo-sito`, senza toccare la produzione del vecchio sito.
- Environment Variables (Sensitive): `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (nuovo, 64 caratteri), `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `REACT_APP_BACKEND_URL=""` (o non impostata: il frontend usa percorsi relativi).
- Auto-configurazione: al primo avvio il backend crea da solo admin, impostazioni e pagine essenziali (nessuno script da eseguire). Catalogo vuoto: inserisci categorie/prodotti dal pannello admin. Per un catalogo demo: `python -m backend.seed` con le env locali.
- Traduzioni automatiche IT→EN dei contenuti (prodotti, categorie, pagine, home): richiedono la variabile `EMERGENT_LLM_KEY` nelle env di Vercel; senza chiave il sito resta in italiano senza errori.

### 4. Test completo sulla preview
Login admin (username/password), cambio credenziali, CRUD prodotti/categorie/pagine, upload immagini (fino a 4 MB diretto; oltre, `POST /api/admin/uploads/signed`), catalogo/ricerca/filtri, scheda prodotto con galleria e correlati, invio preventivo + contatto (honeypot, rate limit), gestione richieste con stati, dashboard statistiche (solo dati reali), redirect 301, sitemap.xml (dopo aver impostato `site_url` nelle Impostazioni), responsive mobile.

### 5. Migrazione dati reali (quando i test passano)
```
python scripts/migrate.py export --api https://<url-produzione-emergent> --username admin --password '...' --out ./export
python scripts/migrate.py import --dir ./export   # verso Supabase produzione
```
Verifica: conteggi righe, slug, somma visite, test login con la password originale.

### 6. Sostituzione del vecchio sito (🛑 solo dopo approvazione)
- Merge di `nuovo-sito` in `main` → Vercel sostituisce automaticamente il vecchio sito in produzione.
- Aggiungi il dominio personalizzato al progetto Vercel (DNS: CNAME/A come da dashboard) → HTTPS automatico.
- Imposta `site_url` nel nuovo admin → sitemap e canonical attivi → riverifica su Search Console.
- Il sito Emergent resta attivo 14 giorni come fallback; le richieste arrivate durante la propagazione DNS si recuperano con `scripts/migrate.py` (id deterministici = nessun duplicato).

### 7. Disdetta Emergent (🛑 solo dopo la finestra di 14 giorni e conteggi verificati)

## Differenze tecniche principali rispetto al vecchio repo
1. MongoDB → PostgreSQL/SQLAlchemy (stesse rotte e risposte JSON; id uuid).
2. Upload su disco → Supabase Storage (URL pubblici; upload diretto ≤4 MB o URL firmato).
3. IP client da `X-Forwarded-For` (dietro l'edge di Vercel).
4. Rimossi script della piattaforma Emergent (emergent-main.js, PostHog di piattaforma).
5. Seed eseguito manualmente/CI, non all'avvio (serverless).

## VARIABILI D'AMBIENTE (Vercel, tutte Sensitive tranne REACT_APP_BACKEND_URL)
`SUPABASE_DB_URL` · `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `JWT_SECRET` · `ADMIN_USERNAME` · `ADMIN_EMAIL` · `ADMIN_PASSWORD` · `REACT_APP_BACKEND_URL=""` · `CORS_ORIGINS=https://www.tuodominio.it`
