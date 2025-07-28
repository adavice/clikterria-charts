const pageElements = {
    popUpLink: document.getElementById("pop-up-link"),
    popUpBlock: document.getElementById("pop-up-block"),
    closeIcon: document.getElementById("close-icon"),
    totalVisits: document.getElementById("total-visits-number"),
    timeTitle: document.getElementById("time-title"),
    lineChart: document.getElementById("line_chart"),
    columnChart: document.getElementById("columnchart"),
    geoChart: document.getElementById("geochart")
};

async function fetchJsonData(jsonFile) {
    try {
        const response = await fetch(`https://adavice.github.io/charts/json/${jsonFile}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${jsonFile}:`, error);
        throw error;
    }
}

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

function toggleActiveMode(activeButtonId) {
    document.querySelectorAll("#btnD, #btnW, #btnM").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeButton = document.getElementById(activeButtonId);
    if (activeButton) {
        activeButton.classList.add("active");
    }
}

let currentJsonFile = 'day.json';

function handlePeriodChange(period, jsonFile) {
    return async function () {
        toggleActiveMode(`btn${period.charAt(0).toUpperCase()}`);
        currentJsonFile = jsonFile;
        await drawLineChart(period);
        await updateAllCharts();
        await setTimeOnSite();
    };
}

document.getElementById("btnD").addEventListener("click", handlePeriodChange('daily', 'day.json'));
document.getElementById("btnW").addEventListener("click", handlePeriodChange('weekly', 'week.json'));
document.getElementById("btnM").addEventListener("click", handlePeriodChange('monthly', 'month.json'));

google.charts.load('current', { 'packages': ['corechart', 'line'] });

const createTooltipColumn = (dataTable) => ({
    type: 'string',
    role: 'tooltip',
    properties: { html: true },
    calc: function (dt, row) {
        return `<div style="font-family: Arial, sans-serif; font-size: 14px; padding:5px; color: #1f2937;">
            <b>${dt.getValue(row, 0)}</b> ${dt.getValue(row, 1)}%</div>`;
    }
});

async function drawLineChart(period) {
    try {
        const jsonData = await fetchJsonData(currentJsonFile);
        const data = [['Hour', 'Visits']];

        jsonData.visitDuration.forEach(entry => {
            const label = period === 'daily' ? entry.hour :
                `Day ${entry.day}, ${entry.hour}`;
            data.push([label, entry.visits]);
        });

        const periodConfig = {
            daily: {
                title: 'Hours (24h)',
                gridlines: 24
            },
            weekly: {
                title: 'Days (7d)',
                gridlines: 7
            },
            monthly: {
                title: 'Days (30d)',
                gridlines: 30
            }
        };

        const config = periodConfig[period] || periodConfig.daily;
        const chartData = google.visualization.arrayToDataTable(data);

        const view = new google.visualization.DataView(chartData);
        view.setColumns([0, 1, {
            type: 'string',
            role: 'tooltip',
            properties: { html: true },
            calc: (dt, row) => `<div style="padding:5px; font-family: Arial, sans-serif; font-size: 14px; width: 80px; color: #1f2937;">
                <b>${dt.getValue(row, 0)}</b></div>`
        }]);

        const options = {
            curveType: 'function',
            legend: { position: 'none' },
            tooltip: { isHtml: true },
            hAxis: {
                title: config.title,
                gridlines: {
                    count: config.gridlines,
                    color: '#444'
                },
                baselineColor: '#777',
                textStyle: { fontSize: 14, color: "#fff",  },
                titleTextStyle: { fontSize: 14, color: "#fff" }
            },
            vAxis: {
                title: 'Visits',
                viewWindow: { min: 0 },
                gridlines: { color: '#444' },
                baselineColor: '#777',
                textStyle: { fontSize: 14, color: "#fff" },
                titleTextStyle: { fontSize: 14, color: "#fff" }
            },
            chartArea: { width: '90%', height: '80%' },
            lineWidth: 2,
            backgroundColor: "#0f172a",
            colors: ["#4dabf7"],
        };
        

        const chart = new google.visualization.LineChart(pageElements.lineChart);
        chart.draw(view, options);
    } catch (error) {
        console.error('Error in drawLineChart:', error);
    }
}

async function drawCharts() {
    try {
        const jsonData = await fetchJsonData(currentJsonFile);

        const totalClicks = Object.values(jsonData.totals.dist)
            .reduce((sum, country) => sum + country.clicks, 0);

        if (pageElements.totalVisits) {
            pageElements.totalVisits.textContent = totalClicks.toLocaleString();
        }

        const { mobile, desktop } = jsonData.deviceDistribution;
        const mobileSpan = document.getElementById("mobile-distribution-span");
        const desktopSpan = document.getElementById("desktop-distribution-span");

        if (mobileSpan) {
            mobileSpan.textContent = `${mobile.toFixed(1)}%`;
        }
        if (desktopSpan) {
            desktopSpan.textContent = `${desktop.toFixed(1)}%`;
        }

        const channelData = [
            ['Channel', 'Percentage'],
            ['DisplayAds', jsonData.channelsOverview.displayAds],
            ['Paid', jsonData.channelsOverview.paid]
        ];

        const pieData = google.visualization.arrayToDataTable(channelData);
        const pieView = new google.visualization.DataView(pieData);
        pieView.setColumns([0, 1, createTooltipColumn(pieData)]);

        const pieChart = new google.visualization.PieChart(pageElements.columnChart);
        pieChart.draw(pieView, {
            colors: ['#4dabf7', '#3366cc'],
            tooltip: {
                isHtml: true,
                textStyle: { fontSize: 14 },
                trigger: 'focus'
            },
            legend: {
                position: 'bottom',
                textStyle: {
                    fontSize: 14,
                    color: '#fff'
                }
            },
            fontSize: 14,
            backgroundColor: "#0f172a"
        });

        const barDataTable = new google.visualization.DataTable();
        barDataTable.addColumn('string', 'Country');
        barDataTable.addColumn('number', 'Percentage');
        barDataTable.addColumn({ type: 'string', role: 'annotation' });

        Object.entries(jsonData.totals.dist).forEach(([countryCode, data]) => {
            const percentage = (data.clicks / totalClicks) * 100;
            const countryName = getCountryName(countryCode);
            const label = `${percentage.toFixed(2)}%`;
            barDataTable.addRow([countryName, percentage, label]);
        });

        const barChart = new google.visualization.BarChart(pageElements.geoChart);
        barChart.draw(barDataTable, {
            legend: { position: 'none' },
            hAxis: {
                title: 'Click %',
                minValue: 0,
                textStyle: { fontSize: 14, color: "#fff" },
                format: '#\'%\'',
                gridlines: { color: 'transparent' },
                baselineColor: 'transparent'
            },
            vAxis: {
                title: '',
                textStyle: { fontSize: 14, color: "#fff" },
                gridlines: { color: 'transparent' },
                baselineColor: 'transparent'
            },
            chartArea: { width: '85%', height: '90%' },
            backgroundColor: "#0f172a",
            colors: ["#4dabf7"],
            annotations: {
                textStyle: {
                    fontSize: 14,
                    color: '#ffffff',
                    auraColor: 'none'
                },
                alwaysOutside: false
            },
            tooltip: { trigger: 'none' }
        });
        
    } catch (error) {
        console.error('Error in drawCharts:', error);
    }
}

async function setTimeOnSite() {
    try {
        const jsonData = await fetchJsonData(currentJsonFile);
        const timeInMinutes = Math.floor(jsonData.timeOnSite);
        const seconds = Math.round((jsonData.timeOnSite - timeInMinutes) * 60);
        pageElements.timeTitle.textContent = `00:${String(timeInMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error fetching time on site:', error);
        pageElements.timeTitle.textContent = '00:00:00';
    }
}

function updateAllCharts() {
    drawCharts();
}

google.charts.setOnLoadCallback(async () => {
    try {
        currentJsonFile = 'day.json';

        await drawLineChart('daily');
        await drawCharts();
        await setTimeOnSite();

        toggleActiveMode('btnD');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
});


function saveAsPDF() {
    const { jsPDF } = window.jspdf;

    const contentElement = document.body;
    const contentHeight = Math.max(
        contentElement.scrollHeight,
        contentElement.offsetHeight,
        contentElement.clientHeight
    );

    const html2canvasOptions = {
        scale: 2,
        useCORS: true,
        scrollY: 0, 
        height: contentHeight,
        windowHeight: contentHeight,
        ignoreElements: (element) => {
            return element.classList.contains('pop-up-block');
        }
    };

    html2canvas(contentElement, html2canvasOptions).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageRatio = pdfHeight / pdfWidth;
        const contentRatio = canvas.height / canvas.width;
        
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth * contentRatio;
        
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = pdfHeight / contentRatio;
        }

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
             
        pdf.save("page.pdf");
    }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('There was an error generating the PDF. Please try again.');
    });
}