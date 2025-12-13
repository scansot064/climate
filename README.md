☀️ Climate Diagram Generator

The Climate Diagram Generator is a sophisticated, open-source web tool designed to produce modern, highly readable climate charts (Climographs) with a strong emphasis on cartographic coherence and scientific accuracy.

This project was initiated to address common limitations found in existing climate data visualization tools, specifically concerning poor vertical axis scaling, data crowding, and outdated user interface design.
✨ Key Features and Technical Specifications
Feature Category	Description
Data Visualization Coherence	Generates high-quality charts using a modern UI aesthetic, prioritizing readability and scientific accuracy. Includes the ability to adjust chart height for optimal display and export.
Gaussen Index Compliance	Critical Feature: The vertical axes for temperature and precipitation are scaled to respect Gaussen's Aridity Index (P=2T), ensuring direct visual representation of drought periods.
Standardized Axis Scaling	Precipitation axis consistently starts at zero (0 mm), even when negative temperatures are present, maintaining strict data integrity and consistency.
Global Data Access	Provides access to climate data for virtually every major city worldwide, covering most countries.
Köppen Classification	Integrates an internal, accurate Köppen-Geiger classification algorithm to provide the climate code for the visualized location.
Tech Stack	Built on a robust foundation of vanilla JavaScript, utilizing popular libraries: Chart.js for rendering professional-grade charts and PapaParse.js for efficient, client-side handling and parsing of raw CSV climate data.
Output & Usability	Generated charts are easily exportable in PNG format for research, educational, or professional use.


🗺️ Current Roadmap

Future development focuses on improving user experience, data breadth, and code maintainability:

Improved City Selection: Enhance the city search interface (autocomplete/datalist) for a more efficient and user-friendly data selection process.

Data Refinement: Implement a solution to resolve duplicated city names, especially in large countries (e.g., the USA), potentially by adding state/region options.

Station Expansion: Integrate climate stations from underrepresented regions, including additional Arctic and Antarctic locations.

Code Separation: Refactor the codebase to separate CSS styling from HTML logic, improving modularity and long-term maintainability.

KEY DATA:

City names from Cities with more than 1000 people, Geonames.
GeoNames was founded by Marc Wick. You can reach him at marc@geonames.org
GeoNames is a project of Unxos GmbH, Tutilostrasse 17d, 9011 St. Gallen, Switzerland. 
https://www.geonames.org/about.html

Temperature and precipitation data processed by myself using Python and cities' geographical coordinates, from raster files at:
Fick, S.E. and R.J. Hijmans, 2017. WorldClim 2: new 1km spatial resolution climate surfaces for global land areas. International Journal of Climatology 37 (12): 4302-4315.
https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_30s_tavg.zip
https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_30s_prec.zip

About WorldClim License
The data are freely available for academic use and other non-commercial use. Redistribution or commercial use is not allowed without prior permission. Using the data to create maps for publishing of academic research articles is allowed. Thus you can use the maps you made with WorldClim data for figures in articles published by PLoS, Springer Nature, Elsevier, MDPI, etc. You are allowed (but not required) to publish these articles (and the maps they contain) under an open license such as CC-BY as is the case with PLoS journals and may be the case with other open access articles. 
