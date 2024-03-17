Prison Overcrowding in Italy
A monitoring project

Author: Marco Dalla Stella

## Intro

This repository contains all the data and notebooks for the project "Schiacciati" (literally: squeezed, but also crushed).\
\
The project aims to report on the problem of prison overcrowding in Italy, collecting government data about Italian prisons' capacity and actual detainees over the years. In particular, it was developed in support of the great work being done by the [Associazione Antigone](https://www.antigone.it/), the main Italian organization defending the rights of people deprived of their liberty.\
\
I used this project also to practice different scraping techniques, as well as some data visualization. [Here](https://marcodallastella.github.io/schiacciati/) you can find the final website (it's in Italian, but there's not so much text).

## Notebooks

### 1_scraper_bulletins.ipynb

This notebook contains the code I used to scrape the data about monthly bulletins. After some attempts with requests and playwright, I eventually settled on Selenium as it was giving me the best results in having the pages successfully loaded (especially in headless mode).\
\
The Ministry of Justice publishes monthly [bulletins](https://www.giustizia.it/giustizia/it/mg_1_14_1.page?contentId=SST459023) about the state of detention centers' inmates, but it does not keep a unique structured database. To get the data, this notebook utilizes three phases:

1) A scraper for the [statistics section](https://www.giustizia.it/giustizia/page/it/statistiche) of the Ministry to identify as many links as possible to the pages containing the data I needed, identified using the string `detenuti italiani e stranieri presenti e capienze per istituto`.
2) A scraper that visits all the fetched links and stores the HTML code locally. This was convenient as the tables are a bit funky (multi-level headers😠) and some trial-and-error was needed.
3) Parsing the HTML files with BeautifulSoup to get the data in a structured and semi-clean format. The output is `outputs/raw/bollettini_mensili_raw.csv`.

### 1_scraper_institutes.ipynb

This is a different scraper used to collect data about specific pages of the various detention centers. In fact, in addition to the monthly bulletin, each center publishes on a dedicated page interesting data such as staff presences and room availability. It turns out that the official capacity of many institutes does not reflect the *real* capacity, but this information is not reflected in the monthly bulletins.\
\
This notebook then uses Selenium to visit the webpage [https://www.giustizia.it/giustizia/page/it/istituti_penitenziari](https://www.giustizia.it/giustizia/page/it/istituti_penitenziari) and download the source code locally. Because information about specific institutes (including geographic coordinates) is not part of the HTML code but is instead loaded via JavaScript, I made extensive use of RegEx to identify the various pieces of information and put them together.\
\
As a result, this part of the code produces `outputs/clean/istituti_penitenziari.csv`, a file containing generic information about all detention centers in Italy (including name, type, address, phone number, geographic coordinates).


### 2_scraper_bulletins_monthly

This is a version of the monthly bulletins scraper designed to run once a month to fetch data about recently published bulletins and append the data to the existing `bollettini_mensili_raw` CSV file.

### 2_scraper_institutes_monthly

This notebook uses the previously fetched ID numbers of the various detention centers to determine the single webpages for every institute, as they are all in the format `https://www.giustizia.it/giustizia/it/dettaglio_scheda.page?s={id_number}`.\
\
It uses Selenium to store the source code of the various institutes' webpages locally and then uses BeautifulSoup to parse it and extract relevant information. The output is `outputs/clean/istituti_penitenziari_data.csv`.

### 3_cleaning_bulletins.ipynb

I used this notebook for all the basic cleaning and formatting numbers correctly. However, the detention centers appear in the various bulletins with dozens of different spellings that needed special attention.\
\
To clean and standardize the detention centers' names, I used the previously fetched institutes' names and NLTK to tokenize the various names, find the best match, and use it to replace the previous names. Because this method is not 100% proof, some manual checks were needed. The output is stored in `outputs/clean/istituti_penitenziari.csv`.


### 3-analysis.ipynb
I used this notebook to analyze the data and extract tables that I thought could be useful to create visualizations.\
\
For any questions, inquiries, critiques, or suggestions, please do not hesitate to reach me at [md3934@columbia.edu](mailto:md3934@columbia.edu).\
\
Marco Dalla Stella
