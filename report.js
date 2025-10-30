// Report generation functions for Water Footprinting Calculator

function generateReport(crop, area, yieldInput, irrigationMethod, metrics, fertData, climate) {
    const timestamp = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const locationInfo = weatherData ? 
        `Location: ${weatherData.city}\nTemperature: ${weatherData.temp}°C\nHumidity: ${weatherData.humidity}%\nRainfall: ${weatherData.rainfall} mm/month\nWind Speed: ${weatherData.windSpeed} km/h` :
        'Weather data not available';

    const report = `
=======================================================
           किसान पानी कैलकुलेटर - DETAILED REPORT
=======================================================
Generated on: ${timestamp}

${locationInfo}
Climate Zone: ${climate}

CROP INFORMATION
---------------
Crop: ${crop}
Area: ${area} hectares
Expected Yield: ${metrics.actualYield} tons/hectare
Irrigation Method: ${irrigationMethod} 
Growing Period: ${cropDatabase[crop].growingDays} days

WATER FOOTPRINT ANALYSIS
----------------------
Blue Water (Irrigation): ${metrics.blue} m³/ton
Green Water (Rainfall): ${metrics.green} m³/ton
Grey Water (Pollution Control): ${metrics.grey} m³/ton

Total Water per Ton: ${metrics.totalPerTon} m³/ton
Total Production: ${metrics.totalProduction} tons
Total Water Consumption: ${metrics.totalConsumptionValue.toLocaleString()} m³

FERTILIZER RECOMMENDATIONS
------------------------
NPK Requirements (per hectare):
- Nitrogen (N): ${fertData.nPerHa} kg/ha
- Phosphorus (P): ${fertData.pPerHa} kg/ha
- Potassium (K): ${fertData.kPerHa} kg/ha

Application Schedule (for total area):
1. At Sowing:
   - Urea: ${fertData.basalUrea} kg
   - DAP: ${fertData.basalDAP} kg
   - MOP: ${fertData.basalMOP} kg

${generateTopDressingReport(crop, area, fertData.adj.topFactor)}

Organic & Micronutrients:
${cropDatabase[crop].fertilizer.organic}
${cropDatabase[crop].fertilizer.micronutrients}

CLIMATE ADJUSTMENTS & RECOMMENDATIONS
----------------------------------
${generateClimateAdvice(climate, weatherData ? weatherData.rainfall : null, weatherData ? weatherData.temp : null, fertData.adj)}

=======================================================
                   End of Report
        Save water today for a better tomorrow
=======================================================
    `;

    return report;
}

function generateTopDressingReport(crop, area, topFactor) {
    const fertData = cropDatabase[crop].fertilizer;
    let report = '2. Top Dressing:\n';

    if (fertData.top1) {
        const amount = Math.round(fertData.top1.urea * topFactor * area);
        report += `   First Application (${fertData.top1.days} days - ${fertData.top1.stage}):\n`;
        report += `   - Urea: ${amount} kg\n`;
    }

    if (fertData.top2) {
        const amount = Math.round(fertData.top2.urea * topFactor * area);
        report += `   Second Application (${fertData.top2.days} days - ${fertData.top2.stage}):\n`;
        report += `   - Urea: ${amount} kg\n`;
    }

    return report;
}

function generateClimateAdvice(climate, rainfall, temp, adj) {
    let advice = [];

    // Climate-based advice
    switch (climate) {
        case 'tropical':
            advice.push(`• Nitrogen reduced by ${Math.round((1 - adj.nFactor) * 100)}% due to high rainfall zone`);
            advice.push('• Consider split applications to reduce leaching loss');
            advice.push('• Increase organic matter application to improve nutrient retention');
            break;
        case 'arid':
            advice.push(`• Potassium increased by ${Math.round((adj.kFactor - 1) * 100)}% for drought tolerance`);
            advice.push('• Implement mulching to conserve soil moisture');
            advice.push('• Consider drip irrigation if not already using');
            break;
        case 'continental':
            advice.push('• Adjusted for slower nutrient mineralization in cool climate');
            advice.push('• Monitor soil temperature before major fertilizer applications');
            break;
        case 'mediterranean':
            advice.push('• Standard rates with slight adjustments for seasonal variation');
            advice.push('• Focus on water conservation during dry season');
            break;
        default:
            advice.push('• Standard fertilizer rates recommended');
            advice.push('• Adjust based on soil test results');
    }

    // Rainfall-specific advice
    if (rainfall !== null) {
        if (rainfall >= 200) {
            advice.push('\nHeavy Rainfall Considerations:');
            advice.push('• Split nitrogen applications to minimize leaching');
            advice.push('• Consider foliar applications for micronutrients');
            advice.push('• Ensure good drainage to prevent waterlogging');
        } else if (rainfall <= 30) {
            advice.push('\nDry Conditions Considerations:');
            advice.push('• Apply fertilizers when soil moisture is adequate');
            advice.push('• Consider fertigation if irrigation available');
            advice.push('• Monitor soil moisture regularly');
        }
    }

    // Temperature-specific advice
    if (temp !== null) {
        if (temp >= 32) {
            advice.push('\nHigh Temperature Management:');
            advice.push('• Apply foliar sprays early morning or evening');
            advice.push('• Consider additional potassium for stress tolerance');
            advice.push('• Mulch to reduce soil temperature and moisture loss');
        } else if (temp <= 8) {
            advice.push('\nLow Temperature Management:');
            advice.push('• Delay fertilizer application until soil warms');
            advice.push('• Reduce nitrogen to prevent excessive vegetative growth');
            advice.push('• Monitor crop for cold stress symptoms');
        }
    }

    return advice.join('\n');
}

// Function to download report as a text file
function downloadReport(reportText, filename = 'WaterFootprint-Report.txt') {
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Function to show report in a modal
function showReportModal(reportText) {
    // Create modal container
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Create modal content
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✖';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 5px;
    `;
    closeBtn.onclick = () => modal.remove();

    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '📥 Download Report';
    downloadBtn.style.cssText = `
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 20px 0;
    `;
    downloadBtn.onclick = () => downloadReport(reportText);

    // Add report content
    const pre = document.createElement('pre');
    pre.style.cssText = `
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: monospace;
        font-size: 14px;
        line-height: 1.5;
    `;
    pre.textContent = reportText;

    // Assemble modal
    content.appendChild(closeBtn);
    content.appendChild(pre);
    content.appendChild(downloadBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}