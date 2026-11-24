const sample = [
  18.2, 20.1, 21.4, 17.8, 24.9, 26.3, 25.5, 23.8, 19.2, 18.7, 20.4, 22.1, 28.7, 30.2, 27.1,
  24.4, 22.8, 21.5, 19.9, 18.1, 23.5, 25.8, 26.9, 29.4, 31.7, 28.8, 24.6, 22.7, 21.9, 20.8
];
let readings = [...sample];
const $ = (selector) => document.querySelector(selector);
function formatNumber(number, decimals = 0) { return Number(number).toFixed(decimals); }

function render() {
  const total = readings.reduce((sum, value) => sum + value, 0);
  const average = total / readings.length;
  const cost = total * 0.18;
  const peak = Math.max(...readings);
  $("#usageMetric").textContent = `${formatNumber(total, 0)} kWh`;
  $("#costMetric").textContent = `$${formatNumber(cost, 0)}`;
  $("#opportunityMetric").textContent = `${formatNumber(peak - average, 1)} kWh`;
  $("#carbonMetric").textContent = formatNumber(total * 0.36, 0);
  $("#usageDelta").textContent = `${formatNumber(average, 1)} kWh average per day`;
  $("#costDelta").textContent = "At $0.18 / kWh";
  $("#opportunityDelta").textContent = "Peak-day reduction target";
  drawChart();
  renderBreakdown(total);
  renderRecommendations(total, peak);
}

function drawChart() {
  const svg = $("#usageChart");
  const width = 680, height = 230, pad = 25;
  const max = Math.max(...readings) + 4, min = Math.max(0, Math.min(...readings) - 5);
  const points = readings.map((value, index) => `${pad + index * ((width - pad * 2) / (readings.length - 1))},${height - pad - ((value - min) / (max - min)) * (height - pad * 2)}`).join(" ");
  const grid = [0, 1, 2, 3].map((line) => {
    const y = pad + line * ((height - pad * 2) / 3);
    return `<line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" stroke="#e8ede7" stroke-width="1"/><text x="0" y="${y + 4}" fill="#9ba69f" font-size="10">${formatNumber(max - line * ((max - min) / 3), 0)}</text>`;
  }).join("");
  const forecastStart = Math.max(0, readings.length - 5);
  const forecastX = pad + forecastStart * ((width - pad * 2) / (readings.length - 1));
  svg.innerHTML = `${grid}<rect x="${forecastX}" y="${pad}" width="${width - pad - forecastX}" height="${height - pad * 2}" fill="#fff3e9"/><polyline points="${points}" fill="none" stroke="#2d7658" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${readings.map((value, index) => `<circle cx="${pad + index * ((width - pad * 2) / (readings.length - 1))}" cy="${height - pad - ((value - min) / (max - min)) * (height - pad * 2)}" r="${index === readings.length - 1 ? 4 : 2.5}" fill="${index >= forecastStart ? "#f29c62" : "#2d7658"}"/>`).join("")}`;
}

function renderBreakdown(total) {
  const items = [["Heating & cooling", .39, "#2d7658"], ["Water heating", .23, "#8ebbc5"], ["Kitchen", .17, "#f29c62"], ["Always-on devices", .12, "#c8e86c"], ["Other", .09, "#b8c0b9"]];
  $("#breakdown").innerHTML = items.map(([name, share, color]) => `<div class="bar-row"><div class="bar-label"><span>${name}</span><span>${formatNumber(total * share, 0)} kWh · ${share * 100}%</span></div><div class="bar-track"><div class="bar-fill" style="width:${share * 100}%;background:${color}"></div></div></div>`).join("");
}

function renderRecommendations(total, peak) {
  const recs = [
    ["01", "Shift the peak", `Your highest day reached ${formatNumber(peak, 1)} kWh. Moving laundry and dishwashing outside the 5–9pm window could flatten the peak.`, "$8–14 / mo", "Low effort"],
    ["02", "Tune the thermostat", "Heating and cooling are the largest estimated load. A 1°C adjustment during unoccupied hours is a low-risk place to start.", "$18–31 / mo", "Low effort"],
    ["03", "Find the quiet drain", "Always-on devices add up. A smart plug audit can find standby loads without changing your daily routine.", "$6–11 / mo", "One-time setup"]
  ];
  $("#recommendations").innerHTML = recs.map(([number, title, text, saving, effort]) => `<article class="recommendation"><span class="rec-number">${number}</span><h3>${title}</h3><p>${text}</p><div class="rec-footer"><span class="saving">${saving}</span><span class="effort">${effort}</span></div></article>`).join("");
}

function parseCsv(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = String(reader.result).trim().split(/\r?\n/);
    const headers = rows.shift().toLowerCase().split(",").map((header) => header.trim());
    const index = headers.indexOf("kwh");
    const parsed = rows.map((row) => Number(row.split(",")[index])).filter((value) => Number.isFinite(value) && value >= 0);
    if (parsed.length >= 3) { readings = parsed.slice(-60); $("#homeTitle").textContent = `Imported home · ${parsed.length} readings`; render(); }
    else window.alert("Please provide a CSV with a numeric kWh column, for example: date,kwh");
  };
  reader.readAsText(file);
}

["#loadSample", "#heroSample"].forEach((selector) => $(selector).addEventListener("click", () => { readings = [...sample]; $("#homeTitle").textContent = "Sample home · October"; render(); document.querySelector("#insights").scrollIntoView({ behavior: "smooth" }); }));
["#csvInput", "#csvInputBottom"].forEach((selector) => $(selector).addEventListener("change", (event) => { if (event.target.files[0]) parseCsv(event.target.files[0]); }));
render();
