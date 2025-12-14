// Country code lookup table - loaded from external JSON file
let countryNames = {};

let climateData = [];
let chart = null;
let currentTemperatures = null;
let currentPrecipitation = null;
let currentLatitude = null;  // Store latitude for auto hemisphere detection
let isManualInput = false;   // Flag to track if using manual input
let koppenData = {};
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Load country codes from JSON file
async function loadCountryCodes() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/country-codes.json');
        if (response.ok) {
            countryNames = await response.json();
            console.log('Country codes loaded:', Object.keys(countryNames).length, 'countries');
        } else {
            console.error('Failed to load country codes');
            countryNames = { "TS": "Test Country A", "TX": "Test Country B" };
        }
    } catch (error) {
        console.error('Error loading country codes:', error);
        countryNames = { "TS": "Test Country A", "TX": "Test Country B" };
    }
}

// Load Köppen climate descriptions
async function loadKoppenData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/koppen-climate-data.json');
        if (response.ok) {
            koppenData = await response.json();
            console.log('Köppen data loaded');
        }
    } catch (error) {
        console.error('Error loading Köppen data:', error);
    }
}

// Load data on page load
loadCountryCodes();
loadKoppenData();

// Update chart height
function updateChartHeight(height) {
    document.getElementById('chartContainer').style.height = height + 'px';
    document.getElementById('heightValue').textContent = height + 'px';
    if (chart) {
        chart.resize();
    }
}

// Load continent CSV file
async function loadContinent() {
    const continent = document.getElementById('continentSelect').value;
    if (!continent) return;

    // Reset dependent dropdowns
    document.getElementById('countrySelect').innerHTML = '<option value="">-- Select Country --</option>';
    document.getElementById('countrySelect').disabled = true;
    document.getElementById('citySearch').value = '';
    document.getElementById('citySearch').disabled = true;
    document.getElementById('citySearch').placeholder = 'Type to search cities...';
    document.getElementById('citySelect').value = '';
    document.getElementById('cityDropdown').innerHTML = '';
    document.getElementById('cityDropdown').classList.remove('active');
    currentCities = [];
    document.getElementById('locationInfo').style.display = 'none';

    // Show loading
    document.getElementById('continentLoading').style.display = 'block';

    // Handle TEST continent with hardcoded data
    if (continent === 'test') {
        climateData = [
            {
                continent: 'Test',
                country: 'TS',
                city: 'Temperate City',
                lat: '45.0',
                lon: '10.0',
                temperatures: '[10, 11, 14, 17, 21, 25, 28, 27, 24, 19, 14, 11]',
                precipitation: '[65, 55, 50, 55, 70, 80, 60, 65, 75, 85, 80, 70]'
            },
            {
                continent: 'Test',
                country: 'TS',
                city: 'Cold City',
                lat: '60.0',
                lon: '20.0',
                temperatures: '[-8, -6, 0, 8, 15, 20, 22, 20, 15, 8, 2, -4]',
                precipitation: '[30, 25, 30, 40, 55, 70, 75, 70, 50, 40, 35, 35]'
            },
            {
                continent: 'Test',
                country: 'TX',
                city: 'Tropical City',
                lat: '5.0',
                lon: '-50.0',
                temperatures: '[27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 27]',
                precipitation: '[260, 288, 314, 300, 256, 114, 88, 58, 83, 126, 183, 217]'
            }
        ];

        console.log('Loaded TEST data with', climateData.length, 'cities');
        populateCountries();
        document.getElementById('continentLoading').style.display = 'none';
        return;
    }

    // GitHub raw URLs
    const continentUrls = {
        'africa': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/Africa.csv',
        'antarctic': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/Antarctic.csv',
        'arctic': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/Arctic.csv',
        'asia': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/Asia.csv',
        'europe': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/Europe.csv',
        'north-america': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/North_America.csv',
        'oceania': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/Oceania.csv',
        'south-america': 'https://raw.githubusercontent.com/scansot064/climate/refs/heads/main/South_America.csv'
    };

    const csvUrl = continentUrls[continent];

    console.log('Fetching:', csvUrl);

    try {
        const response = await fetch(csvUrl);

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();

        console.log('CSV length:', csvText.length);
        console.log('First 200 chars:', csvText.substring(0, 200));

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            quoteChar: '"',
            escapeChar: '"',
            comments: false,
            complete: function (results) {
                if (results.data && results.data.length > 0) {
                    climateData = results.data;
                    console.log(`Loaded ${climateData.length} cities from ${continent}`);
                    populateCountries();
                    document.getElementById('continentLoading').style.display = 'none';
                } else {
                    throw new Error('No data found in CSV file');
                }
            },
            error: function (error) {
                console.error('Error parsing CSV:', error);
                alert('Error parsing data. Please check the CSV format.');
                document.getElementById('continentLoading').style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error fetching CSV:', error);
        alert(`Error loading data: ${error.message}`);
        document.getElementById('continentLoading').style.display = 'none';
    }
}

// Populate country dropdown
function populateCountries() {
    const countrySelect = document.getElementById('countrySelect');
    const countries = [...new Set(climateData.map(row => row.country))].sort();

    countries.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = countryNames[code] || code;
        countrySelect.appendChild(option);
    });

    countrySelect.disabled = false;
}

// Store current list of cities for autocomplete
let currentCities = [];
let highlightedIndex = -1;

// Load cities for selected country
function loadCountry() {
    const countryCode = document.getElementById('countrySelect').value;
    const citySearch = document.getElementById('citySearch');
    const cityDropdown = document.getElementById('cityDropdown');

    // Hide location info and chart when country changes
    document.getElementById('locationInfo').style.display = 'none';
    document.getElementById('climateChart').style.display = 'none';
    document.querySelector('.welcome-message').style.display = 'block';
    document.getElementById('exportBtn').style.display = 'none';

    // Reset autocomplete
    citySearch.value = '';
    document.getElementById('citySelect').value = '';
    cityDropdown.innerHTML = '';
    cityDropdown.classList.remove('active');
    currentCities = [];
    highlightedIndex = -1;

    if (!countryCode) {
        citySearch.disabled = true;
        citySearch.placeholder = 'Type to search cities...';
        return;
    }

    // Map cities with their ORIGINAL index in climateData array
    currentCities = climateData
        .map((row, originalIndex) => ({ row, originalIndex }))
        .filter(item => item.row.country === countryCode)
        .map(item => ({ name: item.row.city, index: item.originalIndex }))
        .sort((a, b) => a.name.localeCompare(b.name));

    citySearch.disabled = false;
    citySearch.placeholder = `Search ${currentCities.length} cities...`;
    citySearch.focus();
}

// Initialize autocomplete event listeners
document.addEventListener('DOMContentLoaded', function () {
    const citySearch = document.getElementById('citySearch');
    const cityDropdown = document.getElementById('cityDropdown');

    // Input event - filter cities as user types
    citySearch.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        highlightedIndex = -1;

        if (query.length === 0) {
            cityDropdown.classList.remove('active');
            cityDropdown.innerHTML = '';
            return;
        }

        // Filter cities that start with or contain the query
        const startsWithMatches = currentCities.filter(city =>
            city.name.toLowerCase().startsWith(query)
        );
        const containsMatches = currentCities.filter(city =>
            !city.name.toLowerCase().startsWith(query) &&
            city.name.toLowerCase().includes(query)
        );

        const filtered = [...startsWithMatches, ...containsMatches].slice(0, 20);

        renderDropdown(filtered, query);
    });

    // Keyboard navigation
    citySearch.addEventListener('keydown', function (e) {
        const items = cityDropdown.querySelectorAll('.city-dropdown-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                items[highlightedIndex].click();
            }
        } else if (e.key === 'Escape') {
            cityDropdown.classList.remove('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.city-autocomplete-container')) {
            cityDropdown.classList.remove('active');
        }
    });

    // Show dropdown on focus if there's text
    citySearch.addEventListener('focus', function () {
        if (this.value.trim().length > 0 && cityDropdown.children.length > 0) {
            cityDropdown.classList.add('active');
        }
    });
});

function renderDropdown(cities, query) {
    const dropdown = document.getElementById('cityDropdown');
    dropdown.innerHTML = '';

    if (cities.length === 0) {
        dropdown.innerHTML = '<div class="city-dropdown-empty">No cities found matching "' + escapeHtml(query) + '"</div>';
        dropdown.classList.add('active');
        return;
    }

    // Info about total matches
    const totalMatches = currentCities.filter(c => c.name.toLowerCase().includes(query)).length;
    if (totalMatches > 20) {
        const info = document.createElement('div');
        info.className = 'city-dropdown-info';
        info.textContent = `Showing 20 of ${totalMatches} matches. Type more to narrow down.`;
        dropdown.appendChild(info);
    }

    cities.forEach((city, idx) => {
        const item = document.createElement('div');
        item.className = 'city-dropdown-item';
        item.dataset.index = city.index;

        // Highlight matching text
        const cityName = city.name;
        const lowerName = cityName.toLowerCase();
        const matchIndex = lowerName.indexOf(query);

        if (matchIndex >= 0) {
            const before = cityName.substring(0, matchIndex);
            const match = cityName.substring(matchIndex, matchIndex + query.length);
            const after = cityName.substring(matchIndex + query.length);
            item.innerHTML = escapeHtml(before) + '<span class="match-highlight">' + escapeHtml(match) + '</span>' + escapeHtml(after);
        } else {
            item.textContent = cityName;
        }

        item.addEventListener('click', function () {
            selectCity(city.index, city.name);
        });

        dropdown.appendChild(item);
    });

    dropdown.classList.add('active');
}

function updateHighlight(items) {
    items.forEach((item, idx) => {
        item.classList.toggle('highlighted', idx === highlightedIndex);
        if (idx === highlightedIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

function selectCity(index, name) {
    document.getElementById('citySearch').value = name;
    document.getElementById('citySelect').value = index;
    document.getElementById('cityDropdown').classList.remove('active');
    loadCity();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load climate data for selected city
function loadCity() {
    const cityIndex = document.getElementById('citySelect').value;
    if (!cityIndex) return;

    const cityData = climateData[cityIndex];

    console.log('City data:', cityData);
    console.log('Raw temperatures:', cityData.temperatures);
    console.log('Raw precipitation:', cityData.precipitation);

    // Parse temperatures and precipitation
    let temperatures, precipitation;

    try {
        // If they're already arrays (test data), use them directly
        if (Array.isArray(cityData.temperatures)) {
            temperatures = cityData.temperatures;
        } else {
            // Clean and parse string to array
            let tempStr = cityData.temperatures.trim();
            console.log('Cleaned temp string:', tempStr);
            temperatures = JSON.parse(tempStr);
        }

        if (Array.isArray(cityData.precipitation)) {
            precipitation = cityData.precipitation;
        } else {
            let precipStr = cityData.precipitation.trim();
            console.log('Cleaned precip string:', precipStr);
            precipitation = JSON.parse(precipStr);
        }

        // Convert to numbers if they're strings
        temperatures = temperatures.map(t => typeof t === 'string' ? parseFloat(t) : t);
        precipitation = precipitation.map(p => typeof p === 'string' ? parseFloat(p) : p);

        console.log('Parsed temperatures:', temperatures);
        console.log('Parsed precipitation:', precipitation);

        // Validate arrays
        if (!Array.isArray(temperatures) || temperatures.length !== 12) {
            throw new Error('Invalid temperature data: expected 12 values, got ' + temperatures.length);
        }
        if (!Array.isArray(precipitation) || precipitation.length !== 12) {
            throw new Error('Invalid precipitation data: expected 12 values, got ' + precipitation.length);
        }

        // Check for NaN values
        if (temperatures.some(isNaN) || precipitation.some(isNaN)) {
            throw new Error('Invalid numeric values in climate data');
        }

    } catch (error) {
        console.error('Error parsing climate data:', error);
        console.error('Temperature string was:', cityData.temperatures);
        console.error('Precipitation string was:', cityData.precipitation);
        alert('Error parsing climate data for this city:\n' + error.message + '\n\nPlease try another city or check the console for details.');
        return;
    }

    // Update info display
    document.getElementById('infoCity').textContent = cityData.city;
    document.getElementById('infoCountry').textContent = countryNames[cityData.country] || cityData.country;
    document.getElementById('infoCoords').textContent = `${cityData.lat}°, ${cityData.lon}°`;
    document.getElementById('locationInfo').style.display = 'block';

    // Store latitude for hemisphere auto-detection and mark as database input
    currentLatitude = parseFloat(cityData.lat);
    isManualInput = false;

    // Generate diagram
    generateDiagram(temperatures, precipitation, cityData.city, countryNames[cityData.country] || cityData.country);
}

// Track current location for export
let currentCityName = '';
let currentCountryName = '';

// Generate climate diagram
function generateDiagram(temperatures, precipitation, city, country) {
    // Store current data for Köppen classification and Export
    currentTemperatures = temperatures;
    currentPrecipitation = precipitation;
    currentCityName = city;
    currentCountryName = country;

    // Reset Köppen classification result
    document.getElementById('koppenResult').style.display = 'none';
    document.getElementById('koppenCode').textContent = '';
    document.getElementById('koppenDesc').innerHTML = '';

    // Show Köppen classify button
    document.getElementById('classifyBtn').style.display = 'block';

    document.getElementById('climateChart').style.display = 'block';
    document.querySelector('.welcome-message').style.display = 'none';
    document.getElementById('exportBtn').style.display = 'block';

    const chartTitle = `${city}, ${country}`;

    // Calculate axis ranges
    const actualTempMin = Math.min(...temperatures);
    const tempMin = Math.floor(actualTempMin / 5) * 5;
    const tempMax = Math.ceil(Math.max(...temperatures) / 5) * 5;
    const requiredTempMax = Math.ceil(Math.max(...precipitation) / 10) * 5;

    // Only go below zero if there are actually negative temperatures
    let finalTempMin = actualTempMin < 0 ? tempMin : 0;
    let finalTempMax = Math.max(tempMax, requiredTempMax);

    let precipMin = finalTempMin * 2;
    let precipMax = finalTempMax * 2;

    // Add margins
    const tempRange = finalTempMax - finalTempMin;
    const tempMargin = Math.ceil(tempRange * 0.05 / 5) * 5;
    const precipMargin = tempMargin * 2;

    finalTempMin = finalTempMin - tempMargin;
    finalTempMax = finalTempMax + tempMargin;
    precipMin = precipMin - precipMargin;
    precipMax = precipMax + precipMargin;

    // Don't let the minimum go below zero if there are no negative temperatures
    if (actualTempMin >= 0 && finalTempMin < 0) {
        finalTempMin = 0;
        precipMin = 0;
    }

    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('climateChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    type: 'bar',
                    label: 'Precipitation (mm)',
                    data: precipitation,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y-precip',
                    order: 2,
                    barPercentage: 0.95,
                    categoryPercentage: 0.98
                },
                {
                    type: 'line',
                    label: 'Temperature (°C)',
                    data: temperatures,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    yAxisID: 'y-temp',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 25
                    }
                },
                subtitle: {
                    display: true,
                    text: 'Created by scansot064 AT g.educaand.es - claude.ai - Geonames - WorldClim - CC BY 4.0',
                    font: {
                        size: 10,
                        style: 'italic'
                    },
                    color: '#999',
                    padding: {
                        top: 5,
                        bottom: 10
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 13
                        },
                        padding: 15
                    }
                }
            },
            scales: {
                'y-temp': {
                    type: 'linear',
                    position: 'left',
                    min: finalTempMin,
                    max: finalTempMax,
                    ticks: {
                        stepSize: 5,
                        color: 'rgb(255, 99, 132)',
                        font: {
                            weight: 'bold'
                        },
                        callback: function (value) {
                            return value % 5 === 0 ? value : '';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: 'rgb(255, 99, 132)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                'y-precip': {
                    type: 'linear',
                    position: 'right',
                    min: precipMin,
                    max: precipMax,
                    ticks: {
                        stepSize: 10,
                        color: 'rgb(54, 162, 235)',
                        font: {
                            weight: 'bold'
                        },
                        callback: function (value) {
                            return value % 10 === 0 ? value : '';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Precipitation (mm)',
                        color: 'rgb(54, 162, 235)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Generate diagram from manual input
function generateManualDiagram() {
    const city = document.getElementById('manualCity').value.trim();
    const country = document.getElementById('manualCountry').value.trim();
    const tempInput = document.getElementById('manualTemp').value.trim();
    const precipInput = document.getElementById('manualPrecip').value.trim();

    // Validate inputs
    if (!city) {
        alert('Please enter a city/place name');
        return;
    }

    if (!country) {
        alert('Please enter a country/region');
        return;
    }

    if (!tempInput) {
        alert('Please enter temperature values');
        return;
    }

    if (!precipInput) {
        alert('Please enter precipitation values');
        return;
    }

    try {
        // Parse temperature values
        const temperatures = tempInput.split(',').map(v => {
            const num = parseFloat(v.trim());
            if (isNaN(num)) {
                throw new Error('Invalid temperature value: ' + v);
            }
            return num;
        });

        // Parse precipitation values
        const precipitation = precipInput.split(',').map(v => {
            const num = parseFloat(v.trim());
            if (isNaN(num)) {
                throw new Error('Invalid precipitation value: ' + v);
            }
            return num;
        });

        // Validate array lengths
        if (temperatures.length !== 12) {
            alert(`Temperature values: expected 12, got ${temperatures.length}`);
            return;
        }

        if (precipitation.length !== 12) {
            alert(`Precipitation values: expected 12, got ${precipitation.length}`);
            return;
        }

        // Hide location info from selector
        document.getElementById('locationInfo').style.display = 'none';

        // Mark as manual input (no coordinates available)
        isManualInput = true;
        currentLatitude = null;

        // Generate diagram
        generateDiagram(temperatures, precipitation, city, country);

    } catch (error) {
        alert('Error parsing data: ' + error.message);
    }
}

// Export chart as PNG
function exportChart() {
    if (!chart) {
        alert('Please generate a diagram first');
        return;
    }

    const canvas = document.getElementById('climateChart');
    canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Use global variables for filename, fallback to 'climate-diagram' if empty
        const safeCity = (currentCityName || 'climate').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const safeCountry = (currentCountryName || 'diagram').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const filename = `${safeCity}-${safeCountry}.png`;

        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
}

// Köppen Climate Classification Functions
function classifyClimate() {
    if (!currentTemperatures || !currentPrecipitation) {
        alert('Please generate a climate diagram first');
        return;
    }

    const code = determineKoppenCode(currentTemperatures, currentPrecipitation);

    if (code) {
        document.getElementById('koppenCode').textContent = code;
        document.getElementById('koppenDesc').innerHTML = getKoppenDescription(code);
        document.getElementById('koppenResult').style.display = 'block';
    }
}

function determineKoppenCode(temps, precip) {
    // Check for B (Arid) Climates
    const annualPrecip = precip.reduce((a, b) => a + b, 0);
    const annualMeanTemp = temps.reduce((a, b) => a + b, 0) / 12;

    // Determine if it's arid
    const threshold = annualMeanTemp * 20;

    if (annualPrecip < threshold * 0.5) {
        return annualMeanTemp >= 18 ? "BWh" : "BWk";
    } else if (annualPrecip < threshold) {
        return annualMeanTemp >= 18 ? "BSh" : "BSk";
    }

    // Check for A (Tropical) Climate
    const minTemp = Math.min(...temps);
    if (minTemp >= 18) {
        let isNorthern;

        if (isManualInput) {
            // For manual input, use the hemisphere selector
            const hemisphere = document.querySelector('input[name="manualHemisphere"]:checked')?.value;
            if (!hemisphere) {
                alert('Please select a hemisphere option in the manual input section.');
                return null;
            }
            isNorthern = hemisphere === 'north';
        } else {
            // For database cities, auto-detect from latitude
            isNorthern = currentLatitude >= 0;
        }

        const subcat = determineASubcategory(precip, isNorthern);
        return "A" + subcat;
    }

    // Check for E (Polar) Climate
    const maxTemp = Math.max(...temps);
    if (maxTemp < 10) {
        return maxTemp > 0 ? "ET" : "EF";
    }

    // Check for C (Temperate) or D (Continental) Climates
    const coldestTemp = Math.min(...temps);
    if (coldestTemp >= -3) {
        return "C" + determineCDSubcategory(temps, precip);
    } else {
        return "D" + determineCDSubcategory(temps, precip);
    }
}

function determineASubcategory(precip, isNorthern) {
    const dryMonths = precip.filter(p => p < 60).length;
    const driestMonthPrecip = Math.min(...precip);
    const annualPrecip = precip.reduce((a, b) => a + b, 0);

    // Af: No dry season - every month >= 60mm
    if (dryMonths === 0) {
        return "f";
    }

    // Am: Monsoon - despite dry month(s), enough annual rain to offset
    // Driest month >= 100 - (annual precipitation / 25)
    const amThreshold = 100 - (annualPrecip / 25);
    if (driestMonthPrecip >= amThreshold) {
        return "m";
    }

    // For Aw vs As, we need to determine when the dry season occurs
    // Find the driest 3-month period
    let minPrecip3Month = Infinity;
    let driestStart = 0;

    for (let i = 0; i < 12; i++) {
        const windowPrecip = precip[i] + precip[(i + 1) % 12] + precip[(i + 2) % 12];
        if (windowPrecip < minPrecip3Month) {
            minPrecip3Month = windowPrecip;
            driestStart = i;
        }
    }

    // Get the 3 driest consecutive months
    const driestMonths = [
        driestStart,
        (driestStart + 1) % 12,
        (driestStart + 2) % 12
    ];

    // Define summer and winter half-years based on hemisphere
    // Northern: Summer half = Apr-Sep (3,4,5,6,7,8); Winter half = Oct-Mar (9,10,11,0,1,2)
    // Southern: Summer half = Oct-Mar (9,10,11,0,1,2); Winter half = Apr-Sep (3,4,5,6,7,8)
    const summerHalf = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    const winterHalf = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];

    // Count how many of the driest months fall in summer vs winter half-year
    const dryInSummer = driestMonths.filter(m => summerHalf.includes(m)).length;
    const dryInWinter = driestMonths.filter(m => winterHalf.includes(m)).length;

    // If more dry months in summer half → As; if more in winter half → Aw
    if (dryInSummer > dryInWinter) {
        return "s";  // As - Tropical savanna with dry summer
    } else {
        return "w";  // Aw - Tropical savanna with dry winter
    }
}

function determineCDSubcategory(temps, precip) {
    // Detect hemisphere based on warmest period
    const northernSummerTemp = temps[5] + temps[6] + temps[7];
    const southernSummerTemp = temps[11] + temps[0] + temps[1];
    const isNorthern = northernSummerTemp > southernSummerTemp;

    // Define summer and winter months
    // Northern: Summer = Apr-Sep (3,4,5,6,7,8); Winter = Oct-Mar (9,10,11,0,1,2)
    // Southern: Summer = Oct-Mar (9,10,11,0,1,2); Winter = Apr-Sep (3,4,5,6,7,8)
    const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];

    // Get precipitation values for each season
    const summerPrecipValues = summerMonths.map(i => precip[i]);
    const winterPrecipValues = winterMonths.map(i => precip[i]);

    // Find driest and wettest months in each season
    const driestSummerMonth = Math.min(...summerPrecipValues);
    const wettestSummerMonth = Math.max(...summerPrecipValues);
    const driestWinterMonth = Math.min(...winterPrecipValues);
    const wettestWinterMonth = Math.max(...winterPrecipValues);

    // Köppen criteria for dry season determination:
    // Cs (dry summer): Driest summer month < 30mm AND driest summer month < 1/3 wettest winter month
    // Cw (dry winter): Driest winter month < 1/10 wettest summer month
    // Cf (no dry season): Neither condition met

    let seasonCode;

    // Check for dry summer (Mediterranean - Cs)
    if (driestSummerMonth < 30 && driestSummerMonth < wettestWinterMonth / 3) {
        seasonCode = "s";
    }
    // Check for dry winter (Cw)
    else if (driestWinterMonth < wettestSummerMonth / 10) {
        seasonCode = "w";
    }
    // No distinct dry season (Cf)
    else {
        seasonCode = "f";
    }

    // Determine heat code
    const warmestTemp = Math.max(...temps);
    const coldestTemp = Math.min(...temps);
    let heatCode;

    if (warmestTemp >= 22) {
        heatCode = "a";
    } else {
        const warmMonths = temps.filter(t => t >= 10).length;
        if (warmMonths >= 4) {
            heatCode = "b";
        } else if (coldestTemp < -38) {
            // Extremely cold continental - only for D climates
            heatCode = "d";
        } else {
            heatCode = "c";
        }
    }

    return seasonCode + heatCode;
}

function getKoppenDescription(code) {
    const climate = koppenData[code];

    if (climate) {
        return `<strong>${climate.name}</strong><br>${climate.desc}<br><br><a href="${climate.wiki}" target="_blank" style="color: white; text-decoration: underline;">Learn more on Wikipedia →</a>`;
    }

    return 'Climate classification complete. Code: ' + code;
}
