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

    // 3. KuCoin (hoạt động tốt với TMX)
    try {
        let res = await fetch('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=' + symbol + '-USDT');
        if (res.ok) {
            let data = await res.json();
            if (data.data && data.data.price) {
                return parseFloat(data.data.price);
            }
        }
    } catch (e) {}

    // 4. Bitget (qua proxy)
    try {
        let url = 'https://api.bitget.com/api/v2/spot/market/tickers?symbol=' + symbol + 'USDT';
        let res = await fetch('https://corsproxy.io/?' + encodeURIComponent(url));
        if (res.ok) {
            let data = await res.json();
            if (data.data && data.data[0] && data.data[0].lastPr) {
                return parseFloat(data.data[0].lastPr);
            }
        }
    } catch (e) {}

    // 5. MEXC (qua proxy)
    try {
        let url = 'https://api.mexc.com/api/v3/ticker/price?symbol=' + symbol + 'USDT';
        let
