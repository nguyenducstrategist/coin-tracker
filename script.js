<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Top Coin Alpha</title>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
        body{background:linear-gradient(180deg,#0b0a1a 0%,#16143a 50%,#1a1833 100%);color:#fff;min-height:100vh;padding:10px}
        .container{max-width:1280px;margin:0 auto}
        h1{text-align:center;margin-bottom:3px;font-size:1.35rem;background:linear-gradient(90deg,#00d2ff,#3a7bd5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .subtitle{text-align:center;color:#888;margin-bottom:6px;font-size:.76rem;line-height:1.35}
        .x-link{text-align:center;margin-bottom:10px;font-size:.82rem}
        .x-link a{color:#1da1f2;text-decoration:none;font-weight:600}
        .stats{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
        .stat-box{flex:1;min-width:72px;background:rgba(255,255,255,.07);border-radius:8px;padding:8px 6px;text-align:center;border:1px solid rgba(255,255,255,.1)}
        .stat-box .number{font-size:1.15rem;font-weight:bold;color:#00d2ff}
        .stat-box .label{font-size:.66rem;color:#999;margin-top:2px}
        .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px}
        .filter{display:flex;gap:5px;flex-wrap:wrap}
        .filter button{background:rgba(255,255,255,.1);padding:6px 11px;font-size:.74rem;border:none;border-radius:7px;color:#fff;cursor:pointer}
        .filter button.active{background:linear-gradient(90deg,#00d2ff,#3a7bd5)}
        .refresh-btn{background:#00c853;padding:6px 12px;font-size:.74rem;border:none;border-radius:7px;color:#fff;cursor:pointer;font-weight:600}
        .loading{text-align:center;color:#00d2ff;margin:6px 0;font-size:.8rem;display:none}
        .table-wrap{overflow:auto;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);max-height:calc(100vh - 210px)}
        table.coin-table{width:100%;border-collapse:collapse;min-width:780px}
        .coin-table thead th{position:sticky;top:0;z-index:2;background:#1a1740;color:#9ecfff;font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em;padding:8px;text-align:left;border-bottom:1px solid rgba(255,255,255,.12);white-space:nowrap}
        .coin-table tbody tr{border-bottom:1px solid rgba(255,255,255,.06);height:42px}
        .coin-table tbody tr:hover{background:rgba(0,210,255,.07)}
        .coin-table td{padding:6px 8px;font-size:.8rem;vertical-align:middle;white-space:nowrap}
        .coin-table tr.has-hit{background:rgba(0,255,136,.06);box-shadow:inset 3px 0 0 #00ff88}
        .coin-name{font-weight:700;color:#00d2ff;font-size:.88rem}
        .side-badge,.tp-badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:.66rem;font-weight:700}
        .side-long{background:rgba(0,255,136,.18);color:#00ff88}
        .side-short{background:rgba(255,82,82,.18);color:#ff5252}
        .time{font-size:.7rem;color:#888}
        .tp-status{display:flex;gap:4px}
        .tp-badge{background:rgba(255,255,255,.08);color:#aaa}
        .tp-badge.hit{background:rgba(0,255,136,.22);color:#00ff88}
        .current-price{font-weight:700}
        .current-price.up{color:#00ff88}
        .current-price.down{color:#ff5252}
        .empty{text-align:center;padding:36px 12px;color:#666}
        @media (max-width:600px){
            h1{font-size:1.12rem}
            .stat-box .number{font-size:1rem}
            .table-wrap{max-height:calc(100vh - 250px)}
            table.coin-table{min-width:720px}
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📈 Top Coin Alpha tăng trưởng đột biến</h1>
        <p class="subtitle">Cập nhật theo thời gian thực từng ngày • TP1 • TP2 • TP3 • Tự động lấy giá Binance • Minh bạch công khai</p>
        <div class="x-link">Theo dõi nhận định trên X: <a href="https://x.com/ducstrategist11" target="_blank">@ducstrategist11</a></div>

        <div class="stats">
            <div class="stat-box"><div class="number" id="total">0</div><div class="label">Tổng lệnh</div></div>
            <div class="stat-box"><div class="number" id="tp1Count">0</div><div class="label">Đạt TP1</div></div>
            <div class="stat-box"><div class="number" id="tp2Count">0</div><div class="label">Đạt TP2</div></div>
            <div class="stat-box"><div class="number" id="tp3Count">0</div><div class="label">Đạt TP3</div></div>
            <div class="stat-box"><div class="number" id="lastUpdate" style="font-size:.82rem">--:--</div><div class="label">Cập nhật</div></div>
        </div>

        <div class="toolbar">
            <div class="filter">
                <button class="active" onclick="filterList('all')">Tất cả</button>
                <button onclick="filterList('today')">Hôm nay</button>
                <button onclick="filterList('hit')">Đã đạt TP</button>
                <button onclick="filterList('pending')">Chưa đạt</button>
            </div>
            <button class="refresh-btn" onclick="updateAllPrices()">🔄 Cập nhật giá</button>
        </div>

        <div id="loading" class="loading">Đang lấy giá từ Binance...</div>
        <div class="table-wrap">
            <table class="coin-table">
                <thead>
                    <tr>
                        <th>Coin</th>
                        <th>Hướng</th>
                        <th>Thời gian</th>
                        <th>Vào lệnh</th>
                        <th>Hiện tại</th>
                        <th>TP1</th>
                        <th>TP2</th>
                        <th>TP3</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody id="coinList"></tbody>
            </table>
        </div>
    </div>

    <script>
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
            coins = Object.keys(data).map(key => ({id:key,...data[key]})).sort((a,b)=>b.timestamp-a.timestamp);
            renderList();
            updateStats();
        });

        function askNotify(){
            if(!('Notification' in window)) return;
            if(Notification.permission==='granted'){notifyReady=true;return;}
            if(Notification.permission!=='denied'){
                Notification.requestPermission().then(p=>{notifyReady=(p==='granted');});
            }
        }
        function showToast(text,isSL){
            let box=document.getElementById('hitToast');
            if(!box){box=document.createElement('div');box.id='hitToast';document.body.appendChild(box);}
            box.style.cssText='position:fixed;top:16px;right:16px;z-index:9999;max-width:320px;color:#fff;padding:12px 14px;border-radius:10px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.35);white-space:pre-line;';
            box.style.background=isSL?'#ff5252':'#00c853';
            box.textContent=text;box.style.display='block';
            setTimeout(()=>{box.style.display='none';},7000);
        }
        function notifyHit(title,body,isSL){
            showToast(title+'\n'+body,isSL);
            if(notifyReady){try{new Notification(title,{body:body});}catch(e){}}
        }
        async function fetchSpotOrFutures(symbol){
            const urls=[
                'https://api.binance.com/api/v3/ticker/24hr?symbol='+symbol+'USDT',
                'https://fapi.binance.com/fapi/v1/ticker/24hr?symbol='+symbol+'USDT'
            ];
            for(const url of urls){
                try{
                    const res=await fetch(url);
                    if(!res.ok) continue;
                    const d=await res.json();
                    const price=parseFloat(d.lastPrice);
                    const high=parseFloat(d.highPrice);
                    const low=parseFloat(d.lowPrice);
                    if(!isNaN(price)) return {price, high:isNaN(high)?price:high, low:isNaN(low)?price:low};
                }catch(e){}
            }
            return null;
        }
        async function getAlphaList(){
            if(alphaListCache) return alphaListCache;
            try{
                const res=await fetch('https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list');
                if(!res.ok) return null;
                const d=await res.json();
                alphaListCache=d.data||[];
                return alphaListCache;
            }catch(e){return null;}
        }
        async function fetchAlpha(symbol){
            const list=await getAlphaList();
            if(!list||!list.length) return null;
            const item=list.find(t=>(t.symbol||'').toUpperCase()===symbol);
            if(!item) return null;
            const price=parseFloat(item.price);
            const high=parseFloat(item.priceHigh24h);
            const low=parseFloat(item.priceLow24h);
            if(isNaN(price)) return null;
            return {price, high:isNaN(high)?price:high, low:isNaN(low)?price:low};
        }
        async function fetchDex(symbol){
            try{
                const res=await fetch('https://api.dexscreener.com/latest/dex/search?q='+encodeURIComponent(symbol));
                if(!res.ok) return null;
                const d=await res.json();
                const pairs=(d.pairs||[]).filter(p=>p.baseToken&&p.baseToken.symbol&&p.baseToken.symbol.toUpperCase()===symbol);
                if(!pairs.length) return null;
                pairs.sort((a,b)=>(b.liquidity&&b.liquidity.usd?b.liquidity.usd:0)-(a.liquidity&&a.liquidity.usd?a.liquidity.usd:0));
                const price=parseFloat(pairs[0].priceUsd);
                if(isNaN(price)) return null;
                return {price,high:price,low:price};
            }catch(e){return null;}
        }
        async function fetchPriceData(symbol){
            return await fetchSpotOrFutures(symbol) || await fetchAlpha(symbol) || await fetchDex(symbol);
        }
        function hasSL(c){return c.sl!==undefined&&c.sl!==null&&c.sl!==''&&!isNaN(Number(c.sl));}
        function fmt(n){return Number(n).toLocaleString(undefined,{maximumFractionDigits:6});}

        async function updateAllPrices(){
            if(coins.length===0) return;
            askNotify();
            const loading=document.getElementById('loading');
            if(loading) loading.style.display='block';
            const unique=[...new Set(coins.map(c=>c.coin))];
            await Promise.all(unique.map(async s=>{priceCache[s]=await fetchPriceData(s);}));
            const updates={}; const newTPHits=[]; const newSLHits=[];
            coins.forEach(c=>{
                const data=priceCache[c.coin];
                if(!data||data.price==null) return;
                const price=data.price, high=data.high!=null?data.high:price, low=data.low!=null?data.low:price;
                let hitTP1=c.hitTP1||false, hitTP2=c.hitTP2||false, hitTP3=c.hitTP3||false, hitSL=c.hitSL||false;
                if(c.side==='LONG'){
                    if(high>=c.tp1||price>=c.tp1) hitTP1=true;
                    if(high>=c.tp2||price>=c.tp2) hitTP2=true;
                    if(high>=c.tp3||price>=c.tp3) hitTP3=true;
                    if(hasSL(c)&&(low<=Number(c.sl)||price<=Number(c.sl))) hitSL=true;
                }else{
                    if(low<=c.tp1||price<=c.tp1) hitTP1=true;
                    if(low<=c.tp2||price<=c.tp2) hitTP2=true;
                    if(low<=c.tp3||price<=c.tp3) hitTP3=true;
                    if(hasSL(c)&&(high>=Number(c.sl)||price>=Number(c.sl))) hitSL=true;
                }
                if(hitTP1!==c.hitTP1||hitTP2!==c.hitTP2||hitTP3!==c.hitTP3||hitSL!==!!c.hitSL){
                    updates[c.id+'/hitTP1']=hitTP1;
                    updates[c.id+'/hitTP2']=hitTP2;
                    updates[c.id+'/hitTP3']=hitTP3;
                    updates[c.id+'/hitSL']=hitSL;
                    const just=[];
                    if(hitTP1&&!c.hitTP1) just.push('TP1');
                    if(hitTP2&&!c.hitTP2) just.push('TP2');
                    if(hitTP3&&!c.hitTP3) just.push('TP3');
                    if(just.length) newTPHits.push(c.coin+' '+c.side+' dính '+just.join(', '));
                    if(hitSL&&!c.hitSL) newSLHits.push(c.coin+' '+c.side+' dính STOPLOSS');
                }
            });
            if(Object.keys(updates).length) coinsRef.update(updates);
            if(newSLHits.length) notifyHit('Dính Stoploss', newSLHits.join('\n'), true);
            if(newTPHits.length) notifyHit('Đã dính target', newTPHits.join('\n'), false);
            renderList(); updateStats();
            if(loading) loading.style.display='none';
            const last=document.getElementById('lastUpdate');
            if(last) last.textContent=new Date().toLocaleTimeString('vi-VN');
        }

        function renderList(){
            const list=document.getElementById('coinList');
            if(!list) return;
            let filtered=[...coins];
            if(currentFilter==='today'){
                const today=new Date().toDateString();
                filtered=coins.filter(c=>new Date(c.timestamp).toDateString()===today);
            }else if(currentFilter==='hit'){
                filtered=coins.filter(c=>c.hitTP1||c.hitTP2||c.hitTP3);
            }else if(currentFilter==='pending'){
                filtered=coins.filter(c=>!c.hitTP1&&!c.hitTP2&&!c.hitTP3);
            }
            if(!filtered.length){list.innerHTML='<tr><td colspan="9" class="empty">Chưa có nhận định nào</td></tr>';return;}
            let html='';
            filtered.forEach(c=>{
                const data=priceCache[c.coin];
                let currentHtml='';
                if(data===undefined) currentHtml='<span style="color:#888">Đang tải...</span>';
                else if(!data||data.price==null) currentHtml='<span style="color:#ff5252">Không tìm thấy</span>';
                else{
                    const isUp=data.price>=c.entry;
                    currentHtml='<span class="current-price '+(isUp?'up':'down')+'">$'+fmt(data.price)+'</span>';
                }
                const hasHit=c.hitTP1||c.hitTP2||c.hitTP3;
                const sideClass=c.side==='LONG'?'side-long':'side-short';
                html+='<tr class="'+(hasHit?'has-hit':'')+'">';
                html+='<td class="coin-name">'+c.coin+'</td>';
                html+='<td><span class="side-badge '+sideClass+'">'+c.side+'</span></td>';
                html+='<td class="time">'+(c.time||'')+'</td>';
                html+='<td>$'+fmt(c.entry)+'</td>';
                html+='<td>'+currentHtml+'</td>';
                html+='<td>$'+fmt(c.tp1)+'</td>';
                html+='<td>$'+fmt(c.tp2)+'</td>';
                html+='<td>$'+fmt(c.tp3)+'</td>';
                html+='<td><div class="tp-status">';
                html+='<span class="tp-badge '+(c.hitTP1?'hit':'')+'">TP1 '+(c.hitTP1?'✓':'○')+'</span>';
                html+='<span class="tp-badge '+(c.hitTP2?'hit':'')+'">TP2 '+(c.hitTP2?'✓':'○')+'</span>';
                html+='<span class="tp-badge '+(c.hitTP3?'hit':'')+'">TP3 '+(c.hitTP3?'✓':'○')+'</span>';
                html+='</div></td></tr>';
            });
            list.innerHTML=html;
        }
        function updateStats(){
            document.getElementById('total').textContent=coins.length;
            document.getElementById('tp1Count').textContent=coins.filter(c=>c.hitTP1).length;
            document.getElementById('tp2Count').textContent=coins.filter(c=>c.hitTP2).length;
            document.getElementById('tp3Count').textContent=coins.filter(c=>c.hitTP3).length;
        }
        function filterList(type){
            currentFilter=type;
            document.querySelectorAll('.filter button').forEach(btn=>btn.classList.remove('active'));
            if(event&&event.target) event.target.classList.add('active');
            renderList();
        }
        askNotify();
        setInterval(updateAllPrices,30000);
        updateAllPrices();
    </script>
</body>
</html>
