const pageElements = {
    popUpLink: document.getElementById("pop-up-link"),
    popUpBlock: document.getElementById("pop-up-block"),
    closeIcon: document.getElementById("close-icon"),
    totalVisits: document.getElementById("total-visits-number"),
    timeTitle: document.getElementById("time-title"),
    //visitsText: document.getElementById("visits-text"),
    legendDiv: document.getElementById("legend-div"),
    lineChart: document.getElementById("line_chart"),
    pieChart: document.getElementById("piechart"),
    columnChart: document.getElementById("columnchart"),
    geoChart: document.getElementById("geochart")
};

pageElements.popUpLink.addEventListener("click", function () {
    pageElements.popUpBlock.style.opacity = "1";
    pageElements.popUpBlock.style.visibility = "visible";
    document.body.style.overflowY = "hidden";
});

pageElements.closeIcon.addEventListener("click", function () {
    pageElements.popUpBlock.style.opacity = "0";
    pageElements.popUpBlock.style.visibility = "hidden";
    document.body.style.overflowY = "auto";
});

const countryMapping = {
    'FR': 'France',
    'PL': 'Poland',
    'BA': 'Bosnia and Herzegovina',
    'UK': 'United Kingdom',
    'SE': 'Sweden',
    'DE': 'Germany',
    'FI': 'Finland',
    'RO': 'Romania',
    'ES': 'Spain',
    'SI': 'Slovenia',
    'BG': 'Bulgaria',
    'CH': 'Switzerland',
    'IE': 'Ireland',
    'GL': 'Greenland',
    'US': 'United States'
};

function getCountryName(countryCode) {
    return countryMapping[countryCode.toLowerCase()] || countryCode.toUpperCase();
}

function toggleActiveMode(buttonId) {
    document.querySelectorAll(".btn-custom-mode, .btn-custom")
        .forEach(btn => btn.classList.remove("active"));
    document.getElementById(buttonId).classList.add("active");
}

let currentJsonFile = 'day.json';

function handlePeriodChange(period, jsonFile) {
    return function () {
        toggleActiveMode(`btn${period.charAt(0).toUpperCase()}`);
        currentJsonFile = jsonFile;
        drawLineChart(period);
        updateAllCharts();
        setRandomTime();
    };
}

document.getElementById("btnD").addEventListener("click", handlePeriodChange('daily', 'day.json'));
document.getElementById("btnW").addEventListener("click", handlePeriodChange('weekly', 'week.json'));
document.getElementById("btnM").addEventListener("click", handlePeriodChange('monthly', 'month.json'));

google.charts.load('current', { 'packages': ['corechart', 'geochart', 'line'] });

function generateDailyData() {
    const data = [['Hour', 'Visits']];
    for (let hour = 0; hour < 24; hour++) {
        let visits = (hour >= 18 || hour < 2)
            ? Math.floor(Math.random() * (150 - 120) + 120)
            : Math.floor(Math.random() * (80 - 50) + 50);
        visits += Math.sin(hour / 24 * Math.PI * 2) * 10;
        const formattedHour = hour.toString().padStart(2, '0');
        data.push([`${formattedHour}:00`, visits / 10]);
    }
    return data;
}

function generateWeeklyData() {
    const data = [['Hour', 'Visits']];
    for (let hour = 0; hour < 168; hour++) {
        const hourOfDay = hour % 24;
        const day = Math.floor(hour / 24) + 1;
        let visits = (hourOfDay >= 18 || hourOfDay < 2)
            ? Math.floor(Math.random() * (200 - 150) + 150)
            : Math.floor(Math.random() * (100 - 70) + 70);
        visits += Math.sin((hour / 168) * Math.PI * 2) * 20;
        data.push([`Day ${day}, ${hourOfDay.toString().padStart(2, '0')}:00`, visits / 10]);
    }
    return data;
}

function generateMonthlyData() {
    const data = [['Hour', 'Visits']];
    for (let hour = 0; hour < 720; hour++) {
        const hourOfDay = hour % 24;
        const day = Math.floor(hour / 24) + 1;
        let visits = (hourOfDay >= 18 || hourOfDay < 2)
            ? Math.floor(Math.random() * (250 - 200) + 200)
            : Math.floor(Math.random() * (150 - 100) + 100);
        visits += Math.sin((hour / 744) * Math.PI * 2) * 30;
        data.push([`Day ${day}, ${hourOfDay.toString().padStart(2, '0')}:00`, visits / 10]);
    }
    return data;
}

function drawLineChart(period) {
    const periodConfig = {
        daily: {
            getData: generateDailyData,
            title: 'Hours (24h)',
            //text: 'This chart displays the trend of daily visits over the past 3 days.',
            gridlines: 24
        },
        weekly: {
            getData: generateWeeklyData,
            title: 'Days (7d)',
            //text: 'This chart displays the trend of weekly visits over the past 3 weeks.',
            gridlines: 14
        },
        monthly: {
            getData: generateMonthlyData,
            title: 'Days (30 days)',
            //text: 'This chart displays the trend of monthly visits over the past 3 months.',
            gridlines: 30
        }
    };

    const config = periodConfig[period] || periodConfig.daily;
    const data = google.visualization.arrayToDataTable(config.getData());

    const view = new google.visualization.DataView(data);
    view.setColumns([0, 1, {
        type: 'string',
        role: 'tooltip',
        properties: { html: true },
        calc: (dt, row) => `<div style="padding:5px; font-family: Arial, sans-serif; font-size: 14px;width: fit-content;"><b>${dt.getValue(row, 0)}</b></div>`
    }]);

    const options = {
        curveType: 'function',
        legend: { position: 'none' },
        tooltip: { isHtml: true },
        hAxis: {
            title: config.title,
            gridlines: {
                count: config.gridlines,
                color: '#f5f5f5'
            },
            baselineColor: '#ddd',
            textStyle: { fontSize: 12 }
        },
        vAxis: {
            title: 'Visits',
            viewWindow: { min: 0, max: 30 },
            gridlines: { color: '#f5f5f5' },
            baselineColor: '#ddd',
            textStyle: { fontSize: 12 }
        },
        chartArea: { width: '90%', height: '80%' },
        colors: ['#3366cc'],
        lineWidth: 2
    };

    const chart = new google.visualization.LineChart(pageElements.lineChart);
    chart.draw(view, options);
    //pageElements.visitsText.textContent = config.text;
}

async function fetchGeoData() {
    try {
        const response = await fetch(`https://adavice.github.io/charts/json/${currentJsonFile}`);
        const data = await response.json();
        const geoData = [['Country', 'Value', 'Percentage']];

        const totalClicks = Object.values(data.totals.dist)
            .reduce((sum, country) => sum + country.clicks, 0);

        pageElements.totalVisits.textContent = totalClicks;

        for (const [countryCode, countryData] of Object.entries(data.totals.dist)) {
            const percentage = (countryData.clicks / totalClicks) * 100;
            geoData.push([
                getCountryName(countryCode),
                countryData.clicks,
                percentage
            ]);
        }

        return { geoData, totalClicks };
    } catch (error) {
        console.error('Error fetching geo data:', error);
        return {
            geoData: [['Country', 'Value', 'Percentage'], ['No Data', 0, 0]],
            totalClicks: 0
        };
    }
}

function generateRandomDataForOtherCharts(type) {
    const data = [['Category', 'Percentage']];
    if (type === 'pie') {
        const mobilePercentage = Math.floor(Math.random() * (94 - 81 + 1)) + 81;
        data.push(['Mobile', mobilePercentage], ['Desktop', 100 - mobilePercentage]);
    } else if (type === 'column') {
        const displayAdsPercentage = Math.floor(Math.random() * (87 - 75 + 1)) + 75;
        data.push(['DisplayAds', displayAdsPercentage], ['Paid', 100 - displayAdsPercentage]);
    }
    return data;
}

async function drawCharts() {
    const [pieData, columnData] = ['pie', 'column'].map(generateRandomDataForOtherCharts);
    const { geoData, totalClicks } = await fetchGeoData();

    const createTooltipColumn = (dataTable) => ({
        type: 'string',
        role: 'tooltip',
        properties: { html: true },
        calc: function (dt, row) {
            return `<div style="font-family: Arial, sans-serif; font-size: 14px; padding:5px">
                <b>${dt.getValue(row, 0)}</b> ${dt.getValue(row, 1)}%</div>`;
        }
    });

    const pieChartData = google.visualization.arrayToDataTable(pieData);
    const pieView = new google.visualization.DataView(pieChartData);
    pieView.setColumns([0, 1, createTooltipColumn(pieChartData)]);

    const pieChart = new google.visualization.PieChart(pageElements.pieChart);
    pieChart.draw(pieView, {
        colors: ['#6a98f6', '#3366cc'],
        tooltip: {
            isHtml: true,
            textStyle: { fontSize: 14 },
            trigger: 'focus'
        },
        legend: {
            position: 'bottom',
            textStyle: {
                fontSize: 12,
                color: 'black'
            }
        },
        fontSize: 14
    });

    const geoDataTable = new google.visualization.DataTable();
    geoDataTable.addColumn('string', 'Country');
    geoDataTable.addColumn('number', 'Value');
    geoDataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });

    geoData.slice(1).forEach(row => {
        const percentage = (row[1] / totalClicks) * 100;
        geoDataTable.addRow([
            row[0],
            percentage,
            `${percentage.toFixed(2)}%`
        ]);
    });

    const geoChart = new google.visualization.GeoChart(pageElements.geoChart);
    geoChart.draw(geoDataTable, {
        colorAxis: {
            colors: ['#cfddfa', '#a5c4f7', '#7ca0f4', '#527cf1', '#3366cc'],
            values: [0, 100],
            labels: ['0%', '100%']
        },
        legend: { textStyle: { fontSize: 14 } },
        tooltip: {
            trigger: 'focus',
            textStyle: { fontSize: 14 }
        }
    });

    const columnChartData = google.visualization.arrayToDataTable(columnData);
    const columnView = new google.visualization.DataView(columnChartData);
    columnView.setColumns([0, 1, createTooltipColumn(columnChartData)]); 

    const columnChart = new google.visualization.ColumnChart(pageElements.columnChart);
    columnChart.draw(columnView, {
        colors: ['#6a98f6', '#3366cc'],
        tooltip: {
            isHtml: true,
            textStyle: { fontSize: 14 },
            trigger: 'focus'
        },
        legend: { position: 'none' },
        hAxis: {
            title: '',
            textStyle: { fontSize: 12 }
        },
        vAxis: {
            title: '',
            format: '#\'%\'',
            viewWindow: { min: 0, max: 100 },
            textStyle: { fontSize: 12 }
        }
    });
}

async function updateLegendTable() {
    const { geoData, totalClicks } = await fetchGeoData();
    pageElements.legendDiv.innerHTML = '';

    if (geoData && geoData.length > 1) {
        const sortedData = geoData.slice(1).sort((a, b) => b[1] - a[1]);
        const columnsContainer = document.createElement('div');
        columnsContainer.style.display = 'flex';
        columnsContainer.style.justifyContent = 'space-between';
        columnsContainer.style.gap = '40px';
        pageElements.legendDiv.appendChild(columnsContainer);

        const [leftColumn, rightColumn] = [document.createElement('div'), document.createElement('div')];
        const middleIndex = Math.ceil(sortedData.length / 2);
        const [leftData, rightData] = [sortedData.slice(0, middleIndex), sortedData.slice(middleIndex)];

        const createLegendItems = (data, column) => {
            data.forEach(item => {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';

                const countryDiv = document.createElement('div');
                countryDiv.className = 'legend-country';
                countryDiv.textContent = item[0];

                const clicksDiv = document.createElement('div');
                clicksDiv.className = 'legend-percentage';
                clicksDiv.textContent = ((item[1] / totalClicks) * 100).toFixed(2) + '%';

                legendItem.append(countryDiv, clicksDiv);
                column.appendChild(legendItem);
            });
        };

        createLegendItems(leftData, leftColumn);
        createLegendItems(rightData, rightColumn);
        columnsContainer.append(leftColumn, rightColumn);
    }
}

function setRandomTime() {
    const start = 4 * 60 + 12;
    const end = 6 * 60 + 45;
    const randomSeconds = Math.floor(Math.random() * (end - start + 1)) + start;
    const minutes = Math.floor(randomSeconds / 60);
    const seconds = randomSeconds % 60;
    pageElements.timeTitle.textContent = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateAllCharts() {
    drawCharts();
    updateLegendTable();
}

google.charts.setOnLoadCallback(async () => {
    drawLineChart('daily');
    await updateAllCharts();
    setRandomTime();
});