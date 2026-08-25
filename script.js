// Firebase Config của bạn
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

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const coinsRef = db.ref('coins');

let coins = [];
let currentFilter = 'all';
let priceCache = {};

// Lắng nghe realtime
coinsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    coins = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })).sort((a, b) => b.timestamp - a.timestamp);

    renderList();
    updateStats();
});

// Thêm nhận định
function addCoin() {
    const coin = document.getElementById('coin').value.trim().toUpperCase();
    const entry = parseFloat(document.getElementById('entry').value);
    const tp1 = parseFloat(document.getElementById('tp1').value);
    const tp2 = parseFloat(document.getElementById('tp2').value);
    const tp3 = parseFloat(document.getElementById('tp3').value);
    const side = document.getElementById('side').value;

    if (!coin || isNaN(entry) || isNaN(tp1) || isNaN(tp2) || isNaN(tp3)) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    const newCoin = {
        coin,
        entry,
        tp1, tp2, tp3,
        side,
        time: new Date().toLocaleString('vi-VN'),
        timestamp: Date.now(),
        hitTP1: false,
        hitTP2: false,
        hitTP3: false
    };

    coinsRef.push(newCoin);

    // Reset form
    ['coin','entry','tp1','tp2','tp3'].forEach(id => document.getElementById(id).value = '');
}

// Xóa
function deleteCoin(id) {
    if (confirm('Xóa nhận định này?')) {
        coinsRef.child(id).remove();
    }
}

// Lấy giá Binance
async function fetchPrice(symbol) {
    try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
        if (!res.ok) throw new Error('Không tìm thấy');
        const data = await res.json();
        return parseFloat(data.price);
    } catch (e) {
        console.error(symbol, e);
        return null;
    }
}

// Cập nhật giá + kiểm tra TP
async function updateAllPrices() {
    if (coins.length === 0) return;
    document.getElementById('loading').style.display = 'block';

    const unique = [...new Set(coins.map(c => c.coin))];
    await Promise.all(unique.map(async s => {
        const p = await fetchPrice(s);
        if (p !== null) priceCache[s] = p;
    }));

    const updates = {};
    coins.forEach(c => {
        const price = priceCache[c.coin];
        if (price === undefined) return;

        let hitTP1 = c.hitTP1;
        let hitTP2 = c.hitTP2;
        let hitTP3 = c.hitTP3;

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
            updates[`${c.id}/hitTP1`] = hitTP1;
            updates[`${c.id}/hitTP2`] = hitTP2;
            updates[`${c.id}/hitTP3`] = hitTP3;
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
    const list = document.getElementById('coinList');
    let filtered = [...coins];

    if (currentFilter === 'today') {
        const today = new Date().toDateString();
        filtered = coins.filter(c => new Date(c.timestamp).toDateString() === today);
    } else if (currentFilter === 'hit') {
        filtered = coins.filter(c => c.hitTP1 || c.hitTP2 || c.hitTP3);
    } else if (currentFilter === 'pending') {
        filtered = coins.filter(c => !c.hitTP1 && !