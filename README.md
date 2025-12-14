🌍 🏞 🏖 Climate Diagram Generator 🏜 🏔 🌞 🌈

The Climate Diagram Generator is a fairly simple, open-source web tool designed to produce modern, highly readable climate charts (Climographs) with scientific accuracy.

This project was initiated to address common limitations found in existing climate data visualization tools, specifically concerning poor vertical axis scaling, data crowding, and outdated user interface design.

Key Features and Technical Specifications

✔ Data Visualization Coherence
Generates high-quality charts using a modern UI aesthetic, prioritizing readability and scientific accuracy. Includes the ability to adjust chart height for optimal display and export.

✔ Gaussen Index Compliance
Critical Feature: The vertical axes for temperature and precipitation are scaled to respect Gaussen's Aridity Index (P=2T), ensuring direct visual representation of drought periods.

✔ Standardized Axis Scaling
Precipitation axis consistently starts at zero (0 mm), even when negative temperatures are present, maintaining design (unlike climate-data.org where bars start at the bottom, regardless of negative temperatures, making the charts completely unusable).

✔ Global Data Access
Provides access to climate data for virtually every city above 1000 inhabitants worldwide, covering most countries.

✔ Köppen Classification
Integrates an internal, accurate Köppen-Geiger classification algorithm to provide the climate code for the visualized location. Check algorithm in text file.

✔ Tech Stack
Built on a robust foundation of vanilla JavaScript, utilizing popular libraries: Chart.js for rendering professional-grade charts and PapaParse.js for efficient, client-side handling and parsing of raw CSV climate data.

✔ Output & Usability
Generated charts are easily exportable in PNG format for research, educational, or professional use.


🗺️ Current Roadmap

Future development focuses on improving user experience and visual appeal.

Station Expansion: Integrate climate stations from underrepresented regions, including strange status territories and island I had to remove from the CSV files for simplicity due to lacking country codes, and additional Arctic and Antarctic locations.

Better mobile experience.

Other languages than English. Providing diagrams and UI in German, Spanish, French, Italian, Japanese, Chinese, or Russian.
