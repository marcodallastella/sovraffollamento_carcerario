# Monitoring Prison Overcrowding in Italy

Author: Marco Dalla Stella \
Contact: [md3934@columbia.edu](mailto:md3934@columbia.edu)

## Intro

Questo progetto si propone di fornire dati aggregati e aggiornati sul problema del sovraffollamento carcerario in Italia. È stato sviluppato in supporto al lavoro condotto da [Associazione Antigone](https://www.antigone.it/) e in appoggio al loro XX rapporto annuale.

L'ispirazione proviene da [Data Liberation Project](https://www.data-liberation-project.org/about/), un'iniziativa che si propone di identificare, ottenere, ripulire, documentare e pubblicare dati governativi di pubblico interesse.

La necessità proviene dal fatto che i dati sul sovraffollamento carcerario in Italia sono sparsi e non di facile consultazione. Il Ministero della Giustizia mette a disposizione principalmente due tipologie di dati:

1 I [bollettini mensili](ttps://www.giustizia.it/giustizia/it/mg_1_14_1.page?contentId=SST459023): pubblicati con cadenza mensile, contengono informazioni circa la capacità regolamentare, totale dei detenuti, totale dei detenuti donna, e totale dei detenuti di origine straniera per ogni centro di detenzione in Italia. I dati sono pubblicati sotto forma di tabella sul sito del Ministero, e non in un formato strutturato come ad esempio `.csv`.

2 [Schede istituti penitenziari](https://www.giustizia.it/giustizia/page/it/istituti_penitenziari): schede con informazioni più dettagliate su ogni istituto penitenziario. Queste schede contengono informazioni necessarie a comprendere il fenomeno del sovraffollamento carcerario in Italia come la quantità di posti non disponibili. Spesso infatti il sovraffollamento carcerario viene calcolato sulla capienza regolamentare degli istituti, e non sulla capienza effettiva.
Queste informazioni sono pubblicate tabelle sparse sulle pagine di ogni singolo istituto e non sono fornite in un formato strutturato come ad esempio `.csv`.


## Data

- `istituti_info`(https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/main/outputs/clean/institutes_info.csv) \
Dataset contente le informazioni più recenti disponibili riguardo gli istituti penitenziari attualmente attivi in Italia, estratte dalla pagina [Schede trasparenza istituti penitenziari](https://www.giustizia.it/giustizia/page/it/istituti_penitenziari).

1. [istituti_data](https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/main/outputs/clean/istituti_data.csv) \
Dataset contenente i dati provenienti dalle singole schede istituti penitenziari. Colonne includono:
- `id`
-`nome`
- `tipo`
- `posti_regolamentari`
- `posti_non_disponibili`
- `posti_occupati`
- `posti_aggiornati_al`
- `asl`
- `nome_responsabile_asl`
- `cognome_responsabie_asl`
- `nome_direttore`
- `cognome_direttore`
- `ruolo_direttore`
- `personale_polizia_effettivi`
- `personale_polizia_previsti`
- `personale_amministrativi_effettivi`
- `personale_amministrativi_previsti`
- `personale_educatori_effettivi`
- `personale_educatori_previsti`
- `personale_polizia_aggiornato_al`
- `personale_amministrativo_aggiornato_al`

## Notebooks

### 1_scraper_institutes_info

Questo notebook contiene il codice utilizzato per estrarre le informazioni relative agli istituti penitenziari in Italia. Utilizza playwright per estrarre il codice sorgente della pagina [Schede trasparenza istituti penitenziari](https://www.giustizia.it/giustizia/page/it/istituti_penitenziari). Poiché le informazioni sui singoli istituti sono caricate tramite JavaScript, lo script fa uso di RegEx per estrarre le informazioni rilevanti dal codice sorgente.


### 2_scraper_institutes_data.ipynb

Questo notebook contiene il codice utilizzato per estrarre le informazioni dalle singole schede degli istituti penitenziari. Utilizza playwright e i codici identificativi salvati su `istituti_info` per visitare ognuna della singole schede, scaricare il codice sorgente, e poi BeautifulSoup per estrarre le informazioni rilevanti.


Marco Dalla Stella
