import logging
import os

from sqlalchemy import func, select

from .auth import hash_password
from .db import (
    Category,
    Page,
    PageBlock,
    Product,
    ProductImage,
    ProductSpec,
    Settings,
    User,
    get_sessions,
)

logger = logging.getLogger("crcoppe-seed")

IMG = {
    "coppa_classica": "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?crop=entropy&cs=srgb&fm=jpg&q=85",
    "coppe_tavolo": "https://images.unsplash.com/photo-1705925716592-259267037a03?crop=entropy&cs=srgb&fm=jpg&q=85",
    "trofei_prestige": "https://images.unsplash.com/photo-1677640724372-adb865d29aa8?crop=entropy&cs=srgb&fm=jpg&q=85",
    "trofeo_moderno": "https://images.unsplash.com/photo-1714548474564-44012ae413c9?crop=entropy&cs=srgb&fm=jpg&q=85",
    "cristallo": "https://images.unsplash.com/photo-1663657876166-03b3aabb5483?crop=entropy&cs=srgb&fm=jpg&q=85",
    "vetro": "https://images.unsplash.com/photo-1642104744809-14b986179927?crop=entropy&cs=srgb&fm=jpg&q=85",
    "medaglie": "https://images.unsplash.com/photo-1706374503312-7a4a4c030d2d?crop=entropy&cs=srgb&fm=jpg&q=85",
    "penna_taccuino": "https://images.unsplash.com/photo-1781722351700-a80cd87ac1cb?crop=entropy&cs=srgb&fm=jpg&q=85",
    "giftbox": "https://images.unsplash.com/photo-1760602672748-6a570286ce73?crop=entropy&cs=srgb&fm=jpg&q=85",
    "gadget_promo": "https://images.unsplash.com/photo-1620141609488-b7a3da6e7cc3?crop=entropy&cs=srgb&fm=jpg&q=85",
    "executive": "https://images.unsplash.com/photo-1601802126876-6a3575905ab1?crop=entropy&cs=srgb&fm=jpg&q=85",
}

CATEGORIES = [
    {"name": "Coppe & Trofei", "slug": "coppe-trofei", "order": 1, "parent_slug": "", "image": IMG["coppa_classica"],
     "description": "Coppe e trofei per manifestazioni sportive, premi aziendali e riconoscimenti."},
    {"name": "Coppe Sportive", "slug": "coppe-sportive", "order": 2, "parent_slug": "coppe-trofei", "image": IMG["coppe_tavolo"],
     "description": "Coppe per tornei, campionati e società sportive, in diverse altezze e finiture."},
    {"name": "Trofei & Riconoscimenti", "slug": "trofei-riconoscimenti", "order": 3, "parent_slug": "coppe-trofei", "image": IMG["trofeo_moderno"],
     "description": "Trofei business e premi di riconoscimento per eventi aziendali e cerimonie."},
    {"name": "Targhe & Cristallo", "slug": "targhe-cristallo", "order": 4, "parent_slug": "", "image": IMG["cristallo"],
     "description": "Targhe e premi in cristallo e vetro, incisi a laser per occasioni importanti."},
    {"name": "Medaglie", "slug": "medaglie", "order": 5, "parent_slug": "", "image": IMG["medaglie"],
     "description": "Medaglie personalizzate con nastro, per gare, premi e commemorazioni."},
    {"name": "Gadget Aziendali", "slug": "gadget-aziendali", "order": 6, "parent_slug": "", "image": IMG["giftbox"],
     "description": "Gadget e gift aziendali personalizzati con logo per clienti, dipendenti ed eventi."},
    {"name": "Penne & Taccuini", "slug": "penne-taccuini", "order": 7, "parent_slug": "", "image": IMG["penna_taccuino"],
     "description": "Penne e taccuini personalizzati, la classica idea regalo per aziende e fiere."},
]


def _spec(label, value):
    return {"label": label, "value": value}


def _product(name, slug, category_slug, code, short, full, image, gallery, specs, materials="", dimensions="", colors="", variants="", customization="", featured=False):
    return {
        "name": name,
        "slug": slug,
        "category_slug": category_slug,
        "code": code,
        "short_description": short,
        "full_description": full,
        "main_image": image,
        "image_alt": f"{name} — {category_slug.replace('-', ' ')} personalizzato CR Coppe & Gadget",
        "gallery": gallery,
        "specs": specs,
        "materials": materials,
        "dimensions": dimensions,
        "colors": colors,
        "variants": variants,
        "customization_info": customization,
        "published": True,
        "featured": featured,
        "is_demo": True,
        "seo": {"seo_title": f"{name} | CR Coppe & Gadget", "meta_description": short[:160], "noindex": False, "og_image": image},
    }


PRODUCTS = [
    _product(
        "Coppa Aurea Classica", "coppa-aurea-classica", "coppe-sportive", "COP-AUR-01",
        "Coppa in metallo dorato con base in legno, personalizzabile con incisione su placca e stemma.",
        "La coppa classica per eccellenza: finitura dorata lucida, manici decorati e base in legno nero. "
        "Ideale per finali di torneo, premiazioni di società sportive e riconoscimenti aziendali. "
        "Ogni coppa può essere completata con placca incisa con la dedica che preferisci.\n\n"
        "[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["coppa_classica"], [IMG["coppe_tavolo"], IMG["trofei_prestige"]],
        [_spec("Materiale", "Metallo dorato, base in legno"), _spec("Altezze disponibili", "24 / 30 / 36 cm"),
         _spec("Personalizzazione", "Incisione su placca e stampa"), _spec("Confezione", "Scatola elegante inclusa")],
        materials="Metallo dorato con finitura lucida, base in legno",
        dimensions="24 cm · 30 cm · 36 cm", colors="Oro", variants="Tre altezze disponibili",
        customization="Incisione su placca in metallo con dedica, nome evento e classifica.",
        featured=True,
    ),
    _product(
        "Trofeo Podio Multisport", "trofeo-podio-multisport", "coppe-sportive", "TRF-POD-02",
        "Trofeo dal design dinamico per discipline sportive diverse, con figura personalizzabile a tema.",
        "Linea moderna per chi cerca un trofeo diverso dalla classica coppa: colonna dal profilo affusolato e "
        "figura sportiva intercambiabile in base alla disciplina. Adatto a tornei di calcio, pallavolo, atletica "
        "e sport amatoriali.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["coppe_tavolo"], [IMG["coppa_classica"]],
        [_spec("Materiale", "Resina e metallo"), _spec("Altezze disponibili", "18 / 22 / 26 cm"),
         _spec("Figura", "Intercambiabile per disciplina"), _spec("Personalizzazione", "Incisione e stampa")],
        materials="Resina con inserti in metallo", dimensions="18-26 cm", colors="Oro, argento, bronzo",
        variants="Figure sportive su catalogo",
    ),
    _product(
        "Trofei Linea Prestige", "trofei-linea-prestige", "coppe-sportive", "TRF-PRS-03",
        "Coppa dal fusto snello con dettagli in resina dorata, perfetta per premiazioni di massa.",
        "Un equilibrio tra eleganza e contenuto di costo: la Linea Prestige è pensata per premiare più "
        "posizioni in classifica senza rinunciare all'effetto. Fusto snello, coppa decorata e base robusta.\n\n"
        "[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["trofei_prestige"], [IMG["coppa_classica"]],
        [_spec("Materiale", "Resina con finitura dorata"), _spec("Altezze disponibili", "20 / 25 / 30 cm"),
         _spec("Personalizzazione", "Placca incisa"), _spec("Confezione", "Imballo protettivo")],
        materials="Resina, base in marmoron", dimensions="20-30 cm", colors="Oro e rosso",
    ),
    _product(
        "Trofeo Moderno Metal Line", "trofeo-moderno-metal-line", "trofei-riconoscimenti", "TRF-MTL-04",
        "Trofeo dallo stile contemporaneo in metallo, per riconoscimenti aziendali e di settore.",
        "Design essenziale e materia preziosa: il Metal Line è pensato per premi aziendali, riconoscimenti a "
        "dipendenti e partner, premi di settore. La superficie ampia si presta a incisioni lungo tutta la "
        "colonna.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["trofeo_moderno"], [IMG["cristallo"]],
        [_spec("Materiale", "Metallo con base in legno"), _spec("Altezze disponibili", "22 / 28 cm"),
         _spec("Personalizzazione", "Incisione laser su colonna e placca")],
        materials="Metallo satinato, base in legno", dimensions="22-28 cm", colors="Oro antico",
        customization="Incisione laser su colonna: logo, testo e data dell'evento.",
        featured=True,
    ),
    _product(
        "Targa Cristallo Lumen", "targa-cristallo-lumen", "targhe-cristallo", "TAR-LUM-01",
        "Targa in cristallo trasparente con incisione laser 3D, su base in legno o alluminio.",
        "Il cristallo trasparente valorizza l'incisione laser: testi, loghi e grafiche sembrano sospesi dentro "
        "la lastra. Una targa che resta nel tempo, per anniversari, premi alla carriera e riconoscimenti "
        "istituzionali.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["cristallo"], [IMG["vetro"], IMG["trofeo_moderno"]],
        [_spec("Materiale", "Cristallo trasparente"), _spec("Formati", "Orizzontale e verticale"),
         _spec("Personalizzazione", "Incisione laser 3D"), _spec("Base", "Legno o alluminio")],
        materials="Cristallo, base in legno o alluminio", dimensions="Su misura tra 15 e 30 cm",
        colors="Trasparente", variants="Base in legno noce o alluminio spazzolato",
        customization="Incisione laser 3D interna: logo aziendale, testo celebrativo e data.",
        featured=True,
    ),
    _product(
        "Coppa Vetro Soffiato Armonia", "coppa-vetro-armonia", "targhe-cristallo", "TAR-VET-02",
        "Coppa in vetro dal profilo elegante, incisa a laser, per premi e riconoscimenti.",
        "Il vetro lavorato forma un calice sinuoso e luminoso: la superficie curva accoglie l'incisione con "
        "riflessi particolari. Adatta a premi di settore, riconoscimenti a clienti e partner.\n\n"
        "[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["vetro"], [IMG["cristallo"]],
        [_spec("Materiale", "Vetro"), _spec("Altezze disponibili", "25 / 30 cm"),
         _spec("Personalizzazione", "Incisione laser")],
        materials="Vetro, base in vetro fumé", dimensions="25-30 cm", colors="Trasparente",
    ),
    _product(
        "Medaglia Oro Personalizzata", "medaglia-oro-personalizzata", "medaglie", "MED-ORO-01",
        "Medaglia in metallo dorato con nastro personalizzato, incisione sul retro inclusa.",
        "La medaglia che premia ogni partecipante: metallo dorato con rilievo a tema, nastro nel colore della "
        "tua manifestazione e incisione sul retro con nome e posizione. Disponibile in versioni oro, argento e "
        "bronzo per le prime tre classificate.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["medaglie"], [IMG["coppe_tavolo"]],
        [_spec("Materiale", "Metallo dorato"), _spec("Diametro", "50 / 60 / 70 mm"),
         _spec("Nastro", "Colore personalizzato"), _spec("Personalizzazione", "Incisione retro e nastro stampato")],
        materials="Metallo con finitura oro, argento o bronzo", dimensions="50-70 mm",
        colors="Oro, argento, bronzo", variants="Versioni per i primi tre posti",
        customization="Nastro stampato con logo evento e incisione sul retro per ogni vincitore.",
    ),
    _product(
        "Set Penne & Taccuino Executive", "set-penne-taccuino-executive", "penne-taccuini", "GAD-PEN-01",
        "Set regalo con penna metallica e taccuino personalizzati con il logo della tua azienda.",
        "Il regalo aziendale che resta in uso ogni giorno: penna metallica con incisione del nome o del logo e "
        "taccuino con copertina personalizzata. Confezione regalo disponibile per consegne dirette a clienti e "
        "collaboratori.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["penna_taccuino"], [IMG["executive"], IMG["giftbox"]],
        [_spec("Contenuto", "Penna metallica e taccuino"), _spec("Personalizzazione", "Incisione e stampa logo"),
         _spec("Confezione", "Scatola regalo disponibile"), _spec("Ordine minimo", "Da definirsi al preventivo")],
        materials="Metallo, carta, copertina rigida", colors="Nero, blu, personalizzabile",
        customization="Incisione sulla penna e stampa del logo sulla copertina del taccuino.",
        featured=True,
    ),
    _product(
        "Kit Regalo Aziendale", "kit-regalo-aziendale", "gadget-aziendali", "GAD-KIT-01",
        "Kit regalo completo per clienti e dipendenti, personalizzato con la grafica aziendale.",
        "Un box pensato per onboarding, festività e eventi aziendali: seleziona insieme a noi i capi del kit "
        "(taccuino, penna, gadget utili) e personalizza la confezione con la grafica dell'azienda. Consegniamo "
        "anche direttamente ai destinatari.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["giftbox"], [IMG["executive"], IMG["penna_taccuino"]],
        [_spec("Composizione", "Personalizzabile"), _spec("Confezione", "Box rigido con nastro"),
         _spec("Personalizzazione", "Grafica su box e contenuti")],
        materials="Cartone rigido, contenuti variabili", colors="Su grafica aziendale",
        customization="Grafica del box e selezione dei gadget su misura del budget.",
    ),
    _product(
        "Gadget Promo Personalizzati", "gadget-promo-personalizzati", "gadget-aziendali", "GAD-PRO-02",
        "Gadget promozionali con logo per fiere, eventi e campagne: dalla borraccia al portachiavi.",
        "Gadget utili e visibili per far ricordare il tuo brand: borracce, portachiavi, shopper, cappellini e "
        "molto altro, stampati con la grafica aziendale. Selezioniamo i prodotti più adatti all'evento e al "
        "budget.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["gadget_promo"], [IMG["giftbox"]],
        [_spec("Tipologie", "Borracce, shopper, portachiavi, cappellini"), _spec("Personalizzazione", "Stampa logo"),
         _spec("Ordine minimo", "Da definirsi al preventivo")],
        materials="Variabili secondo tipologia", colors="Su catalogo",
    ),
    _product(
        "Set Regalo Executive", "set-regalo-executive", "gadget-aziendali", "GAD-EXE-03",
        "Set regalo di livello superiore per clienti e collaboratori di lungo corso.",
        "Quando il regalo deve lasciare il segno: articoli selezionati di livello superiore, personalizzazione "
        "curata nei minimi dettagli e confezione elegante. Adatto a premi ai collaboratori, ringraziamenti ai "
        "clienti e occasioni speciali.\n\n[Prodotto dimostrativo: sostituisci o modifica i contenuti dal pannello amministrativo.]",
        IMG["executive"], [IMG["penna_taccuino"], IMG["giftbox"]],
        [_spec("Composizione", "Personalizzabile"), _spec("Personalizzazione", "Incisione e stampa"),
         _spec("Confezione", "Confezione elegante inclusa")],
        materials="Pelle, metallo, tessuti pregiati", colors="Su catalogo",
        customization="Incisione nomi e dediche sui singoli articoli.",
    ),
]

CHI_SIAMO = {
    "slug": "chi-siamo",
    "title": "Chi siamo",
    "hero_image": IMG["executive"],
    "published": True,
    "blocks": [
        {"heading": "L'attività",
         "text": "CR Coppe & Gadget è specializzata nella fornitura di coppe, trofei, targhe, medaglie e gadget "
                 "aziendali personalizzati per aziende, club sportivi e organizzazioni. \n"
                 "[Completa qui la storia della tua azienda dal pannello amministrativo: quando è nata, come è "
                 "cresciuta, cosa la contraddistingue.]"},
        {"heading": "Cosa facciamo",
         "text": "Dalla coppa sportiva al gadget promozionale, dal riconoscimento aziendale al regalo per i "
                 "clienti: selezioniamo e personalizziamo prodotti adatti a ogni occasione e a ogni budget, "
                 "seguendo il cliente dalla scelta del articolo alla consegna.\n"
                 "[Personalizza questo testo dal pannello amministrativo.]"},
        {"heading": "Servizi di personalizzazione",
         "text": "Incisione, stampa e personalizzazione grafica sui prodotti del catalogo o su articoli forniti "
                 "dal cliente, su preventivo.\n[Descrivi qui i tuoi servizi reali: tecniche disponibili, "
                 "tempi, quantità minime.]"},
        {"heading": "I nostri valori",
         "text": "Qualità dei materiali, cura nei dettagli e attenzione al cliente: ogni richiesta viene "
                 "valutata singolarmente per proporre la soluzione giusta.\n[Personalizza questo testo dal "
                 "pannello amministrativo.]"},
    ],
    "seo": {"seo_title": "Chi siamo | CR Coppe & Gadget", "meta_description": "CR Coppe & Gadget: coppe, trofei, targhe, medaglie e gadget aziendali personalizzati per aziende, club e società sportive.", "noindex": False, "og_image": IMG["executive"]},
}

LEGAL_PAGES = [
    {
        "slug": "privacy-policy",
        "title": "Norme sulla privacy",
        "hero_image": "",
        "published": True,
        "blocks": [
            {"heading": "Informativa sul trattamento dei dati",
             "text": "[Modello da completare dal pannello amministrativo: inserisci qui l'informativa privacy della tua azienda, con i dati del titolare del trattamento, le finalità e le basi giuridiche del trattamento.]"},
            {"heading": "Dati inviati tramite i moduli",
             "text": "I dati inviati tramite i moduli di richiesta preventivo e di contatto (nome, cognome, azienda, email, telefono e messaggio) vengono salvati nel database del sito e utilizzati esclusivamente per rispondere alle richieste ricevute."},
            {"heading": "I tuoi diritti",
             "text": "[Completa con le informazioni su come l'interessato può esercitare i propri diritti di accesso, rettifica e cancellazione dei dati.]"},
        ],
        "seo": {"seo_title": "Norme sulla privacy | CR Coppe & Gadget", "meta_description": "Informativa sul trattamento dei dati personali di CR Coppe & Gadget.", "noindex": True, "og_image": ""},
    },
    {
        "slug": "cookie-policy",
        "title": "Utilizzo dei cookie",
        "hero_image": "",
        "published": True,
        "blocks": [
            {"heading": "Cookie tecnici",
             "text": "Questo sito utilizza solo cookie tecnici necessari al corretto funzionamento (come la sessione dell'area amministrativa e la preferenza di lingua). Non vengono impostati cookie di tracciamento di terze parti."},
            {"heading": "Servizi di misurazione",
             "text": "[Modello da completare: se attiverai Google Analytics 4 o altri servizi di misurazione, aggiorna questa sezione dal pannello amministrativo e prevedi il banner di consenso conforme alla normativa.]"},
        ],
        "seo": {"seo_title": "Utilizzo dei cookie | CR Coppe & Gadget", "meta_description": "Cookie tecnici e strumenti di misurazione utilizzati dal sito di CR Coppe & Gadget.", "noindex": True, "og_image": ""},
    },
    {
        "slug": "termini-uso",
        "title": "Condizioni d'uso",
        "hero_image": "",
        "published": True,
        "blocks": [
            {"heading": "Finalità del sito",
             "text": "Questo sito ha finalità informative: presenta il catalogo dei prodotti di CR Coppe & Gadget e consente di richiedere informazioni e preventivi senza creare un account. Non è un negozio online e non consente acquisti diretti."},
            {"heading": "Limitazioni di responsabilità",
             "text": "[Modello da completare dal pannello amministrativo: aggiungi le condizioni contrattuali della tua azienda, i riferimenti legali e la legislazione applicabile.]"},
        ],
        "seo": {"seo_title": "Condizioni d'uso | CR Coppe & Gadget", "meta_description": "Condizioni di utilizzo del sito di CR Coppe & Gadget.", "noindex": True, "og_image": ""},
    },
]

SETTINGS = {
    "company_name": "CR Coppe & Gadget",
    "tagline": "Coppe, trofei e gadget aziendali personalizzati",
    "hero_title": "Premiare l'eccellenza.\nPersonalizzare il futuro.",
    "hero_subtitle": "Coppe, trofei, targhe, medaglie e gadget aziendali personalizzati per aziende, club e "
                     "società sportive: un unico partner dalla scelta del prodotto all'incisione finale.",
    "about_short": "CR Coppe & Gadget affianca aziende, club e organizzazioni nella scelta e nella "
                   "personalizzazione di coppe, trofei, targhe, medaglie e gadget: dal catalogo al progetto su "
                   "misura, con incisione e stampa realizzate per ogni occasione.",
    "email": "[email@azienda.it]",
    "phone": "[+39 000 000 0000]",
    "address": "[Via e numero civico — CAP Città (Prov)]",
    "opening_hours": "[Lunedì – Venerdì: 9:00 – 13:00 / 14:30 – 18:30]\n[Sabato: su appuntamento]\n[Domenica: chiuso]",
    "map_embed_url": "",
    "facebook": "[link pagina Facebook]",
    "instagram": "[link profilo Instagram]",
    "linkedin": "[link pagina LinkedIn]",
    "site_url": "",
    "google_analytics_id": "",
    "seo": {
        "seo_title": "CR Coppe & Gadget | Coppe, trofei e gadget personalizzati",
        "meta_description": "Coppe, trofei, targhe, medaglie e gadget aziendali personalizzati. Catalogo completo e richiesta preventivo gratuita per aziende, club e società sportive.",
        "noindex": False,
        "og_image": "",
    },
}




async def bootstrap_if_needed(include_demo=None):
    """Auto-configurazione al primo avvio: admin (solo se mancante), impostazioni e pagine essenziali.
    Chiamata a ogni cold start (middleware): con dati già presenti esegue solo i COUNT e non inserisce
    nulla. Race tra avvi simultanei: i duplicati sono bloccati dai vincoli UNIQUE e il bootstrap
    riprova all'avvio successivo. include_demo=True (CLI senza SEED_SKIP_DEMO) aggiunge categorie/prodotti demo."""
    if include_demo is None:
        include_demo = os.environ.get("SEED_SKIP_DEMO") != "1"
    try:
        await _bootstrap(include_demo)
    except Exception:
        logger.exception("Bootstrap non completato (dati forse già inseriti da un altro avvio): riproverà al prossimo avvio")


async def _bootstrap(include_demo):
    async with get_sessions()() as s:
        admin_username = os.environ.get("ADMIN_USERNAME", "admin").lower().strip()
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
        admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

        existing = (
            (await s.execute(select(User).where(User.username == admin_username))).scalar_one_or_none()
            or (await s.execute(select(User).where(User.email == admin_email))).scalar_one_or_none()
        )
        if existing is None:
            s.add(User(username=admin_username, email=admin_email, password_hash=hash_password(admin_password), name="Admin", role="admin"))
            logger.info(f"Admin seed creato: {admin_username}")
        elif not existing.username:
            existing.username = admin_username
            logger.info(f"Username admin impostato: {admin_username}")

        if (await s.execute(select(func.count()).select_from(Settings))).scalar_one() == 0:
            s.add(
                Settings(
                    id="site_settings",
                    **{k: v for k, v in SETTINGS.items() if k != "seo"},
                    seo_title=SETTINGS["seo"]["seo_title"],
                    seo_description=SETTINGS["seo"]["meta_description"],
                    seo_noindex=SETTINGS["seo"].get("noindex", False),
                    seo_og_image=SETTINGS["seo"].get("og_image", ""),
                )
            )
            logger.info("Impostazioni seed inserite")

        if include_demo and (await s.execute(select(func.count()).select_from(Category))).scalar_one() == 0:
            for c in CATEGORIES:
                s.add(
                    Category(
                        name=c["name"],
                        slug=c["slug"],
                        description=c.get("description", ""),
                        image=c.get("image", ""),
                        parent_slug=c.get("parent_slug") or None,
                        sort_order=c.get("order", 0),
                    )
                )
            logger.info(f"{len(CATEGORIES)} categorie seed inserite")

        if include_demo and (await s.execute(select(func.count()).select_from(Product))).scalar_one() == 0:
            for p in PRODUCTS:
                prod = Product(
                    **{k: v for k, v in p.items() if k not in ("gallery", "specs", "seo")},
                    seo_title=p["seo"]["seo_title"],
                    seo_description=p["seo"]["meta_description"],
                    seo_noindex=p["seo"].get("noindex", False),
                    seo_og_image=p["seo"].get("og_image", ""),
                )
                s.add(prod)
                await s.flush()
                for i, u in enumerate(p["gallery"]):
                    s.add(ProductImage(product_id=prod.id, url=u, position=i))
                for i, sp in enumerate(p["specs"]):
                    s.add(ProductSpec(product_id=prod.id, label=sp["label"], value=sp["value"], position=i))
            logger.info(f"{len(PRODUCTS)} prodotti demo inseriti")

        for pg_data in [CHI_SIAMO] + LEGAL_PAGES:
            exists = (await s.execute(select(Page.id).where(Page.slug == pg_data["slug"]))).scalar_one_or_none()
            if not exists:
                page = Page(
                    slug=pg_data["slug"],
                    title=pg_data["title"],
                    hero_image=pg_data.get("hero_image", ""),
                    published=pg_data.get("published", True),
                    seo_title=pg_data["seo"]["seo_title"],
                    seo_description=pg_data["seo"]["meta_description"],
                    seo_noindex=pg_data["seo"].get("noindex", False),
                    seo_og_image=pg_data["seo"].get("og_image", ""),
                )
                s.add(page)
                await s.flush()
                for i, b in enumerate(pg_data["blocks"]):
                    s.add(PageBlock(page_id=page.id, heading=b.get("heading", ""), text=b.get("text", ""), position=i))
        logger.info("Pagine seed verificate")

        await s.commit()


async def run_seed():
    await bootstrap_if_needed()


if __name__ == "__main__":
    import asyncio

    asyncio.run(run_seed())
