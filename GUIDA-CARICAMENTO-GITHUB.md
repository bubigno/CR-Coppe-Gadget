# GUIDA — Caricamento del NUOVO sito su GitHub (branch `nuovo-sito`)

Obiettivo: caricare il codice del NUOVO sito in un branch separato del tuo repository, senza toccare `main` (dove vive il vecchio sito, che resta online e intatto).

## METODO CONSIGLIATO — GitHub Desktop (15 minuti)

1. Scarica GitHub Desktop da https://desktop.github.com, installalo e accedi con il tuo account GitHub.
2. Menu `File` → `Clone repository` → scegli `bubigno/CR-Coppe-Gadget` → `Clone`.
3. Menu `Branch` → `New branch…` → nome: `nuovo-sito` → base: `main` → `Create branch`.
4. Menu `Repository` → `Show in Explorer` (Windows) / `Open in Finder` (Mac): si apre la cartella del repository.
5. Nella cartella elimina TUTTI i file e le cartelle visibili (è solo la copia locale: `main` su GitHub resta intatto). ATTENZIONE: non eliminare la cartella nascosta `.git` — per vederla in Windows attiva `Visualizza` → `Mostra` → `Elementi nascosti`.
6. Copia nella stessa cartella TUTTO il contenuto di questo pacchetto: le cartelle `api`, `backend`, `frontend`, `supabase`, `scripts` e i file `vercel.json`, `requirements.txt`, `README-DEPLOY.md`, `.gitignore` (niente `node_modules` né cartelle `build`).
7. Torna su GitHub Desktop: vedrai tutte le modifiche. Come messaggio scrivi: `Nuovo sito CR Coppe & Gadget` e clicca `Commit to nuovo-sito`.
8. Clicca in alto su `Push origin` (o `Publish branch`): il branch è ora su GitHub. ✓

## Dopo il push — attiva la Preview su Vercel

1. Il tuo progetto Vercel (già collegato al repository) genera automaticamente una **Preview** per il branch `nuovo-sito`: dashboard Vercel → progetto → scheda `Deployments` (il deployment inizia con `caretti-fratelli-sito-git-nuovo-sito…`).
2. Imposta prima le **variabili d'ambiente**: `Settings` → `Environment Variables` → aggiungi le variabili dell'elenco qui sotto con scope `Preview` (quando poi approverai il merge, impostale anche per `Production`).
3. Nel deployment Preview clicca i `⋯` → `Redeploy`: il sito nuovo parte collegato al database.

## Variabili d'ambiente (Vercel → Settings → Environment Variables)

| Variabile | Valore | Note |
|---|---|---|
| `SUPABASE_DB_URL` | (connection string del tuo Supabase) | Dashboard Supabase → `Connect` → `Connection string` → URI con porta 6543 |
| `SUPABASE_URL` | (Project URL) | Dashboard Supabase → `Connect` → `Project URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role key) | Dashboard Supabase → `Project Settings` → `API` |
| `JWT_SECRET` | (valore fornito in chat) | Chiave nuova, 64 caratteri |
| `ADMIN_USERNAME` | `admin` | |
| `ADMIN_EMAIL` | `admin@crcoppeegadget.it` | |
| `ADMIN_PASSWORD` | (valore fornito in chat) | Cambiabile poi dal pannello admin |
| `REACT_APP_BACKEND_URL` | (vuota) | L'API è same-origin. Se Vercel rifiuta il valore vuoto, non impostare la variabile |
| `CORS_ORIGINS` | (facoltativa) | Non necessaria in preview (stesso dominio) |
| `EMERGENT_LLM_KEY` | (chiave LLM fornita in chat) | Necessaria per le traduzioni automatiche in inglese; senza chiave i contenuti restano in italiano. In alternativa puoi usare `OPENAI_API_KEY` (API OpenAI standard) |

## Schema del database (una sola volta)

1. Dashboard Supabase → progetto → `SQL Editor` → `New query`.
2. Incolla TUTTO il contenuto di `supabase/schema.sql` (incluso in questo pacchetto) e clicca `Run`.
3. Esito atteso: `Success. No rows returned`. Le tabelle del vecchio sito (`servizi`, `site_content`) restano intatte; lo schema è rieseguibile senza errori.

## Prima apertura del sito nuovo

- Al primo avvio il backend crea da SOLO: l'account admin, le impostazioni aziendali e le pagine essenziali (privacy, cookie, termini d'uso, chi siamo). Nessuno script da eseguire sul tuo computer.
- Il catalogo è VUOTO di proposito: inserisci categorie e prodotti dal pannello `/admin` (login con `ADMIN_USERNAME` / `ADMIN_PASSWORD`).
- Le immagini caricate finiscono in un bucket pubblico `uploads` su Supabase Storage (creato dallo schema).

## Sicurezza

- `main` NON viene toccato: il vecchio sito resta online finché NON farai tu il merge (solo dopo la tua verifica del nuovo).
- Le chiavi non sono nel codice: vivono solo nelle variabili d'ambiente di Vercel.
- Il repository è pubblico: NON inserire MAI chiavi o password nei file. `.env.example` contiene solo segnaposto.
