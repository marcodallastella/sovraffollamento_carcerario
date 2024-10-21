# Prison Overcrowding Data in Italy

Author: Marco Dalla Stella \
Contact: [md3934@columbia.edu](mailto:md3934@columbia.edu)

## Introduction

This project provides aggregated and up-to-date data on the issue of prison overcrowding in Italy. This data is crucial for understanding systemic inefficiencies, human rights issues, and the capacity planning of the Italian penal system. Takaways and data visualizations are available at [sovraffollamentocarcerario.it](https://www.sovraffollamentocarcerario.it).

The need for this project stems from the scattered and difficult-to-access nature of Italy's prison overcrowding data. The Ministry of Justice provides two main types of data:

1. **[Monthly Bulletins](https://www.giustizia.it/giustizia/it/mg_1_14_1.page?contentId=SST459023)**: Published monthly, these bulletins contain information on regular capacity, total inmates, number of female inmates, and the total number of foreign inmates for each detention center in Italy. However, the data is published in non-structured table formats on the Ministry’s website instead of more accessible formats like CSV files.

2. **[Prison Institution Sheets](https://www.giustizia.it/giustizia/page/it/istituti_penitenziari)**: These sheets provide detailed information for each penitentiary institution, including the number of unavailable beds. This information is essential for understanding overcrowding, as regular capacity often differs from the actual capacity. These tables are published on individual institution pages and are not archived.

## Main Data

- **[Monthly Bulletins](outputs/clean/bulletines.csv)**: Contains all monthly bulletins from January 2019 to the present.
- **[Institution Data](outputs/clean/institutes.csv)**: Includes updates from individual prison institution pages starting in October 2024, when the scraper was set up for daily runs.

## Supporting Data

- **[Bulletin Links](outputs/clean/bulletines_links.csv)**: Contains links to the various monthly bulletins published on the Ministry’s website.
- **[Institution Information](outputs/clean/institutes_info.csv)**: Contains updated information on Italian penitentiary institutions, including type, address, and geographical coordinates.

## Datasets for Visualization

- **[Total Bulletins](outputs/viz/bulletines_totals.csv)**: Contains monthly totals aggregated by date, useful for trend analysis.
- **[Total Institutions](outputs/viz/institutes_totals.csv)**: Aggregates data from institution sheets based on update dates.
- **[Institutions - Most Recent Update](outputs/viz/institutes_most_recent.csv)**: Provides the latest available data from institution sheets. Since updates are non-simultaneous, some institutions may have more recent data than others.
- **[Overcrowding Rate](outputs/viz/tasso_affollamento.csv)**: Contains both official and real overcrowding rates. Missing data is estimated using [interpolation](https://academy.datawrapper.de/article/321-patchy-data).

## Notebooks

The project uses the following notebooks to collect, clean, and analyze data:

#### Bulletins
1. **[Links Scraper](notebooks/1_Bulletines_1_Links_scraper.ipynb)**: Automates the collection of monthly bulletin links using Playwright, a browser automation tool, which scrapes the Ministry's page for relevant links.
2. **[Bulletin Data Scraper](notebooks/1_Bulletines_2_Scraper.ipynb)**: Downloads bulletin data using the links gathered from the previous notebook.
3. **[Data Cleaning](notebooks/1_Bulletines_3_Clean.ipynb)**: Cleans and standardizes data, for instance, by ensuring consistency in the names of penitentiary institutions (e.g., unifying variations like "Milano S. Vittore" and "Milano San Vittore").
4. **[Data Analysis](notebooks/1_Bulletines_5_Analysis_.ipynb)**: Performs statistical and trend analysis on cleaned data and generates files for visualizations and reports.
5. **[Monthly Scraper](notebooks/1_Bulletines_4_Monthly_scraper.ipynb)**: This script runs automatically every month to collect the most recent bulletin data.

#### Prison Institution Sheets
1. **[Institution Info Scraper](notebooks/2_Institutes_1_Info_scraper.ipynb)**: Collects updated details on currently operational penitentiary institutions.
2. **[Daily Analysis](notebooks/3_Institutes_3_Analysis.ipynb)**: Automatically runs each day to gather and analyze new updates from prison institution sheets.
3. **[Daily Scraper](notebooks/2_Institutes_2_Daily_scraper.ipynb)**: Gathers data and prepares it for visualization by running daily analysis.

## How to Use These Datasets

The datasets are designed to help researchers, journalists, and policymakers understand the scope and impact of prison overcrowding in Italy. They can be used for trend analysis, to compare official vs. real prison capacities, and to visualize the geographic distribution of overcrowding rates.

For visualizations, the cleaned datasets can be easily imported into tools like Datawrapper or Tableau, or used in Python/R for custom analysis.

Since the data is collected via a scraper and the website structure may change over time, it is recommended to manually verify the data if possible to ensure its accuracy.

If this dataset is used, please attribute it to **Marco Dalla Stella**.
