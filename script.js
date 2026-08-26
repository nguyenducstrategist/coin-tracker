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

async function fetchPrice(symbol) {
    try {
        let res = await fetch('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=' + symbol + '-USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.data && data.data.price) return parseFloat(data.data.price);
        }
    } catch (e) {}

    try {
        let res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + symbol + 'USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.price) return parseFloat(data.price);
        }
    } catch (e) {}

    try {
        let res = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + symbol + 'USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.price) return parseFloat(data.price);
        }
    } catch (e) {}

    return null;
}

async function updateAllPrices() {
    if (coins.length === 0) return;
    document.getElementById('loading').style.display = 'block';

    let unique = [...new Set(coins.map(c => c.coin))];
    for (let s of unique) {
        priceCache[s] = await fetchPrice(s);
    }

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
    let list = document.getElementById('
