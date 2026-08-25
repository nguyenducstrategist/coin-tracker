* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
body {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #fff;
    min-height: 100vh;
    padding: 20px;
}
.container { max-width: 1200px; margin: 0 auto; }
h1 {
    text-align: center;
    margin-bottom: 8px;
    font-size: 2rem;
    background: linear-gradient(90deg, #00d2ff, #3a7bd5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.subtitle { text-align: center; color: #aaa; margin-bottom: 25px; font-size: 0.95rem; }

.form-card {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 22px;
    margin-bottom: 25px;
    border: 1px solid rgba(255,255,255,0.1);
}
.form-row {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr 1fr auto;
    gap: 11px;
    align-items: end;
}
@media (max-width: 1000px) {
    .form-row { grid-template-columns: 1fr 1fr; }
}
label { display: block; margin-bottom: 5px; font-size: 0.82rem; color: #bbb; }
input, select {
    width: 100%;
    padding: 11px 12px;
    border: none;
    border-radius: 10px;
    background: rgba(0,0,0,0.35);
    color: #fff;
    font-size: 0.95rem;
    outline: none;
}
input:focus, select:focus { box-shadow: 0 0 0 2px #00d2ff; }
button {
    padding: 11px 18px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(90deg, #00d2ff, #3a7bd5);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: 0.25s;
    white-space: nowrap;
}
button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 18px rgba(0,210,255,0.4);
}

.stats {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}
.stat-box {
    flex: 1;
    min-width: 120px;
    background: rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 14px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
}
.stat-box .number { font-size: 1.6rem; font-weight: bold; color: #00d2ff; }
.stat-box .label { font-size: 0.78rem; color: #aaa; margin-top: 3px; }

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
    gap: 10px;
}
.filter { display: flex; gap: 8px; flex-wrap: wrap; }
.filter button {
    background: rgba(255,255,255,0.1);
    padding: 7px 14px;
    font-size: 0.85rem;
}
.filter button.active { background: linear-gradient(90deg, #00d2ff, #3a7bd5); }
.refresh-btn { background: #00c853 !important; }

.coin-list { display: flex; flex-direction: column; gap: 14px; }
.coin-card {
    background: rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 16px 18px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: 0.3s;
}
.coin-card.has-hit {
    border-color: #00ff88;
    background: rgba(0,255,136,0.08);
    box-shadow: 0 0 12px rgba(0,255,136,0.12);
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 10px;
}
.coin-name { font-size: 1.35rem; font-weight: 700; color: #00d2ff; }
.side-badge {
    padding: 4px 10px;
    border-radius: 20
