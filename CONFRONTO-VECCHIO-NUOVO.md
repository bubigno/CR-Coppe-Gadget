# CONFRONTO VECCHIO REPO (GitHub) ↔ NUOVO PROGETTO (Emergent)

## Cosa so con certezza
Il nuovo progetto (quello sviluppato qui) è: React (CRA) + FastAPI + MongoDB, con pannello admin
(prodotti, categorie, richieste, contenuti, SEO, statistiche reali), catalogo, preventivi, tema
chiaro, IT/EN, logo cliente, pagine legali. Il pacchetto già pronto in `vercel-export/` è la
versione Vercel + Supabase di QUESTO progetto.

## Cosa NON posso vedere da qui
Non ho accesso al tuo account GitHub, Vercel o Supabase: quindi il vecchio codice, lo schema del
suo database e le sue configurazioni non sono analizzabili finché non mi dai accesso. Nessun file
del vecchio repo verrà sovrascritto prima del tuo ok.

## Per completare il confronto mi serve UNO di questi
1. **Collegare il repo in chat** ("Save to GitHub"/integrazione): potrei così esportare il nuovo
   progetto in un branch `nuovo-sito` del tuo repo esistente — il vecchio sito resta online su main.
2. **URL del repository** (se pubblico: lo leggo direttamente).
3. **ZIP del vecchio progetto** caricato in chat: lo analizzo riga per riga.
4. Screenshot/elenco delle **tabelle del progetto Supabase esistente** (per la compatibilità schema).

## Cosa verrà sostituito nel repo (dopo approvazione)
- Frontend: intero sito sostituito (nuovo design, nuove funzioni).
- Backend: sostituito con la versione FastAPI/PostgreSQL in `vercel-export/backend`.
- Configurazioni Vercel: `vercel.json`, `api/index.py`, `requirements.txt` nuovi; i vecchi file di
  configurazione (se diversi) verranno elencati uno a uno PRIMA della sostituzione, mai totti insieme.
- Supabase: si usa un progetto/schema NUOVO con `supabase/schema.sql`; il database del vecchio sito
  NON viene modificato né cancellato.

## Variabili d'ambiente
Le nuove da aggiungere: SUPABASE_DB_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET,
ADMIN_USERNAME/EMAIL/PASSWORD, REACT_APP_BACKEND_URL="". Quelle del vecchio progetto restano
inalterate finché il nuovo non è in produzione.
