<script>
        // Country code lookup table - loaded from external JSON file
        let countryNames = {};
        
        let climateData = [];
        let chart = null;
        let currentTemperatures = null;
        let currentPrecipitation = null;
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
                    countryNames = {"TS": "Test Country A", "TX": "Test Country B"};
                }
            } catch (error) {
                console.error('Error loading country codes:', error);
                countryNames = {"TS": "Test Country A", "TX": "Test Country B"};
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
            document.getElementById('citySelect').innerHTML = '<option value="">-- Select City --</option>';
            document.getElementById('citySelect').disabled = true;
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
                    complete: function(results) {
                        if (results.data && results.data.length > 0) {
                            climateData = results.data;
                            console.log(`Loaded ${climateData.length} cities from ${continent}`);
                            populateCountries();
                            document.getElementById('continentLoading').style.display = 'none';
                        } else {
                            throw new Error('No data found in CSV file');
                        }
                    },
                    error: function(error) {
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
        
        // Load cities for selected country
        function loadCountry() {
            const countryCode = document.getElementById('countrySelect').value;
            const citySelect = document.getElementById('citySelect');
            
            // Hide location info and chart when country changes
            document.getElementById('locationInfo').style.display = 'none';
            document.getElementById('climateChart').style.display = 'none';
            document.querySelector('.welcome-message').style.display = 'block';
            document.getElementById('exportBtn').style.display = 'none';
            
            if (!countryCode) {
                citySelect.innerHTML = '<option value="">-- Select City --</option>';
                citySelect.disabled = true;
                return;
            }
            
            citySelect.innerHTML = '<option value="">-- Select City --</option>';
            
            // Map cities with their ORIGINAL index in climateData array
            const cities = climateData
                .map((row, originalIndex) => ({ row, originalIndex }))
                .filter(item => item.row.country === countryCode)
                .map(item => ({ name: item.row.city, index: item.originalIndex }))
                .sort((a, b) => a.name.localeCompare(b.name));
            
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.index;
                option.textContent = city.name;
                citySelect.appendChild(option);
            });
            
            citySelect.disabled = false;
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
            
            // Generate diagram
            generateDiagram(temperatures, precipitation, cityData.city, countryNames[cityData.country] || cityData.country);
        }
        
        // Generate climate diagram
        function generateDiagram(temperatures, precipitation, city, country) {
            // Store current data for Köppen classification
            currentTemperatures = temperatures;
            currentPrecipitation = precipitation;
            
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
                            text: 'Created by scansot064 AT g.educaand.es with claude.ai, Geonames, Worldclim - CC BY 4.0',
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
                                callback: function(value) {
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
                                callback: function(value) {
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
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const cityName = document.getElementById('infoCity').textContent;
                const countryName = document.getElementById('infoCountry').textContent;
                const filename = `${cityName}-${countryName}-climate.png`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                
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
            // Reset questions
            document.getElementById('koppenQuestion').style.display = 'none';
            
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
                document.getElementById('koppenQuestion').style.display = 'block';
                const hemisphere = document.querySelector('input[name="hemisphere"]:checked')?.value;
                
                if (!hemisphere) {
                    alert('Please select a hemisphere option for tropical climate classification.');
                    return null;
                }
                
                const isNorthern = hemisphere === 'north';
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
            
            if (dryMonths === 0) {
                return "f";
            }
            
            // Find driest 3-month period
            let minPrecip3Month = Infinity;
            let driestStart = 0;
            
            for (let i = 0; i < 12; i++) {
                const windowPrecip = precip[i] + precip[(i + 1) % 12] + precip[(i + 2) % 12];
                if (windowPrecip < minPrecip3Month) {
                    minPrecip3Month = windowPrecip;
                    driestStart = i;
                }
            }
            
            const winterMonths = isNorthern ? [11, 0, 1] : [5, 6, 7];
            const isDryWinter = winterMonths.includes(driestStart);
            
            if (isDryWinter) {
                return "w";
            } else if (dryMonths <= 2) {
                return "m";
            }
            
            return "f";
        }
        
        function determineCDSubcategory(temps, precip) {
            // Detect hemisphere
            const northernSummerTemp = temps[5] + temps[6] + temps[7];
            const southernSummerTemp = temps[11] + temps[0] + temps[1];
            const isNorthern = northernSummerTemp > southernSummerTemp;
            
            const summerMonths = isNorthern ? [5, 6, 7] : [11, 0, 1];
            const winterMonths = isNorthern ? [11, 0, 1] : [5, 6, 7];
            
            const summerPrecip = summerMonths.reduce((sum, i) => sum + precip[i], 0);
            const winterPrecip = winterMonths.reduce((sum, i) => sum + precip[i], 0);
            
            let seasonCode;
            if (summerPrecip < 40 && summerPrecip < winterPrecip / 3) {
                seasonCode = "s";
            } else if (winterPrecip < 40 && winterPrecip < summerPrecip / 10) {
                seasonCode = "w";
            } else {
                seasonCode = "f";
            }
            
            // Determine heat code
            const warmestTemp = Math.max(...temps);
            let heatCode;
            if (warmestTemp >= 22) {
                heatCode = "a";
            } else {
                const warmMonths = temps.filter(t => t >= 10).length;
                heatCode = warmMonths >= 4 ? "b" : "c";
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
    </script>
