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
let coins = [], currentFilter = 'all', priceCache = {};

coinsRef.on('value', snapshot => {
    const data = snapshot.val() || {};
    coins = Object.keys(data).map(key => ({id:key, ...data[key]})).sort((a,b)=>b.timestamp-a.timestamp);
    renderList();
    updateStats();
});

async function fetchPrice(symbol){
    try{
        let res=await fetch('https://api.binance.com/api/v3/ticker/price?symbol='+symbol+'USDT');
        if(res.ok) return parseFloat((await res.json()).price);
    }catch(e){}
    try{
        let res=await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol='+symbol+'USDT');
        if(res.ok) return parseFloat((await res.json()).price);
    }catch(e){}
    try{
        let res=await fetch('https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list');
        if(res.ok){
            const list=(await res.json()).data||[];
            const item=list.find(t=>(t.symbol||'').toUpperCase()===symbol);
            if(item) return parseFloat(item.price);
        }
    }catch(e){}
    return null;
}

async function updateAllPrices(){
    if(!coins.length) return;
    const loading=document.getElementById('loading');
    if(loading) loading.style.display='block';
    const unique=[...new Set(coins.map(c=>c.coin))];
    await Promise.all(unique.map(async s=>{ priceCache[s]=await fetchPrice(s); }));
    const updates={};
    coins.forEach(c=>{
        const price=priceCache[c.coin];
        if(price==null) return;
        if(c.side==='LONG'){
            if(!c.hitTP1 && price>=c.tp1) updates[c.id+'/hitTP1']=true;
            if(!c.hitTP2 && price>=c.tp2) updates[c.id+'/hitTP2']=true;
            if(!c.hitTP3 && price>=c.tp3) updates[c.id+'/hitTP3']=true;
        }else{
            if(!c.hitTP1 && price<=c.tp1) updates[c.id+'/hitTP1']=true;
            if(!c.hitTP2 && price<=c.tp2) updates[c.id+'/hitTP2']=true;
            if(!c.hitTP3 && price<=c.tp3) updates[c.id+'/hitTP3']=true;
        }
    });
    if(Object.keys(updates).length) coinsRef.update(updates);
    renderList(); updateStats();
    if(loading) loading.style.display='none';
    const last=document.getElementById('lastUpdate');
    if(last) last.textContent=new Date().toLocaleTimeString('vi-VN');
}

function renderList(){
    const list=document.getElementById('coinList'); if(!list) return;
    let filtered=[...coins];
    if(currentFilter==='today'){ const today=new Date().toDateString(); filtered=coins.filter(c=>new Date(c.timestamp).toDateString()===today); }
    else if(currentFilter==='hit') filtered=coins.filter(c=>c.hitTP1||c.hitTP2||c.hitTP3);
    else if(currentFilter==='pending') filtered=coins.filter(c=>!c.hitTP1&&!c.hitTP2&&!c.hitTP3);
    if(!filtered.length){ list.innerHTML='<div class="empty">Chưa có nhận định nào</div>'; return; }
    let html='';
    filtered.forEach(c=>{
        const current=priceCache[c.coin];
        let currentHtml='';
        if(current===undefined) currentHtml='<span style="color:#888">Đang tải...</span>';
        else if(current==null) currentHtml='<span style="color:#ff5252">Không tìm thấy</span>';
        else currentHtml='<span class="current-price '+(current>=c.entry?'up':'down')+'">$'+current.toLocaleString(undefined,{maximumFractionDigits:6})+'</span>';
        const hasHit=c.hitTP1||c.hitTP2||c.hitTP3;
        const sideClass=c.side==='LONG'?'side-long':'side-short';
        html+='<div class="coin-card '+(hasHit?'has-hit':'')+'"><div class="card-header"><div style="display:flex;align-items:center;gap:10px;">';
        html+='<div class="coin-name">'+c.coin+'</div><span class="side-badge '+sideClass+'">'+c.side+'</span></div>';
        html+='<div class="time">'+c.time+'</div></div><div class="prices-grid">';
        html+='<div class="price-box"><div class="label">Vào lệnh</div><div class="value">$'+Number(c.entry).toLocaleString(undefined,{maximumFractionDigits:6})+'</div></div>';
        html+='<div class="price-box"><div class="label">Giá hiện tại</div><div class="value">'+currentHtml+'</div></div>';
        html+='<div class="price-box"><div class="label">TP1</div><div class="value">$'+Number(c.tp1).toLocaleString(undefined,{maximumFractionDigits:6})+'</div></div>';
        html+='<div class="price-box"><div class="label">TP2</div><div class="value">$'+Number(c.tp2).toLocaleString(undefined,{maximumFractionDigits:6})+'</div></div>';
        html+='<div class="price-box"><div class="label">TP3</div><div class="value">$'+Number(c.tp3).toLocaleString(undefined,{maximumFractionDigits:6})+'</div></div></div><div class="tp-status">';
        html+='<div class="tp-badge '+(c.hitTP1?'hit':'')+'">TP1 '+(c.hitTP1?'✓':'○')+'</div>';
        html+='<div class="tp-badge '+(c.hitTP2?'hit':'')+'">TP2 '+(c.hitTP2?'✓':'○')+'</div>';
        html+='<div class="tp-badge '+(c.hitTP3?'hit':'')+'">TP3 '+(c.hitTP3?'✓':'○')+'</div></div></div>';
    });
    list.innerHTML=html;
}
function updateStats(){
    const t=document.getElementById('total'), a=document.getElementById('tp1Count'), b=document.getElementById('tp2Count'), c=document.getElementById('tp3Count');
    if(t) t.textContent=coins.length;
    if(a) a.textContent=coins.filter(x=>x.hitTP1).length;
    if(b) b.textContent=coins.filter(x=>x.hitTP2).length;
    if(c) c.textContent=coins.filter(x=>x.hitTP3).length;
}
function filterList(type){
    currentFilter=type;
    document.querySelectorAll('.filter button').forEach(btn=>btn.classList.remove('active'));
    if(typeof event!=='undefined' && event && event.target) event.target.classList.add('active');
    renderList();
}
setInterval(updateAllPrices,30000);
updateAllPrices();
