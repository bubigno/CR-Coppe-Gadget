# AGGIORNAMENTO — Dipendenze compatibili Vercel (rimossa emergentintegrations)

## Problema risolto
Vercel (resolver `uv`, Python 3.12) rifiutava la risoluzione con questo errore:
`Failed to resolve dependencies for package emergentintegrations==0.2.2 — Package litellm was included as a URL dependency.`
La libreria `emergentintegrations` proviene dall'indice PyPI interno di Emergent e dichiara `litellm` come dipendenza-URL: non compatibile con `uv`/Vercel e non indipendente dall'infrastruttura Emergent.

## Soluzione
Libreria RIMOSSA. L'unica funzionalità che la usava (traduzione automatica IT→EN dei contenuti) ora usa HTTP diretto con `httpx` (pacchetto pubblico, compatibile uv/Python 3.12) verso un endpoint OpenAI-compatibile:
- `OPENAI_API_KEY` → `https://api.openai.com/v1` (indipendenza totale da Emergent)
- `EMERGENT_LLM_KEY` → `https://integrations.emergentagent.com/llm` (endpoint pubblico, quello già usato in preview)
Cache delle traduzioni, fallback in italiano e tutte le altre funzionalità restano invariati.

## File modificati (da SOSTITUIRE nel repo, branch `nuovo-sito`)
1. `requirements.txt` — rimosse `--extra-index-url …` e `emergentintegrations==0.2.2`, aggiunta `httpx==0.28.1`
2. `backend/translations.py` — chiamata LLM via httpx diretto (stessa logica: cache `translations_en`, invalidazione al salvataggio admin, fallback italiano)
3. `GUIDA-CARICAMENTO-GITHUB.md` — repo rinominato `bubigno/CR-Coppe-Gadget` + variabile LLM documentata
4. `README-DEPLOY.md` — nota sulle traduzioni automatiche
5. `MODIFICHE-AGGIORNAMENTO.md` — QUESTO file (nuovo)

## Comandi Git per pubblicare l'aggiornamento
Dalla cartella locale del repository (clone GitHub Desktop del branch nuovo-sito):
```bash
git checkout nuovo-sito
# sostituisci i file elencati sopra con quelli di questo pacchetto, poi:
git add requirements.txt backend/translations.py GUIDA-CARICAMENTO-GITHUB.md README-DEPLOY.md MODIFICHE-AGGIORNAMENTO.md
git commit -m "Dipendenze compatibili Vercel: rimossa emergentintegrations, traduzioni via httpx diretto"
git push origin nuovo-sito
```
Vercel rilancerà il deployment del branch automaticamente dopo il push.

## Variabili d'ambiente (Vercel) — nessuna modifica obbligatoria
- `EMERGENT_LLM_KEY` già impostata: le traduzioni continuano a funzionare (nuova implementazione httpx).
- In alternativa: `OPENAI_API_KEY` per usare l'API OpenAI standard.

## Verifiche eseguite prima della consegna
- `uv pip compile --python-version 3.12 --python-platform linux`: risoluzione completata, `litellm` assente
- Installazione pulita in venv Python 3.12.15: OK
- Avvio backend (uvicorn) e import di tutte le dipendenze su Python 3.12: OK
- Traduzione inglese reale via nuova implementazione httpx: OK (cache JSONB su Supabase/Postgres verificata)
- Build frontend (yarn build): OK

## Non verificabili da questo ambiente
- Il deployment reale su Vercel (avviene dopo il push, nella dashboard Vercel)
- Cold start serverless con le chiavi di produzione definitive


---

# AGGIORNAMENTO 2 — pydantic-core / Python 3.14 (build Vercel)

## Problema risolto
Vercel selezionava Python 3.14 (ignorando `.python-version`) e `pydantic-core==2.27.2` (di pydantic 2.10.4) non ha wheel per 3.14: pip tentava la compilazione sorgente e PyO3 0.22.6 rifiutava ("exceeds the maximum supported version 3.13").

## Soluzione (doppio strato, nessuna soppressione PYO3)
1. **Selezione versione**: aggiunto `pyproject.toml` con `requires-python = ">=3.12,<3.13"` (metodo raccomandato dalla documentazione Vercel per fissare la versione; `.python-version` resta come fallback di compatibilità).
2. **Compatibilità universale**: dipendenze aggiornate a versioni con wheel precompilate per 3.12, 3.13 E 3.14, così la build riesce qualunque runtime venga selezionato:
   - `fastapi==0.161.1` (compatibile pydantic 2.14)
   - `pydantic[email]==2.14.1` (pydantic-core 2.50.1, wheel cp312–cp314)
   - `SQLAlchemy[asyncio]==2.1.6` (supporto Python 3.14 + extra asyncio: su installazioni fresche greenlet va dichiarato esplicitamente)
   - `asyncpg==0.32.0` (wheel cp314)
   - `bcrypt==5.0.0` (wheel abi3 per 3.14) — `backend/auth.py` ora tronca le password a 72 byte prima di hash/verifica (bcrypt 5 rifiuta password più lunghe; comportamento identico a bcrypt 4 per gli hash esistenti)

## File creati/modificati in questo aggiornamento (branch `nuovo-sito`)
1. `pyproject.toml` — NUOVO (requires-python 3.12)
2. `.python-version` — verificato/aggiunto (contenuto `3.12`)
3. `requirements.txt` — pin aggiornati (vedi sopra)
4. `backend/auth.py` — troncamento password a 72 byte (compatibile bcrypt 5)
5. `MODIFICHE-AGGIORNAMENTO.md` — QUESTO file (aggiornato)

## Comandi Git per pubblicare
```bash
git checkout nuovo-sito
# sostituisci/aggiungi i file elencati sopra, poi:
git add pyproject.toml .python-version requirements.txt backend/auth.py MODIFICHE-AGGIORNAMENTO.md
git commit -m "Build Vercel: dipendenze con wheel per 3.12/3.14 + requires-python 3.12"
git push origin nuovo-sito
```

## Verifiche eseguite
- Risoluzione uv per 3.12 e per 3.14: exit 0, nessuna dipendenza-URL, nessun litellm
- Installazione reale in venv Python 3.14.9 dai pin finali: SUCCESSO con sole wheel precompilate (nessuna compilazione sorgente)
- Import completo del backend e avvio uvicorn su Python 3.12 E 3.14: OK
- Flusso end-to-end su entrambi i runtime: impostazioni IT/EN (traduzione via httpx), login admin (bcrypt 5), preventivo 201, catalogo, pagine
- Frontend invariato (build già verificata)

## Non verificabili da questo ambiente
- Il deploy effettivo su Vercel (dopo il push) e il cold start serverless con chiavi di produzione
