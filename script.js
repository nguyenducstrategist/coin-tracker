const firebaseConfig = {
  apiKey: "AIzaSyDKA8vVF_aSF-K6s5KYE_rvqfWczKcq58I",
  authDomain: "coin-tracker-eab72.firebaseapp.com",
  databaseURL: "https://coin-tracker-eab72-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "coin-tracker-eab72",
  storageBucket: "coin-tracker-eab72.firebasestorage.app",
  messagingSenderId: "901455627673",
  appId: "1:901455627673:web:d02f1a3495416a0cf87f08",
  measurementId: "G-KZS11T7QXV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const coinsRef = db.ref('coins');

let coins = [];
let currentFilter = 'all';
let priceCache = {};
let alphaListCache = null;
let notifyReady = false;

coinsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    coins = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })).sort((a, b) => b.timestamp - a.timestamp);
    renderList();
    updateStats();
});

function askNotify() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        notifyReady = true;
        return;
    }
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
            notifyReady = (p === 'granted');
        });
    }
}

function showToast(text, isSL) {
    let box = document.getElementById('hitToast');
    if (!box) {
        box = document.createElement('div');
        box.id = 'hitToast';
        document.body.appendChild(box);
    }
    box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;max-width:320px;color:#fff;padding:12px 14px;border-radius:10px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.35);white-space:pre-line;';
    box.style.background = isSL ? '#ff5252' : '#00c853';
    box.textContent = text;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 7000);
}

function notifyHit(title, body, isSL) {
    showToast(title + '\n' + body, isSL);
    if (notifyReady) {
        try { new Notification(title, { body: body }); } catch (e) {}
    }
}

async function fetchSpotOrFutures(symbol) {
    const urls = [
        'https://api.binance.com/api/v3/ticker/24hr?symbol=' + symbol + 'USDT',
        'https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=' + symbol + 'USDT'
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const d = await res.json();
            const price = parseFloat(d.lastPrice);
            const high = parseFloat(d.highPrice);
            const low = parseFloat(d.lowPrice);
            if (!isNaN(price)) {
                return {
                    price,
                    high: isNaN(high) ? price : high,
                    low: isNaN(low) ? price : low
                };
            }
        } catch (e) {}
    }
    return null;
}

async function getAlphaList() {
    if (alphaListCache) return alphaListCache;
    try {
        const res = await fetch('https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list');
        if (!res.ok) return null;
        const d = await res.json();
        alphaListCache = d.data || [];
        return alphaListCache;
    } catch (e) {
        return null;
    }
}

async function fetchAlpha(symbol) {
    const list = await getAlphaList();
    if (!list || !list.length) return null;
    const item = list.find(t => (t.symbol || '').toUpperCase() === symbol);
    if (!item) return null;
    const price = parseFloat(item.price);
    const high = parseFloat(item.priceHigh24h);
    const low = parseFloat(item.priceLow24h);
    if (isNaN(price)) return null;
    return {
        price,
        high: isNaN(high) ? price : high,
        low: isNaN(low) ? price : low
    };
}

async function fetchDex(symbol) {
    try {
        const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(symbol));
        if (!res.ok) return null;
        const d = await res.json();
        const pairs = (d.pairs || []).filter(p =>
            p.baseToken && p.baseToken.symbol && p.baseToken.symbol.toUpperCase() === symbol
        );
        if (!pairs.length) return null;
        pairs.sort((a, b) => (b.liquidity && b.liquidity.usd ? b.liquidity.usd : 0) - (a.liquidity && a.liquidity.usd ? a.liquidity.usd : 0));
        const p = pairs[0];
        const price = parseFloat(p.priceUsd);
        if (isNaN(price)) return null;
        return { price, high: price, low: price };
    } catch (e) {
        return null;
    }
}

async function fetchPriceData(symbol) {
    let data = await fetchSpotOrFutures(symbol);
    if (data) return data;
    data = await fetchAlpha(symbol);
    if (data) return data;
    data = await fetchDex(symbol);
    if (data) return data;
    return null;
}

function hasSL(c) {
    return c.sl !== undefined && c.sl !== null && c.sl !== '' && !isNaN(Number(c.sl));
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
}

async function updateAllPrices() {
    if (coins.length === 0) return;
    askNotify();
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';

    const unique = [...new Set(coins.map(c => c.coin))];
    await Promise.all(unique.map(async s => {
        priceCache[s] = await fetchPriceData(s);
    }));

    const updates = {};
    const newTPHits = [];
    const newSLHits = [];

    coins.forEach(c => {
        const data = priceCache[c.coin];
        if (!data || data.price === null || data.price === undefined) return;

        const price = data.price;
        const high = data.high != null ? data.high : price;
        const low = data.low != null ? data.low : price;

        let hitTP1 = c.hitTP1 || false;
        let hitTP2 = c.hitTP2 || false;
        let hitTP3 = c.hitTP3 || false;
        let hitSL = c.hitSL || false;

        if (c.side === 'LONG') {
            if (high >= c.tp1 || price >= c.tp1) hitTP1 = true;
            if (high >= c.tp2 || price >= c.tp2) hitTP2 = true;
            if (high >= c.tp3 || price >= c.tp3) hitTP3 = true;
            if (hasSL(c) && (low <= Number(c.sl) || price <= Number(c.sl))) hitSL = true;
        } else {
            if (low <= c.tp1 || price <= c.tp1) hitTP1 = true;
            if (low <= c.tp2 || price <= c.tp2) hitTP2 = true;
            if (low <= c.tp3 || price <= c.tp3) hitTP3 = true;
            if (hasSL(c) && (high >= Number(c.sl) || price >= Number(c.sl))) hitSL = true;
        }

        if (hitTP1 !== c.hitTP1 || hitTP2 !== c.hitTP2 || hitTP3 !== c.hitTP3 || hitSL !== !!c.hitSL) {
            updates[c.id + '/hitTP1'] = hitTP1;
            updates[c.id + '/hitTP2'] = hitTP2;
            updates[c.id + '/hitTP3'] = hitTP3;
            updates[c.id + '/hitSL'] = hitSL;

            const justHit = [];
            if (hitTP1 && !c.hitTP1) justHit.push('TP1');
            if (hitTP2 && !c.hitTP2) justHit.push('TP2');
            if (hitTP3 && !c.hitTP3) justHit.push('TP3');
            if (justHit.length) newTPHits.push(c.coin + ' ' + c.side + ' dính ' + justHit.join(', '));
            if (hitSL && !c.hitSL) newSLHits.push(c.coin + ' ' + c.side + ' dính STOPLOSS');
        }
    });

    if (Object.keys(updates).length > 0) {
        coinsRef.update(updates);
    }

    if (newSLHits.length > 0) {
        notifyHit('Dính Stoploss', newSLHits.join('\n'), true);
    }
    if (newTPHits.length > 0) {
        notifyHit('Đã dính target', newTPHits.join('\n'), false);
    }

    renderList();
    updateStats();
    if (loading) loading.style.display = 'none';
    const last = document.getElementById('lastUpdate');
    if (last) last.textContent = new Date().toLocaleTimeString('vi-VN');
}

function renderList() {
    const list = document.getElementById('coinList');
    if (!list) return;
    let filtered = [...coins];

    if (currentFilter === 'today') {
        const today = new Date().toDateString();
        filtered = coins.filter(c => new Date(c.timestamp).toDateString() === today);
    } else if (currentFilter === 'hit') {
        filtered = coins.filter(c => c.hitTP1 || c.hitTP2 || c.hitTP3 || c.hitSL);
    } else if (currentFilter === 'pending') {
        filtered = coins.filter(c => !c.hitTP1 && !c.hitTP2 && !c.hitTP3 && !c.hitSL);
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty">Chưa có nhận định nào</div>';
        return;
    }

    let html = '';
    filtered.forEach(c => {
        const data = priceCache[c.coin];
        let currentHtml = '';

        if (data === undefined) {
            currentHtml = '<span style="color:#888">Đang tải...</span>';
        } else if (!data || data.price === null || data.price === undefined) {
            currentHtml = '<span style="color:#ff5252">Không tìm thấy</span>';
        } else {
            const isUp = data.price >= c.entry;
            currentHtml = '<span class="current-price ' + (isUp ? 'up' : 'down') + '">$' + data.price.toLocaleString(undefined,{maximumFractionDigits:6}) + '</span>';
        }

        const hasHit = c.hitTP1 || c.hitTP2 || c.hitTP3;
        const slVal = hasSL(c) ? Number(c.sl).toLocaleString(undefined,{maximumFractionDigits:6}) : '--';
        const sideClass = c.side === 'LONG' ? 'side-long' : 'side-short';
        const cardClass = c.hitSL ? 'has-sl' : (hasHit ? 'has-hit' : '');

        html += '<div class="coin-card ' + cardClass + '">';
        html += '<div class="card-header">';
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<div class="coin-name">' + c.coin + '</div>';
        html += '<span class="side-badge ' + sideClass + '">' + c.side + '</span>';
        html += '</div>';
        html += '<div class="time">' + c.time + '</div>';
        html += '</div>';

        html += '<div class="prices-grid">';
        html += '<div class="price-box"><div class="label">Vào lệnh</div><div class="value">$' + Number(c.entry).toLocaleString(undefined,{maximumFractionDigits:6}) + '</div></div>';
        html += '<div class="price-box"><div class="label">Giá hiện tại</div><div class="value">' + currentHtml + '</div></div>';
        html += '<div class="price-box"><div class="label">Stoploss</div><div class="value sl-price">$' + slVal + '</div></div>';
        html += '<div class="price-box"><div class="label">TP1</div><div class="value">$' + Number(c.tp1).toLocaleString(undefined,{maximumFractionDigits:6}) + '</div></div>';
        html += '<div class="price-box"><div class="label">TP2</div><div class="value">$' + Number(c.tp2).toLocaleString(undefined,{maximumFractionDigits:6}) + '</div></div>';
        html += '<div class="price-box"><div class="label">TP3</div><div class="value">$' + Number(c.tp3).toLocaleString(undefined,{maximumFractionDigits:6}) + '</div></div>';
        html += '</div>';

        html += '<div class="tp-status">';
        html += '<div class="tp-badge ' + (c.hitTP1 ? 'hit' : '') + '">TP1 ' + (c.hitTP1 ? '✓' : '○') + '</div>';
        html += '<div class="tp-badge ' + (c.hitTP2 ? 'hit' : '') + '">TP2 ' + (c.hitTP2 ? '✓' : '○') + '</div>';
        html += '<div class="tp-badge ' + (c.hitTP3 ? 'hit' : '') + '">TP3 ' + (c.hitTP3 ? '✓' : '○') + '</div>';
        html += '<div class="tp-badge ' + (c.hitSL ? 'sl-hit' : '') + '">SL ' + (c.hitSL ? '✓' : '○') + '</div>';
        html += '</div>';

        if (c.note && String(c.note).trim() !== '') {
            html += '<div class="note-box"><div class="note-label">Note</div><div class="note-text">' + escapeHtml(c.note) + '</div></div>';
        }

        html += '</div>';
    });

    list.innerHTML = html;
}

function updateStats() {
    const total = document.getElementById('total');
    const tp1 = document.getElementById('tp1Count');
    const tp2 = document.getElementById('tp2Count');
    const tp3 = document.getElementById('tp3Count');
    if (total) total.textContent = coins.length;
    if (tp1) tp1.textContent = coins.filter(c => c.hitTP1).length;
    if (tp2) tp2.textContent = coins.filter(c => c.hitTP2).length;
    if (tp3) tp3.textContent = coins.filter(c => c.hitTP3).length;
}

function filterList(type) {
    currentFilter = type;
    document.querySelectorAll('.filter button').forEach(btn => btn.classList.remove('active'));
    if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
    }
    renderList();
}

askNotify();
setInterval(updateAllPrices, 30000);
updateAllPrices();
