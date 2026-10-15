class HarvestGraph {
    constructor(containerId) {
        this.containerId = containerId;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'harvestChart';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        document.querySelector(containerId).appendChild(this.canvas);

        // Set fixed canvas dimensions based on container
        var container = document.querySelector(containerId);
        var containerWidth = container.offsetWidth;
        this.canvas.width = containerWidth;
        this.canvas.height = 300;

        console.log('HarvestGraph: Canvas created with fixed dimensions:', containerWidth, 'x', 300);

        // Load prices
        this.prices = {};
        this.loadPrices();

        this.chart = new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Verdana',
                                size: 10
                            },
                            boxWidth: 12,
                            padding: 6
                        }
                    },
                    beforeDatasetsDraw: function(chart) {
                        if (chart.options.avgHarvest !== undefined && chart.options.avgHarvest !== null && chart.options.avgHarvest > 0) {
                            var ctx = chart.ctx;
                            var yAxis = chart.scales.y;
                            var xAxis = chart.scales.x;
                            var avgValue = chart.options.avgHarvest;
                            var yPos = yAxis.getPixelForValue(avgValue);

                            console.log('Drawing horizontal line at avg:', avgValue, 'yPos:', yPos);

                            ctx.save();
                            ctx.beginPath();
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                            ctx.lineWidth = 2;
                            ctx.moveTo(xAxis.left, yPos);
                            ctx.lineTo(xAxis.right, yPos);
                            ctx.stroke();
                            ctx.restore();
                        }
                    },
                    tooltip: {
                        filter: function(tooltipItem) {
                            return tooltipItem.parsed.y > 0 && tooltipItem.dataset.label !== 'Average';
                        },
                        callbacks: {
                            title: function(tooltipItems) {
                                let total = 0;
                                let totalValue = 0;
                                var chart = tooltipItems[0].chart;
                                var prices = chart.options.prices || {};
                                var date = tooltipItems[0].label;

                                tooltipItems.forEach(function(tooltipItem) {
                                    total += tooltipItem.parsed.y;
                                    var species = tooltipItem.dataset.label;
                                    var price = prices[species] || 0;
                                    totalValue += tooltipItem.parsed.y * price;
                                });

                                var totalKg = total.toFixed(2);
                                var totalValueEuro = totalValue.toFixed(0);
                                return date + ' | Total: ' + totalKg + ' kg = ' + totalValueEuro + '€';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: { family: 'Verdana', size: 10 }
                        },
                        ticks: {
                            font: { family: 'Verdana', size: 8 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Harvest (kg)',
                            font: { family: 'Verdana', size: 10 }
                        },
                        ticks: {
                            font: { family: 'Verdana', size: 8 },
                            callback: function(value) {
                                return value.toFixed(1) + ' kg';
                            }
                        },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Value (€)',
                            font: { family: 'Verdana', size: 10 }
                        },
                        ticks: {
                            font: { family: 'Verdana', size: 8 },
                            callback: function(value) {
                                return value.toFixed(0) + ' €';
                            }
                        },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.3,
                        fill: true
                    },
                    point: {
                        radius: 0,
                        hitRadius: 10,
                        hoverRadius: 5
                    }
                }
            }
        });

        // Mushroom species color mapping - diverse spectrum
        this.speciesColors = {
            // Grays/Blues (Gray Oyster strains)
            'BPearl': 'rgba(70, 130, 180, 0.7)',    // Steel blue
            'Bpearl': 'rgba(100, 149, 237, 0.7)',   // Cornflower blue
            'POm': 'rgba(112, 128, 144, 0.7)',      // Slate gray
            'POn': 'rgba(159, 166, 183, 0.7)',      // Light slate gray
            'POpag': 'rgba(176, 196, 222, 0.7)',    // Light steel blue
            'POHU': 'rgba(135, 206, 250, 0.7)',    // Light sky blue

            // Greens (King Oyster strains - olive/tan connection)
            'PEtun': 'rgba(154, 205, 50, 0.7)',    // Yellow green
            'PEtun19': 'rgba(173, 255, 47, 0.7)',   // Green yellow
            'PEmetax': 'rgba(85, 107, 47, 0.7)',    // Dark olive green
            'PEcorea': 'rgba(124, 252, 0, 0.7)',    // Lime green
            'PEkor': 'rgba(107, 142, 35, 0.7)',     // Olive drab
            'PEsal': 'rgba(50, 205, 50, 0.7)',     // Lime
            'PTc': 'rgba(60, 179, 113, 0.7)',      // Medium sea green

            // Teals/Cyans (Lion's Mane - white/cream connection)
            'HEg': 'rgba(64, 224, 208, 0.7)',       // Turquoise
            'HEn': 'rgba(0, 128, 128, 0.7)',        // Teal

            // Yellow (Phoenix Oyster - best yellow)
            'PCme': 'rgba(255, 255, 0, 0.7)',       // Bright yellow
            'PCg': 'rgba(255, 250, 205, 0.7)',      // Lemon chiffon

            // Gold/Amber with subtle green hint (Golden Oyster strains - olive tones)
            'HU': 'rgba(220, 210, 60, 0.7)',        // Olive gold
            'HUn': 'rgba(200, 180, 70, 0.7)',       // Muted olive
            'HU22': 'rgba(180, 160, 80, 0.7)',      // Dark olive gold
            'HUlc': 'rgba(210, 200, 120, 0.7)',     // Light olive
            'HU24': 'rgba(230, 220, 140, 0.7)',     // Pale olive
            'HCpp': 'rgba(190, 170, 90, 0.7)',      // Olive tan

            // Browns/Earth tones (Chestnut - make them darker/more distinct)
            'PApp': 'rgba(60, 20, 0, 0.7)',         // Dark brown (chestnut)
            'PAb': 'rgba(80, 40, 10, 0.7)',         // Very dark brown

            // Shiitake - earthy clay tones with subtle orange hint
            'LEm': 'rgba(205, 140, 80, 0.7)',       // Clay brown
            'LEfr': 'rgba(220, 160, 110, 0.7)',     // Clay tan
            'LE3790': 'rgba(230, 150, 100, 0.7)',   // Clay sandy
            'LEn': 'rgba(215, 170, 130, 0.7)',      // Clay earth
            'AA22': 'rgba(200, 150, 130, 0.7)',     // Clay rosy
            'PNb': 'rgba(170, 120, 80, 0.7)',       // Clay dark
            'FVn': 'rgba(180, 130, 90, 0.7)',        // Clay sienna

            // Reds (Reishi - both red but distinct)
            'GLg': 'rgba(220, 20, 60, 0.7)',        // Crimson
            'GLzam': 'rgba(255, 0, 0, 0.7)',         // Pure red
            'TVt': 'rgba(128, 0, 0, 0.7)',          // Maroon

            // Pink/Salmon (Pink Oyster - make more distinct from red)
            'PSn': 'rgba(255, 182, 193, 0.7)',     // Light pink

            // Purples (unknown/other)
            'default': 'rgba(128, 0, 128, 0.7)'     // Purple
        };

        this.speciesBorderColors = {
            'BPearl': 'rgba(70, 130, 180, 1)',
            'Bpearl': 'rgba(100, 149, 237, 1)',
            'POm': 'rgba(112, 128, 144, 1)',
            'POn': 'rgba(119, 136, 153, 1)',
            'POpag': 'rgba(176, 196, 222, 1)',
            'POHU': 'rgba(135, 206, 250, 1)',
            'PEtun': 'rgba(154, 205, 50, 1)',
            'PEtun19': 'rgba(173, 255, 47, 1)',
            'PEmetax': 'rgba(85, 107, 47, 1)',
            'PEcorea': 'rgba(124, 252, 0, 1)',
            'PEkor': 'rgba(107, 142, 35, 1)',
            'PEsal': 'rgba(50, 205, 50, 1)',
            'PTc': 'rgba(60, 179, 113, 1)',
            'HEg': 'rgba(64, 224, 208, 1)',
            'HEn': 'rgba(0, 128, 128, 1)',
            'PCme': 'rgba(255, 255, 0, 1)',
            'PCg': 'rgba(255, 250, 205, 1)',
            'HU': 'rgba(220, 210, 60, 1)',
            'HUn': 'rgba(200, 180, 70, 1)',
            'HU22': 'rgba(180, 160, 80, 1)',
            'HUlc': 'rgba(210, 200, 120, 1)',
            'HU24': 'rgba(230, 220, 140, 1)',
            'HCpp': 'rgba(190, 170, 90, 1)',
            'PApp': 'rgba(60, 20, 0, 1)',
            'PAb': 'rgba(80, 40, 10, 1)',
            'LEm': 'rgba(205, 140, 80, 1)',
            'LEfr': 'rgba(220, 160, 110, 1)',
            'LE3790': 'rgba(230, 150, 100, 1)',
            'LEn': 'rgba(215, 170, 130, 1)',
            'AA22': 'rgba(200, 150, 130, 1)',
            'PNb': 'rgba(170, 120, 80, 1)',
            'FVn': 'rgba(180, 130, 90, 1)',
            'GLg': 'rgba(220, 20, 60, 1)',
            'GLzam': 'rgba(255, 0, 0, 1)',
            'TVt': 'rgba(128, 0, 0, 1)',
            'PSn': 'rgba(255, 182, 193, 1)',
            'default': 'rgba(128, 0, 128, 1)'
        };
    }
    
    parseDate(dateStr) {
        if (typeof dateStr !== 'string') {
            dateStr = String(dateStr);
        }
        var parts = dateStr.split('/');
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        return new Date(year, month, day);
    }
    
    formatDate(date) {
        if (typeof date !== 'object' || !(date instanceof Date)) {
            return String(date);
        }
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + String(date.getFullYear()).slice(-2);
    }

    loadPrices() {
        // Try to load prices from prices.json
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'prices.json', false); // Synchronous for simplicity
        xhr.send();
        if (xhr.status === 200) {
            try {
                var priceData = JSON.parse(xhr.responseText);
                for (var i = 0; i < priceData.length; i++) {
                    var entry = priceData[i];
                    var price = entry.price;
                    var names = entry.names;
                    for (var j = 0; j < names.length; j++) {
                        this.prices[names[j]] = price;
                    }
                }
                console.log('HarvestGraph: Loaded prices for', Object.keys(this.prices).length, 'species');
            } catch (e) {
                console.error('HarvestGraph: Failed to parse prices.json', e);
            }
        } else {
            console.log('HarvestGraph: prices.json not found');
        }
    }

    calculateAveragePrice(harvestData, speciesList, sortedDates) {
        if (Object.keys(this.prices).length === 0) return null;

        var totalValue = 0;
        var totalQuantity = 0;

        for (var s = 0; s < speciesList.length; s++) {
            var species = speciesList[s];
            var speciesTotal = 0;
            for (var d = 0; d < sortedDates.length; d++) {
                speciesTotal += harvestData[species][sortedDates[d]] || 0;
            }
            if (speciesTotal > 0 && this.prices[species]) {
                totalValue += speciesTotal * this.prices[species];
                totalQuantity += speciesTotal;
            }
        }

        var avgPrice = totalQuantity > 0 ? (totalValue / totalQuantity) : 0;
        return {
            avgPrice: avgPrice,
            totalQuantity: totalQuantity,
            totalValue: totalValue
        };
    }

    updateFromData(dataString, dayGranularity = 1, startDate = null, endDate = null) {
        if (!dataString || !dataString.length) return;

        var lines = dataString.split('\n');
        var data = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            var items = line.split(',');
            var objline = [];
            for (var j = 0; j < items.length; j++) {
                var val = items[j].trim();
                if (isNaN(Number(val))) objline.push(val);
                else objline.push(Number(val));
            }
            if (objline.length > 0) data.push(objline);
        }

        if (!data.length) {
            console.log("HarvestGraph: No data to display");
            return;
        }

        console.log("HarvestGraph: Day granularity:", dayGranularity);
        console.log("HarvestGraph: Date range:", startDate, "to", endDate);
        
        var speciesMap = {};
        var dateSet = new Set();
        var speciesList = [];

        for (var i = 0; i < data.length; i++) {
            var line = data[i];
            if (line.length < 4) continue;
            var date = line[0];
            var id = line[1];
            var command = line[2];
            var argument = line[3];

            if (command === 'species') {
                if (!speciesMap[id]) {
                    speciesMap[id] = argument;
                    if (speciesList.indexOf(argument) === -1) {
                        speciesList.push(argument);
                    }
                }
            }
        }

        // Sort species alphabetically
        speciesList.sort(function(a, b) {
            return a.localeCompare(b);
        });

        console.log("HarvestGraph: Found species:", speciesList);
        console.log("HarvestGraph: Species map:", speciesMap);
        
        var harvestData = {};
        for (var s = 0; s < speciesList.length; s++) {
            harvestData[speciesList[s]] = {};
        }
        
        for (var i = 0; i < data.length; i++) {
            var line = data[i];
            if (line.length < 4) continue;
            var date = line[0];
            var id = line[1];
            var command = line[2];
            var argument = line[3];

            if (command === 'harvest') {
                var species = speciesMap[id] || 'unknown';
                var value = parseFloat(argument);

                if (!isNaN(value)) {
                    if (!harvestData[species]) {
                        harvestData[species] = {};
                    }
                    if (!harvestData[species][date]) {
                        harvestData[species][date] = 0;
                    }
                    harvestData[species][date] += value;
                    dateSet.add(date);
                }
            }
        }

        console.log("HarvestGraph: Dates found:", dateSet);
        console.log("HarvestGraph: Harvest data:", harvestData);
        
        var sortedDates = Array.from(dateSet).map(function(d) {
            return String(d);
        }).sort(function(a, b) {
            return this.parseDate(a) - this.parseDate(b);
        }.bind(this));

        // Apply date range filter
        if (startDate || endDate) {
            var filteredDates = [];
            var filteredHarvestData = {};

            for (var species in harvestData) {
                filteredHarvestData[species] = {};
            }

            for (var i = 0; i < sortedDates.length; i++) {
                var date = sortedDates[i];
                var dateObj = this.parseDate(date);
                var include = true;

                if (startDate) {
                    var startObj = this.parseDate(startDate);
                    if (dateObj < startObj) include = false;
                }

                if (endDate) {
                    var endObj = this.parseDate(endDate);
                    if (dateObj > endObj) include = false;
                }

                if (include) {
                    filteredDates.push(date);
                    for (var species in harvestData) {
                        if (harvestData[species][date]) {
                            filteredHarvestData[species][date] = harvestData[species][date];
                        }
                    }
                }
            }

            sortedDates = filteredDates;
            harvestData = filteredHarvestData;
        }

        // Apply day granularity - group dates and calculate average
        if (dayGranularity > 1) {
            var groupedDates = {};
            var groupedHarvestData = {};
            var groupCounts = {}; // Track how many actual days are in each group

            for (var species in harvestData) {
                groupedHarvestData[species] = {};
            }

            for (var i = 0; i < sortedDates.length; i++) {
                var date = sortedDates[i];
                var dateObj = this.parseDate(date);
                var dayIndex = Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24 * dayGranularity));
                var groupedDate = new Date(dayIndex * 1000 * 60 * 60 * 24 * dayGranularity);
                var dateKey = this.formatDate(groupedDate);

                groupedDates[dateKey] = true;

                // Count this date for the group
                if (!groupCounts[dateKey]) {
                    groupCounts[dateKey] = 0;
                }
                groupCounts[dateKey]++;

                for (var species in harvestData) {
                    if (harvestData[species][date]) {
                        if (!groupedHarvestData[species][dateKey]) {
                            groupedHarvestData[species][dateKey] = 0;
                        }
                        groupedHarvestData[species][dateKey] += harvestData[species][date];
                    }
                }
            }

            // Divide by the number of days in each group to get the average
            for (var species in groupedHarvestData) {
                for (var dateKey in groupedHarvestData[species]) {
                    if (groupCounts[dateKey] > 0) {
                        groupedHarvestData[species][dateKey] = groupedHarvestData[species][dateKey] / groupCounts[dateKey];
                    }
                }
            }

            sortedDates = Object.keys(groupedDates).sort(function(a, b) {
                return this.parseDate(a) - this.parseDate(b);
            }.bind(this));

            harvestData = groupedHarvestData;
        }

        var labels = sortedDates.map(this.formatDate.bind(this));

        var datasets = [];
        for (var s = 0; s < speciesList.length; s++) {
            var species = speciesList[s];
            var values = [];

            for (var d = 0; d < sortedDates.length; d++) {
                var date = sortedDates[d];
                var value = harvestData[species][date] || 0;
                // Convert grams to kilograms
                values.push(value / 1000);
            }

            var bgColor = this.speciesColors[species] || this.speciesColors['default'];
            var borderColor = this.speciesBorderColors[species] || this.speciesBorderColors['default'];

            datasets.push({
                label: species,
                data: values,
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
                fill: true
            });
        }

        // Calculate average daily harvest for horizontal line
        var dailyTotals = [];
        for (var d = 0; d < sortedDates.length; d++) {
            var dayTotal = 0;
            for (var s = 0; s < speciesList.length; s++) {
                dayTotal += (harvestData[speciesList[s]][sortedDates[d]] || 0) / 1000;
            }
            dailyTotals.push(dayTotal);
        }

        var avgHarvest = 0;
        if (dailyTotals.length > 0) {
            var sum = 0;
            for (var i = 0; i < dailyTotals.length; i++) {
                sum += dailyTotals[i];
            }
            avgHarvest = sum / dailyTotals.length;
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;

        // Use the already calculated dailyTotals to find max
        var maxHarvest = 0;
        for (var i = 0; i < dailyTotals.length; i++) {
            if (dailyTotals[i] > maxHarvest) maxHarvest = dailyTotals[i];
        }

        // Store avgHarvest for drawing the horizontal line (must be before update)
        this.chart.options.avgHarvest = avgHarvest;

        // Calculate average price to scale the price axis
        var priceInfo = this.calculateAveragePrice(harvestData, speciesList, sortedDates);
        if (priceInfo && priceInfo.avgPrice > 0) {
            // Store prices for tooltip and avgPrice for axis scaling
            this.chart.options.prices = this.prices;
            this.chart.options.avgPrice = priceInfo.avgPrice;
            // Show price axis
            this.chart.options.scales.y1.display = true;
            // Set y1 max to be proportional to y max based on average price
            this.chart.options.scales.y1.max = maxHarvest * priceInfo.avgPrice;
        } else {
            // Hide price axis if no price data
            this.chart.options.scales.y1.display = false;
            this.chart.options.prices = {};
            this.chart.options.avgPrice = 0;
        }

        console.log('HarvestGraph: Updating chart - container width:', document.querySelector(this.containerId).offsetWidth);
        console.log('HarvestGraph: Average harvest:', avgHarvest);

        this.chart.update('none');

        // Calculate and return average price
        return priceInfo;
    }
}
