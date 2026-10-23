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
