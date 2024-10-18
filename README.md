# I Dati sul Sovraffollamento Carcerario in Italia 

Author: Marco Dalla Stella \
Contact: [md3934@columbia.edu](mailto:md3934@columbia.edu)

## Introduzione

Questo progetto si propone di fornire dati aggregati e aggiornati sul problema del sovraffollamento carcerario in Italia.

Il progetto si ispira al [Data Liberation Project](https://www.data-liberation-project.org/about/), un'iniziativa che mira a identificare, ottenere, ripulire, documentare e pubblicare dati governativi di pubblico interesse.

La necessità nasce dal fatto che i dati sul sovraffollamento carcerario in Italia sono sparsi e di difficile consultazione. Il Ministero della Giustizia mette a disposizione principalmente due tipologie di dati:

1 I [bollettini mensili](ttps://www.giustizia.it/giustizia/it/mg_1_14_1.page?contentId=SST459023): pubblicati con cadenza mensile, contengono informazioni riguardo alla capacità regolamentare, al totale dei detenuti, al numero di detenute, e al totale dei detenuti di origine straniera per ogni centro di detenzione in Italia. I dati sono pubblicati in formato tabellare sul sito del Ministero e non in un formato strutturato come un file .csv.

2 [Schede istituti penitenziari](https://www.giustizia.it/giustizia/page/it/istituti_penitenziari): forniscono informazioni più dettagliate su ogni istituto penitenziario, inclusi dettagli come il numero di posti non disponibili. Questi dati sono essenziali per comprendere il fenomeno del sovraffollamento, in quanto la capienza regolamentare spesso non riflette quella effettiva. Le informazioni sono pubblicate in tabelle distribuite sulle singole pagine di ciascun istituto e, una volta aggiornate, le versioni precedenti non sono più disponibili.


## Dati Principali

- [Bollettini mensili](outputs/clean/bulletines.csv): contiene tutti i bollettini mensili emessi da gennaio 2019 a oggi (con l’eccezione di ottobre 2021, che sembra mancare sul sito del Ministero).
- [Dati per istituto](outputs/clean/institutes.csv): include tutti gli aggiornamenti alle singole pagine degli istituti penitenziari, a partire da ottobre 2024, quando lo scraper è stato finalizzato e programmato per avviarsi con cadenza giornaliera.

## Dati di Supporto

- [Bollettini links](outputs/clean/bulletines_links.csv): contiene i link ai vari bollettini mensili pubblicati sul sito del Ministero.
- [Informazioni istituti](outputs/clean/institutes_info.csv): contiene informazioni aggiornate sugli istituti penitenziari in Italia, inclusi tipologia, indirizzo e coordinate geografiche.

## Dataset per Visualizzazioni

- [Bollettini Totali](outputs/viz/bulletines_totals.csv): contiene i dati mensili totali, aggregati per data.
- [Istituti Totali](outputs/viz/institutes_totals.csv): aggrega i dati delle schede istituti per data di aggiornamento.
- [Istituti - Ultimo Aggiornamento](outputs/viz/institutes_most_recent.csv): contiene l'ultimo aggiornamento disponibile delle informazioni presenti sulle schede istituti. Poiché le schede non vengono aggiornate simultaneamente, è possibile che alcuni istituti abbiano aggiornamenti più recenti di altri.

## Notebooks

Questo progetto si avvale dei seguenti notebooks:

#### Bollettini
1. [Links Scraper](notebooks/1_Bulletines_1_Links_scraper.ipynb): ottiene i link ai bollettini mensili utilizzando browser automation con Playwright. Visita la pagina del Ministero, effettua la ricerca e raccoglie i link pertinenti.
2. [Scraper](notebooks/1_Bulletines_2_Scraper.ipynb): scarica i dati dei bollettini utilizzando i link raccolti nel notebook precedente.
3. [Clean](notebooks/1_Bulletines_3_Clean.ipynb): ripulisce e standardizza i dati, ad esempio omologando i nomi dei vari istituti (es. "Milano S. Vittore" e "Milano San Vittore").
4. [Analisi](notebooks/1_Bulletines_5_Analysis_.ipynb): esegue l’analisi dei dati ripuliti e crea i file necessari per le visualizzazioni.
5. [Scraper mensile](notebooks/1_Bulletines_4_Monthly_scraper.ipynb): eseguito automaticamente ogni mese per scaricare i dati relativi al mese appena trascorso.

#### Schede Istituti Penitenziari
- [Informazioni istituti Scraper](notebooks/2_Institutes_1_Info_scraper.ipynb): ottiene informazioni aggiornate sugli istituti penitenziari attualmente in funzione.
- [Analisi](notebooks/3_Institutes_3_Analysis.ipynb): eseguito automaticamente ogni giorno per raccogliere i dati aggiornati dalle schede istituti.
- [Scraper giornaliero](notebooks/2_Institutes_2_Daily_scraper.ipynb): esegue l’analisi dei dati e crea i file per le visualizzazioni.

