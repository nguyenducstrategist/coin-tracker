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

coinsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    coins = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })).sort((a, b) => b.timestamp - a.timestamp);
    renderList();
    updateStats();
});

async function fetchWithProxy(url) {
    try {
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        const res = await fetch(proxyUrl);
        if (res.ok) return await res.json();
    } catch (e) {}
    return null;
}

async function fetchPrice(symbol) {
    // 1. Binance Spot
    let data = await fetchWithProxy('https://api.binance.com/api/v3/ticker/price?symbol=' + symbol + 'USDT');
    if (data && data.price) return parseFloat(data.price);

    // 2. Binance Futures
    data = await fetchWithProxy('https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + symbol + 'USDT');
    if (data && data.price) return parseFloat(data.price);

    // 3. KuCoin
    data = await fetchWithProxy('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=' + symbol + '-USDT');
    if (data && data.data && data.data.price) return parseFloat(data.data.price);

    // 4. Bitget
    data = await fetchWithProxy('https://api.bitget.com/api/v2/spot/market/tickers?symbol=' + symbol + 'USDT');
    if (data && data.data && data.data[0] && data.data[0].lastPr) return parseFloat(data.data[0].lastPr);

    // 5. MEXC
    data = await fetchWithProxy('https://api.mexc.com/api/v3/ticker/price?symbol=' + symbol + 'USDT');
    if (data && data.price) return parseFloat(data.price);

    // 6. CoinGecko
    let id = symbol.toLowerCase();
    if (symbol === 'TMX') id = 'termmax';
    data = await fetchWithProxy('https://api.coingecko.com/api/v3/simple/price?ids=' + id + '&vs_currencies=usd');
    if (data && data[id] && data[id].usd) return parseFloat(data[id].usd);

    return null;
}

async function updateAllPrices() {
    if (coins.length === 0) return;
    document.getElementById('loading').style.display = 'block';

    let unique = [...new Set(coins.map(c => c.coin))];
    await Promise.all(unique.map(async s => {
        priceCache[s] = await fetchPrice(s);
    }));

    let updates = {};
    coins.forEach(c => {
        let price = priceCache[c.coin];
        if (price === null || price === undefined) return;

        let hitTP1 = c.hitTP1 || false;
        let hitTP2 = c.hitTP2 || false;
        let hitTP3 = c.hitTP3 || false;

        if (c.side === 'LONG') {
            if (price >= c.tp1) hitTP1 = true;
            if (price >= c.tp2) hitTP2 = true;
            if (price >= c.tp3) hitTP3 = true;
        } else {
            if (price <= c.tp1) hitTP1 = true;
            if (price <= c.tp2) hitTP2 = true;
            if (price <= c.tp3) hitTP3 = true;
        }

        if (hitTP1 !== c.hitTP1 || hitTP2 !== c.hitTP2 || hitTP3 !== c.hitTP3) {
            updates[c.id + '/hitTP1'] = hitTP1;
            updates[c.id + '/hitTP2'] = hitTP2;
            updates[c.id + '/hitTP3'] = hitTP3;
        }
    });

    if (Object.keys(updates).length > 0) {
        coinsRef.update(updates);
    }

    renderList();
    updateStats();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('vi-VN');
}

function renderList() {
    let list = document.getElementById('coinList');
    let filtered = [...coins];

    if (currentFilter === 'today') {
        let today = new Date().toDateString();
        filtered = coins.filter(c => new Date(c.timestamp).toDateString() === today);
    } else if (currentFilter === 'hit') {
        filtered = coins.filter(c => c.hitTP1 || c.hitTP2 || c.hitTP3);
    } else if (currentFilter === 'pending') {
        filtered = coins.filter(c => !c.hitTP1 && !c.hitTP2 && !c.hitTP3);
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty">Chưa có nhận định nào</div>';
        return;
    }

    let html = '';
    filtered.forEach(c => {
        let current = priceCache[c.coin];
        let currentHtml = '';

        if (current === undefined) {
            currentHtml = '<span style="color:#888">...</span>';
        } else if (current === null) {
            currentHtml = '<span style="color:#ff5252">N/A</span>';
        } else {
            let isUp = current >= c.entry;
            currentHtml = '<span class="current-price ' + (isUp ? 'up' : 'down') + '">$' + current.toLocaleString(undefined,{maximumFractionDigits:6}) + '</span>';
        }

        let hasHit = c.hitTP1 || c.hitTP2 || c.hitTP3;
        let sideClass = c.side === 'LONG' ? 'side-long' : 'side-short';

        html += '<div class="coin-card ' + (hasHit ? 'has-hit' : '') + '">';
        html += '<span class="coin-name">' + c.coin + '</span>';
        html += '<span class="side-badge ' + sideClass + '">' + c.side + '</span>';
        html += '<div class="price"><span>Entry </span>$' + c.entry.toLocaleString() + '</div>';
        html += '<div class="price"><span>Now </span>' + currentHtml + '</div>';
        html += '<div class="price"><span>TP1 </span>$' + c.tp1.toLocaleString() + '</div>';
        html += '<div class="price"><span>TP2 </span>$' + c.tp2.toLocaleString() + '</div>';
        html += '<div class="price"><span>TP3 </span>$' + c.tp3.toLocaleString() + '</div>';
        html += '<div class="tp-status">';
        html += '<div class="tp-badge ' + (c.hitTP1 ? 'hit' : '') + '">TP1 ' + (c.hitTP1 ? '✓' : '○') + '</div>';
        html += '<div class="tp-badge ' + (c.hitTP2 ? 'hit' : '') + '">TP2 ' + (c.hitTP2 ? '✓' : '○') + '</div>';
        html += '<div class="tp-badge ' + (c.hitTP3 ? 'hit' : '') + '">TP3 ' + (c.hitTP3 ? '✓' : '○') + '</div>';
        html += '</div>';
        html += '<div class="time">' + c.time + '</div>';
        html += '</div>';
    });

    list.innerHTML = html;
}

function updateStats() {
    document.getElementById('total').textContent = coins.length;
    document.getElementById('tp1Count').textContent = coins.filter(c => c.hitTP1).length;
    document.getElementById('tp2Count').textContent = coins.filter(c => c.hitTP2).length;
    document.getElementById('tp3Count').textContent = coins.filter(c => c.hitTP3).length;
}

function filterList(type) {
    currentFilter = type;
    document.querySelectorAll('.filter button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderList();
}

setInterval(updateAllPrices, 30000);
updateAllPrices();
