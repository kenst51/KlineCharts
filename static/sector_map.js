let icbData = [];
let sectorMapInitialized = false;

// Format numbers
const formatNum = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

async function initSectorMap() {
    await fetchIcbTree();
}

// ----------------------------------------------------
// 1. ICB Tree Logic
// ----------------------------------------------------
async function fetchIcbTree() {
    try {
        const res = await fetch('/api/vietcap/sectors/icb-codes');
        const json = await res.json();
        
        if (json.data) {
            icbData = json.data;
        } else if (Array.isArray(json)) {
            icbData = json;
        }
        
        if (icbData && icbData.length > 0) {
            renderIcbTree();
        }
    } catch(e) {
        console.error('Lỗi tải ICB Tree:', e);
        document.getElementById('icbTreeContainer').innerHTML = '<div style="color: #ff5252; padding: 20px;">Lỗi tải dữ liệu phân ngành.</div>';
    }
}

function renderIcbTree() {
    const container = document.getElementById('icbTreeContainer');
    container.innerHTML = '';
    
    const level1 = icbData.filter(d => d.icbLevel === 1 && d.name !== '8301').sort((a,b) => a.name.localeCompare(b.name));
    
    level1.forEach(l1 => {
        const node = createIcbNode(l1);
        container.appendChild(node);
    });
}

function createIcbNode(data) {
    const wrapper = document.createElement('div');
    
    const item = document.createElement('div');
    item.className = 'icb-item';
    item.dataset.code = data.name;
    
    const children = icbData.filter(d => d.icbLevel === data.icbLevel + 1 && d.name.startsWith(data.name.substring(0, data.icbLevel)));
    const hasChildren = children.length > 0;
    
    item.innerHTML = `
        <span style="flex:1;">${data.viSector || data.enSector}</span>
        <span class="icb-toggle">${hasChildren ? '▶' : ''}</span>
    `;
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'icb-node';
    
    if(hasChildren) {
        children.sort((a,b) => a.name.localeCompare(b.name)).forEach(childData => {
            childrenContainer.appendChild(createIcbNode(childData));
        });
    }
    
    item.onclick = (e) => {
        e.stopPropagation();
        
        document.querySelectorAll('.icb-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        if(hasChildren) {
            const isExpanded = childrenContainer.classList.contains('expanded');
            childrenContainer.classList.toggle('expanded');
            item.querySelector('.icb-toggle').innerText = isExpanded ? '▼' : '▶';
        }
        
        loadSectorData(data.name, data.viSector || data.enSector);
    };
    
    wrapper.appendChild(item);
    wrapper.appendChild(childrenContainer);
    return wrapper;
}
    
// ----------------------------------------------------
// 3. Omnibar Logic
// ----------------------------------------------------
let omnibarSearchTimeout;
function setupOmnibar() {
    const input = document.getElementById('omnibarInput');
    const dropdown = document.getElementById('omnibarDropdown');
    
    input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        clearTimeout(omnibarSearchTimeout);
        
        if(!val) {
            dropdown.style.display = 'none';
            return;
        }
        
        omnibarSearchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/vietcap/company/search-bar?keyword=${encodeURIComponent(val)}`);
                const json = await res.json();
                
                const data = json.data || [];
                if(data.length === 0) {
                    dropdown.innerHTML = '<div style="padding: 15px; color: #787B86;">Không tìm thấy kết quả.</div>';
                    dropdown.style.display = 'block';
                    return;
                }
                
                let html = '';
                data.slice(0, 10).forEach(item => {
                    html += `
                        <div class="omnibar-item" onclick="selectOmnibarItem('${item.symbol}', '${item.icbCode}')">
                            <span class="ob-sym">${item.symbol}</span>
                            <span class="ob-name">${item.companyName}</span>
                            <span class="ob-exchange">${item.exchange}</span>
                        </div>
                    `;
                });
                dropdown.innerHTML = html;
                dropdown.style.display = 'block';
                
            } catch(e) {
                console.error(e);
            }
        }, 300);
    });
    
    document.addEventListener('click', (e) => {
        if(e.target !== input && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function selectOmnibarItem(sym, icbCode) {
    document.getElementById('omnibarDropdown').style.display = 'none';
    document.getElementById('omnibarInput').value = '';
    
    if(icbCode) {
        const node = document.querySelector(`.icb-item[data-code="${icbCode}"]`);
        if(node) {
            let parent = node.parentElement;
            while(parent && parent.id !== 'icbTreeContainer') {
                if(parent.classList.contains('icb-node')) {
                    parent.classList.add('expanded');
                    const toggle = parent.previousElementSibling.querySelector('.icb-toggle');
                    if(toggle) toggle.innerText = '▼';
                }
                parent = parent.parentElement;
            }
            node.click();
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            openSymbolFromSector(sym);
        }
    } else {
        openSymbolFromSector(sym);
    }
}


function openSymbolFromSector(sym) {
    if(typeof loadSymbolFromWatchlist === 'function') {
        loadSymbolFromWatchlist(sym);
    }
    const itemCophieu = document.getElementById('menuItemCophieu');
    if(itemCophieu) itemCophieu.click();
}

async function loadSectorData(icbCode, sectorName) {
    const titleEl = document.getElementById('sgTitle');
    const contentEl = document.getElementById('sgContent');
    
    if (!titleEl || !contentEl) return;
    
    titleEl.innerText = 'Cổ phiếu ngành ' + sectorName;
    contentEl.innerHTML = '<div style="width:100%; text-align:center; padding:20px; color:#787b86;">Đang tải danh sách cổ phiếu...</div>';
    
    try {
        const res = await fetch('/api/fialda/sector-stocks/' + icbCode);
        const data = await res.json();
        
        if (data.error || !data.symbols || data.symbols.length === 0) {
            contentEl.innerHTML = '<div style="width:100%; text-align:center; padding:20px; color:#787b86;">Không có cổ phiếu nào trong ngành này</div>';
            return;
        }
        
        let html = '';
        data.symbols.forEach(sym => {
            html += `<div class="stock-pill" onclick="openSymbolFromSector('${sym}')" style="cursor: pointer; padding: 8px 16px; background: transparent; border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-primary); font-weight: bold; transition: background 0.2s;">${sym}</div>`;
        });
        
        contentEl.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        contentEl.innerHTML = '<div style="width:100%; text-align:center; padding:20px; color:#e53935;">Đã xảy ra lỗi</div>';
    }
}

// Sync Fialda data manually
document.addEventListener('DOMContentLoaded', () => {
    const btnSync = document.getElementById('btnSyncFialda');
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            const originalText = btnSync.innerHTML;
            btnSync.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Đang cập nhật...';
            btnSync.disabled = true;
            btnSync.style.opacity = '0.7';
            
            try {
                const res = await fetch('/api/fialda/sync', { method: 'POST' });
                const data = await res.json();
                
                if (data.status === 'success') {
                    alert('Đồng bộ dữ liệu Fialda thành công! Trang sẽ tự tải lại.');
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.message || 'Không xác định'));
                }
            } catch (err) {
                console.error(err);
                alert('Lỗi kết nối khi đồng bộ.');
            } finally {
                btnSync.innerHTML = originalText;
                btnSync.disabled = false;
                btnSync.style.opacity = '1';
            }
        });
    }
    
    // Add simple spin animation if not exists
    if (!document.getElementById('sync-style')) {
        const style = document.createElement('style');
        style.id = 'sync-style';
        style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }';
        document.head.appendChild(style);
    }
});
