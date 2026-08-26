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
    // 1. Binance Spot
    try {
        let res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + symbol + 'USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.price) return parseFloat(data.price);
        }
    } catch (e) {}

    // 2. Binance Futures
    try {
        let res = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + symbol + 'USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.price) return parseFloat(data.price);
        }
    } catch (e) {}

    // 3. Bitget (có nhiều coin Alpha)
    try {
        let res = await fetch('https://api.bitget.com/api/v2/spot/market/tickers?symbol=' + symbol + 'USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.data && data.data[0] && data.data[0].lastPr) {
                return parseFloat(data.data[0].lastPr);
            }
        }
    } catch (e) {}

    // 4. MEXC (có nhiều coin Alpha)
    try {
        let res = await fetch('https://api.mexc.com/api/v3/ticker/price?symbol=' + symbol + 'USDT');
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
            updates[c.id + '/hitTP2
