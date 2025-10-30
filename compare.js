// compare.js - holds crop comparison helpers used by Untitled-1.html

// Compute water & production metrics for a crop without touching the DOM
function computeMetrics(crop, area, yieldInput, irrigationMethod) {
    const base = cropDatabase[crop];
    const efficiency = irrigationEfficiency[irrigationMethod];

    let ET0, rainfall, climate = 'temperate';
    if (weatherData) {
        ET0 = calculateET0(weatherData.temp, weatherData.humidity, weatherData.windSpeed, weatherData.lat);
        rainfall = weatherData.rainfall;
        climate = determineClimate(weatherData.temp, weatherData.humidity);
    } else {
        ET0 = calculateET0(25, 60, 10, 20);
        rainfall = 50;
    }

    const dailyRainfall = rainfall / 30;
    const cropET = ET0 * base.kc;
    const dailyIrrigationNeed = Math.max(0, cropET - dailyRainfall);
    const totalIrrigationMM = dailyIrrigationNeed * base.growingDays;

    const actualYield = yieldInput || base.baseYield;
    const blueWaterPerTon = (totalIrrigationMM * 10) / actualYield / efficiency;

    const green = Math.round(base.green);
    const grey = Math.round(base.grey);
    const blue = Math.round(blueWaterPerTon);

    const totalPerTon = blue + green + grey;
    const totalProduction = actualYield * area;
    const totalConsumptionValue = totalPerTon * totalProduction;

    return {
        crop,
        area,
        actualYield,
        blue,
        green,
        grey,
        totalPerTon,
        totalProduction,
        totalConsumptionValue,
        rainfall,
        ET0,
        climate
    };
}

// Compute fertilizer recommendation data (same logic as UI but returns data only)
function computeFertilizerData(crop, area, climate) {
    const fertData = cropDatabase[crop].fertilizer;
    // Default adjustment factors
    let adj = { nFactor:1, pFactor:1, kFactor:1, basalFactor:1, topFactor:1 };
    const rain = weatherData ? weatherData.rainfall : null;
    const temp = weatherData ? weatherData.temp : null;

    switch (climate) {
        case 'tropical': adj.nFactor = 0.85; adj.basalFactor = 0.95; adj.topFactor = 0.9; break;
        case 'arid': adj.kFactor = 1.20; adj.basalFactor = 1.05; adj.topFactor = 1.1; break;
        case 'continental': adj.nFactor = 0.9; adj.kFactor = 0.95; break;
        case 'mediterranean': adj.nFactor = 0.95; break;
        default: break;
    }

    if (rain !== null) {
        if (rain >= 200) adj.nFactor *= 0.85;
        else if (rain <= 30) adj.kFactor *= 1.05;
    }
    if (temp !== null) {
        if (temp >= 32) adj.kFactor *= 1.05;
        else if (temp <= 8) adj.nFactor *= 0.9;
    }

    const nPerHa = Math.round(fertData.n * adj.nFactor);
    const pPerHa = Math.round(fertData.p * adj.pFactor);
    const kPerHa = Math.round(fertData.k * adj.kFactor);

    const basalUrea = Math.round(fertData.basal.urea * adj.basalFactor * area);
    const basalDAP = Math.round(fertData.basal.dap * area);
    const basalMOP = Math.round(fertData.basal.mop * adj.basalFactor * area);

    return { nPerHa, pPerHa, kPerHa, basalUrea, basalDAP, basalMOP, adj };
}

// Compare two crops and render results side-by-side
function compareCrops() {
    const cropA = document.getElementById('compareCropA').value;
    const cropB = document.getElementById('compareCropB').value;
    const areaA = parseFloat(document.getElementById('compareAreaA').value) || 1;
    const areaB = parseFloat(document.getElementById('compareAreaB').value) || 1;
    const irrigationMethod = document.getElementById('irrigation').value;

    if (!cropA || !cropB) {
        alert('दोनों फसल चुनें / Please select both crops to compare');
        return;
    }

    // For yields use user input or base yields
    const yieldInput = parseFloat(document.getElementById('yield').value) || null;

    const metricsA = computeMetrics(cropA, areaA, yieldInput, irrigationMethod);
    const metricsB = computeMetrics(cropB, areaB, yieldInput, irrigationMethod);

    const fertA = computeFertilizerData(cropA, areaA, metricsA.climate);
    const fertB = computeFertilizerData(cropB, areaB, metricsB.climate);

    const html = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div style="background:white; padding:16px; border-radius:12px; border:2px solid #e0e0e0;">
                <h3 style="margin:0 0 8px;">Crop A: ${cropA}</h3>
                <p style="margin:6px 0"><strong>Area:</strong> ${areaA} ha</p>
                <p style="margin:6px 0"><strong>Yield used:</strong> ${metricsA.actualYield} t/ha</p>
                <p style="margin:6px 0"><strong>Water per ton:</strong> ${metricsA.totalPerTon} m³/ton</p>
                <p style="margin:6px 0"><strong>Total consumption:</strong> ${metricsA.totalConsumptionValue.toLocaleString()} m³</p>
                <hr>
                <h4 style="margin:8px 0 6px;">Fertilizer (adjusted)</h4>
                <p style="margin:4px 0">N: ${fertA.nPerHa} kg/ha</p>
                <p style="margin:4px 0">P: ${fertA.pPerHa} kg/ha</p>
                <p style="margin:4px 0">K: ${fertA.kPerHa} kg/ha</p>
                <p style="margin:4px 0">Basal Urea: ${fertA.basalUrea} kg</p>
                <p style="margin:4px 0">Basal DAP: ${fertA.basalDAP} kg</p>
                <p style="margin:4px 0">Basal MOP: ${fertA.basalMOP} kg</p>
            </div>
            <div style="background:white; padding:16px; border-radius:12px; border:2px solid #e0e0e0;">
                <h3 style="margin:0 0 8px;">Crop B: ${cropB}</h3>
                <p style="margin:6px 0"><strong>Area:</strong> ${areaB} ha</p>
                <p style="margin:6px 0"><strong>Yield used:</strong> ${metricsB.actualYield} t/ha</p>
                <p style="margin:6px 0"><strong>Water per ton:</strong> ${metricsB.totalPerTon} m³/ton</p>
                <p style="margin:6px 0"><strong>Total consumption:</strong> ${metricsB.totalConsumptionValue.toLocaleString()} m³</p>
                <hr>
                <h4 style="margin:8px 0 6px;">Fertilizer (adjusted)</h4>
                <p style="margin:4px 0">N: ${fertB.nPerHa} kg/ha</p>
                <p style="margin:4px 0">P: ${fertB.pPerHa} kg/ha</p>
                <p style="margin:4px 0">K: ${fertB.kPerHa} kg/ha</p>
                <p style="margin:4px 0">Basal Urea: ${fertB.basalUrea} kg</p>
                <p style="margin:4px 0">Basal DAP: ${fertB.basalDAP} kg</p>
                <p style="margin:4px 0">Basal MOP: ${fertB.basalMOP} kg</p>
            </div>
        </div>
    `;

    const container = document.getElementById('compareResults');
    container.innerHTML = html;
    container.style.display = 'block';
    // Scroll into view
    container.scrollIntoView({behavior:'smooth'});
}
