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
        // Proxy mới
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        const res = await fetch(proxyUrl);
        if (res.ok) return await res.json();
    } catch (e) {}
    return null;
}

async function fetchPrice(symbol) {
    // KuCoin (thường ổn nhất với Alpha)
    let data = await fetchWithProxy('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=' + symbol + '-USDT');
    if (data && data.data && data.data.price) return parseFloat(data.data.price);

    // Binance Spot
    data = await fetchWithProxy('https://api.binance.com/api/v3/ticker/price?symbol=' + symbol + 'USDT');
    if (data && data.price) return parseFloat(data.price);

    // Binance Futures
    data = await fetchWithProxy('https://fapi.binance
