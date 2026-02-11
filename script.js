let chart;
let regressionModel = { m: 0, b: 0, r2: 0 };

async function init() {
    loadHistory();
    calculate();
}

function addRow() {
    const tbody = document.getElementById('dataBody');
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition-colors";
    tr.innerHTML = `
        <td class="py-3"><input type="number" step="any" class="w-full border rounded px-2 py-1 x-val" placeholder="0.0"></td>
        <td class="py-3"><input type="number" step="any" class="w-full border rounded px-2 py-1 y-val" placeholder="0.0"></td>
        <td class="py-3 text-right"><button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-600">✕</button></td>
    `;
    tbody.appendChild(tr);
}

async function calculate() {
    const xInputs = document.querySelectorAll('.x-val');
    const yInputs = document.querySelectorAll('.y-val');
    let data = [];

    xInputs.forEach((input, i) => {
        if(input.value !== "" && yInputs[i].value !== "") {
            data.push({x: parseFloat(input.value), y: parseFloat(yInputs[i].value)});
        }
    });

    if(data.length < 2) return;

    // Linear Regression Math
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    data.forEach(p => {
        sumX += p.x; sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
        sumY2 += p.y * p.y;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    const numerator = Math.pow((n * sumXY - sumX * sumY), 2);
    const denominator = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
    const r2 = denominator !== 0 ? numerator / denominator : 0;

    regressionModel = { m, b, r2 };

    // Update UI
    document.getElementById('valM').innerText = m.toFixed(6);
    document.getElementById('valB').innerText = b.toFixed(6);
    document.getElementById('valR2').innerText = r2.toFixed(6);
    document.getElementById('formulaText').innerText = `y = ${m.toFixed(4)}x ${b >= 0 ? '+' : ''} ${b.toFixed(4)}`;

    updateChart(data, m, b);
    updateUnknown();
}

function updateChart(data, m, b) {
    const ctx = document.getElementById('regressionChart').getContext('2d');
    const minX = Math.min(...data.map(p => p.x));
    const maxX = Math.max(...data.map(p => p.x));
    const lineData = [
        {x: minX, y: m * minX + b},
        {x: maxX, y: m * maxX + b}
    ];

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Standard Samples',
                data: data,
                backgroundColor: '#3498db',
                pointRadius: 6
            }, {
                label: 'Regression Line',
                data: lineData,
                type: 'line',
                borderColor: '#e74c3c',
                borderWidth: 2,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Concentration (x)' }, grid: { alpha: 0.1 } },
                y: { title: { display: true, text: 'Absorbance (y)' }, grid: { alpha: 0.1 } }
            }
        }
    });
}

function updateUnknown() {
    const y = parseFloat(document.getElementById('unknownY').value);
    const resultEl = document.getElementById('resultX');
    if(!isNaN(y) && regressionModel.m !== 0) {
        const x = (y - regressionModel.b) / regressionModel.m;
        resultEl.innerText = x.toFixed(6);
        resultEl.classList.remove('text-slate-400');
        resultEl.classList.add('text-blue-600');
    } else {
        resultEl.innerText = '--';
    }
}

function exportToCSV() {
    const xInputs = document.querySelectorAll('.x-val');
    const yInputs = document.querySelectorAll('.y-val');
    let csvContent = "data:text/csv;charset=utf-8,Concentration,Absorbance\n";
    
    xInputs.forEach((input, i) => {
        if(input.value !== "" && yInputs[i].value !== "") {
            csvContent += `${input.value},${yInputs[i].value}\n`;
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spectral_data_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToExcel() {
    const xInputs = document.querySelectorAll('.x-val');
    const yInputs = document.querySelectorAll('.y-val');
    let rows = [["Concentration (x)", "Absorbance (y)"]];
    
    xInputs.forEach((input, i) => {
        if(input.value !== "" && yInputs[i].value !== "") {
            rows.push([parseFloat(input.value), parseFloat(yInputs[i].value)]);
        }
    });

    // Add regression metrics
    rows.push([]);
    rows.push(["Regression Analysis"]);
    rows.push(["Equation", document.getElementById('formulaText').innerText]);
    rows.push(["Slope (m)", regressionModel.m]);
    rows.push(["Intercept (b)", regressionModel.b]);
    rows.push(["R-Squared", regressionModel.r2]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Spectral Analysis");
    XLSX.writeFile(workbook, `spectral_analysis_${new Date().getTime()}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Spectral Linear Regression Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary Box
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 35, 182, 35, 'F');
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text("Regression Model Summary:", 20, 45);
    doc.setFont(undefined, 'normal');
    doc.text(`Equation: ${document.getElementById('formulaText').innerText}`, 20, 52);
    doc.text(`Slope (m): ${regressionModel.m.toFixed(6)}`, 20, 59);
    doc.text(`Intercept (b): ${regressionModel.b.toFixed(6)}`, 90, 59);
    doc.text(`R-Squared (R2): ${regressionModel.r2.toFixed(6)}`, 20, 66);

    // Data Table
    const xInputs = document.querySelectorAll('.x-val');
    const yInputs = document.querySelectorAll('.y-val');
    let tableData = [];
    xInputs.forEach((input, i) => {
        if(input.value !== "" && yInputs[i].value !== "") {
            tableData.push([input.value, yInputs[i].value]);
        }
    });

    doc.autoTable({
        startY: 75,
        head: [['Concentration (x)', 'Absorbance (y)']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
    });

    // Add Chart Image
    const canvas = document.getElementById('regressionChart');
    const imgData = canvas.toDataURL('image/png');
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Visualization Plot:", 14, finalY);
    doc.addImage(imgData, 'PNG', 14, finalY + 5, 180, 100);

    doc.save(`spectral_report_${new Date().getTime()}.pdf`);
}

// Backend Assistance: Save to history
async function saveToBackend() {
    if (regressionModel.m === 0) return alert("Please calculate first");
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: regressionModel,
                sampleCount: document.querySelectorAll('.x-val').length
            })
        });
        if (response.ok) {
            console.log("✅ Analysis saved to backend");
            loadHistory();
        }
    } catch (err) {
        console.error("❌ Backend error:", err);
    }
}

async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item flex justify-between items-center text-sm';
            div.innerHTML = `
                <div>
                    <p class="font-bold text-slate-700">R² = ${item.model.r2.toFixed(4)}</p>
                    <p class="text-xs text-slate-400">${new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs font-mono text-blue-500">m=${item.model.m.toFixed(4)}</p>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.warn("Backend not available for history");
    }
}

// Event Listeners
document.getElementById('unknownY').addEventListener('input', updateUnknown);
window.onload = init;
