let currentTsData = null;
let currentTsTab = 1;
let gaugeCharts = {};
let currentTsSymbol = '';
let currentTsResolution = 'D';

window.openTechSignalsModal = function() {
    const sec = document.getElementById('techSignalsSection');
    if (sec.style.display === 'none' || sec.style.display === '') {
        sec.style.display = 'flex';
        setTimeout(() => {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        let sym = 'FPT';
        const displayEl = document.getElementById('currentSymbolDisplay');
        if (displayEl) {
            sym = displayEl.innerText.trim().toUpperCase() || 'FPT';
        }
        
        document.getElementById('tsSymbolDisplay').innerText = sym;
        if (sym !== currentTsSymbol || !currentTsData) {
            window.loadTechSignals(sym, currentTsResolution);
        }
    } else {
        sec.style.display = 'none';
    }
};

window.loadTechSignals = async function(symToLoad, resToLoad) {
    let sym = symToLoad || currentTsSymbol;
    if (!sym) {
        const displayEl = document.getElementById('currentSymbolDisplay');
        if (displayEl) sym = displayEl.innerText.trim().toUpperCase() || 'FPT';
    }
    
    let res = resToLoad || currentTsResolution || 'D';
    
    currentTsSymbol = sym;
    currentTsResolution = res;
    
    // Update timeframe UI
    const tfBtns = document.querySelectorAll('.ts-tf-btn');
    tfBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`ts-tf-${res}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.getElementById('tsLoadingSpinner').style.display = 'inline-block';
    try {
        const fetchRes = await fetch(`/api/technical-signals?symbol=${sym}&resolution=${res}`);
        if (!fetchRes.ok) {
            alert('Lỗi phản hồi từ server: ' + fetchRes.status);
            document.getElementById('tsLoadingSpinner').style.display = 'none';
            return;
        }
        const json = await fetchRes.json();
        
        if (json.status === 'success') {
            currentTsData = json.data;
            renderTechSignals();
        } else {
            alert('Lỗi: ' + json.message);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi kết nối API hoặc xử lý dữ liệu.');
    }
    document.getElementById('tsLoadingSpinner').style.display = 'none';
};

function switchTsTab(tabIdx) {
    currentTsTab = tabIdx;
    
    document.getElementById('tsTab1').classList.remove('active');
    document.getElementById('tsTab2').classList.remove('active');
    document.getElementById(`tsTab${tabIdx}`).classList.add('active');
    
    const disclaimer = document.getElementById('tsDisclaimer');
    if (disclaimer) {
        if (tabIdx === 1) {
            disclaimer.innerHTML = 'Các số liệu trên phản ánh hành vi thị trường theo chỉ báo kỹ thuật, không phải khuyến nghị đầu tư.';
        } else {
            disclaimer.innerHTML = 'Các tín hiệu kỹ thuật trên dựa vào phân tích quá mua/quá bán kinh điển. Quý khách vui lòng kết hợp nhiều yếu tố khác trước khi ra quyết định giải ngân.';
        }
    }
    
    renderTechSignals();
}

function renderTechSignals() {
    if (!currentTsData) return;
    
    // Setup ResizeObserver for responsive gauges
    if (!window.tsResizeObserverSetup) {
        window.tsResizeObserverSetup = true;
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                Object.values(gaugeCharts).forEach(c => {
                    if (c) c.resize();
                });
            });
            const sec = document.getElementById('techSignalsSection');
            if (sec) ro.observe(sec);
        } else {
            window.addEventListener('resize', () => {
                Object.values(gaugeCharts).forEach(c => {
                    if (c) c.resize();
                });
            });
        }
    }
    
    const tabData = currentTsTab === 1 ? currentTsData.tab1 : currentTsData.tab2;
    const values = currentTsData.values;
    const mas = currentTsData.mas;
    
    // Render Gauges with specific title colors like TCBS
    renderGauge('gaugeOsc', 'Tín hiệu KT', tabData.gauge_osc, '#f59e0b');
    renderGauge('gaugeOverall', 'Tổng hợp', tabData.gauge_overall, '#d1d4dc');
    renderGauge('gaugeMa', 'TB động', tabData.gauge_ma, '#22c55e');
    
    // Render Oscillators Table
    const oscOrder = ['RSI', 'STOCHK', 'STOCHRSI_FASTK', 'MACD', 'MACD_HISTOGRAM', 'ADX', 'WPR', 'CCI', 'ROC', 'SAR', 'ULTOSC', 'BB_WIDTH'];
    const oscNames = {
        'RSI': 'RSI', 'STOCHK': 'STOCHK', 'STOCHRSI_FASTK': 'STOCHRSI_FASTK', 
        'MACD': 'MACD', 'MACD_HISTOGRAM': 'MACD HISTOGRAM', 'ADX': 'ADX',
        'WPR': 'WPR', 'CCI': 'CCI', 'ROC': 'ROC', 'SAR': 'SAR',
        'ULTOSC': 'ULTOSC', 'BB_WIDTH': 'BB WIDTH'
    };
    
    let oscHtml = '';
    for (let i = 0; i < 6; i++) {
        let k1 = oscOrder[i];
        let k2 = oscOrder[i + 6];
        
        let v1 = values[k1] !== null ? values[k1].toFixed(2) : '-';
        let v2 = values[k2] !== null ? values[k2].toFixed(2) : '-';
        
        let s1 = tabData.signals[k1];
        let s2 = tabData.signals[k2];
        
        let c1 = s1 === 'MUA' ? 'ts-sig-buy' : (s1 === 'BAN' ? 'ts-sig-sell' : 'ts-sig-neutral');
        let c2 = s2 === 'MUA' ? 'ts-sig-buy' : (s2 === 'BAN' ? 'ts-sig-sell' : 'ts-sig-neutral');
        
        let t1 = s1 === 'MUA' ? 'Mua' : (s1 === 'BAN' ? 'Bán' : 'Tr.Tính');
        let t2 = s2 === 'MUA' ? 'Mua' : (s2 === 'BAN' ? 'Bán' : 'Tr.Tính');
        
        oscHtml += `<tr>
            <td style="font-weight: bold;">${oscNames[k1]}</td>
            <td style="text-align: right;">${v1}</td>
            <td style="text-align: right; padding-right: 20px;"><span class="${c1}">${t1}</span></td>
            
            <td style="font-weight: bold; padding-left: 20px;">${oscNames[k2]}</td>
            <td style="text-align: right;">${v2}</td>
            <td style="text-align: right;"><span class="${c2}">${t2}</span></td>
        </tr>`;
    }
    document.querySelector('#tsOscTable tbody').innerHTML = oscHtml;
    
    // Render MA Table
    const maOrder = [5, 10, 20, 50, 100, 200];
    let maHtml = '';
    for (let p of maOrder) {
        let smaKey = `SMA_${p}`;
        let emaKey = `EMA_${p}`;
        
        let smaVal = mas[smaKey] !== null ? mas[smaKey].toFixed(2) : '-';
        let emaVal = mas[emaKey] !== null ? mas[emaKey].toFixed(2) : '-';
        
        let smaSig = tabData.ma_signals[smaKey];
        let emaSig = tabData.ma_signals[emaKey];
        
        let smaClass = smaSig === 'MUA' ? 'ts-sig-buy' : (smaSig === 'BAN' ? 'ts-sig-sell' : 'ts-sig-neutral');
        let emaClass = emaSig === 'MUA' ? 'ts-sig-buy' : (emaSig === 'BAN' ? 'ts-sig-sell' : 'ts-sig-neutral');
        
        let smaText = smaSig === 'MUA' ? 'Mua' : (smaSig === 'BAN' ? 'Bán' : 'Tr.Tính');
        let emaText = emaSig === 'MUA' ? 'Mua' : (emaSig === 'BAN' ? 'Bán' : 'Tr.Tính');
        
        if (!smaSig) { smaClass = 'ts-sig-neutral'; smaText = '-'; }
        if (!emaSig) { emaClass = 'ts-sig-neutral'; emaText = '-'; }
        
        maHtml += `<tr>
            <td style="font-weight: bold;">MA${p}</td>
            <td style="text-align: right;">${smaVal} <span class="ts-sig-badge ${smaClass}">${smaText}</span></td>
            <td style="text-align: right;">${emaVal} <span class="ts-sig-badge ${emaClass}">${emaText}</span></td>
        </tr>`;
    }
    document.querySelector('#tsMaTable tbody').innerHTML = maHtml;
}

function renderGauge(elementId, title, gaugeData, titleColor) {
    const chartDom = document.getElementById(elementId);
    if (!chartDom) return;
    
    let myChart = gaugeCharts[elementId];
    if (!myChart) {
        myChart = echarts.init(chartDom);
        gaugeCharts[elementId] = myChart;
    }
    
    let score100 = ((gaugeData.score + 1) / 2) * 100;
    
    let stateText = '';
    let stateColor = '';
    
    switch(gaugeData.state) {
        case 'MUA_MANH': stateText = 'MUA MẠNH'; stateColor = '#22c55e'; break;
        case 'MUA': stateText = 'MUA'; stateColor = '#22c55e'; break;
        case 'TRUNG_TINH': stateText = 'TR.TÍNH'; stateColor = '#a3a6af'; break;
        case 'BAN': stateText = 'BÁN'; stateColor = '#ef4444'; break;
        case 'BAN_MANH': stateText = 'BÁN MẠNH'; stateColor = '#ef4444'; break;
    }

    // HTML Overlay for text
    const wrapperDom = chartDom.parentElement;
    let overlayDom = wrapperDom.querySelector('.ts-gauge-overlay');
    if (!overlayDom) {
        overlayDom = document.createElement('div');
        overlayDom.className = 'ts-gauge-overlay';
        overlayDom.style.position = 'absolute';
        overlayDom.style.bottom = '-10px';
        overlayDom.style.left = '0';
        overlayDom.style.width = '100%';
        overlayDom.style.textAlign = 'center';
        wrapperDom.appendChild(overlayDom);
    }
    
    overlayDom.innerHTML = `
        <div style="position: absolute; bottom: 65px; left: 10px; color: #a3a6af; font-size: 12px; text-align: left;">Lực bán</div>
        <div style="position: absolute; bottom: 65px; right: 10px; color: #a3a6af; font-size: 12px; text-align: right;">Lực mua</div>
        <div style="color: ${stateColor}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">${stateText}</div>
        <div style="display: flex; justify-content: center; gap: 20px; text-align: center;">
            <div>
                <div style="color: #ef4444; font-size: 15px; font-weight: bold;">${gaugeData.sell}</div>
                <div style="color: #a3a6af; font-size: 11px;">Bán</div>
            </div>
            <div>
                <div style="color: #d1d4dc; font-size: 15px; font-weight: bold;">${gaugeData.neutral}</div>
                <div style="color: #a3a6af; font-size: 11px;">Tr.Tính</div>
            </div>
            <div>
                <div style="color: #22c55e; font-size: 15px; font-weight: bold;">${gaugeData.buy}</div>
                <div style="color: #a3a6af; font-size: 11px;">Mua</div>
            </div>
        </div>
    `;
    
    // Glow effect
    chartDom.style.background = 'radial-gradient(circle at 50% 65%, rgba(14, 165, 233, 0.15) 0%, transparent 60%)';

    const option = {
        title: {
            text: title,
            left: 'center',
            top: '0%',
            textStyle: { 
                color: titleColor || '#d1d4dc', 
                fontSize: 14, 
                fontWeight: '600',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                letterSpacing: 0.5
            }
        },
        series: [
            {
                type: 'gauge',
                center: ['50%', '65%'],
                radius: '80%',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 5,
                progress: { show: false },
                pointer: {
                    show: true,
                    length: '65%',
                    width: 3,
                    itemStyle: { color: '#f59e0b' }
                },
                anchor: {
                    show: true,
                    showAbove: true,
                    size: 8,
                    itemStyle: { color: '#1a1c24', borderColor: '#f59e0b', borderWidth: 2 }
                },
                axisLine: {
                    lineStyle: {
                        width: 3,
                        color: [
                            [0.2, '#ef4444'],    // Bán mạnh (Red)
                            [0.4, '#fca5a5'],    // Bán (Pink)
                            [0.6, '#ffffff'],    // Tr.Tính (White)
                            [0.8, '#6ee7b7'],    // Mua (Mint)
                            [1.0, '#22c55e']     // Mua mạnh (Green)
                        ]
                    }
                },
                axisTick: { show: false },
                splitLine: { 
                    show: true,
                    length: 6,
                    distance: -4,
                    lineStyle: {
                        color: '#1a1c24', // Background color to create gap effect
                        width: 3
                    }
                },
                axisLabel: { 
                    show: false
                },
                title: { show: false },
                detail: { show: false },
                data: [{ value: score100 }]
            }
        ]
    };

    myChart.setOption(option);
}
