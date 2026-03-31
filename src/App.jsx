import { useState, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
// CONFIG — cambia esta URL por la de tu Railway
// ══════════════════════════════════════════════════════════════
const API = import.meta?.env?.VITE_API_URL || "https://tu-app.railway.app";

// ══════════════════════════════════════════════════════════════
// API CALLS
// ══════════════════════════════════════════════════════════════
const api = {
  get:  (path)       => fetch(`${API}${path}`).then(r => r.json()).catch(() => null),
  post: (path, body) => fetch(`${API}${path}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(body)
  }).then(r => r.json()).catch(() => null),
};

// ══════════════════════════════════════════════════════════════
// MOCK DATA (cuando el backend no está conectado)
// ══════════════════════════════════════════════════════════════
const MOCK_FIXTURES = [
  {fixture_id:1001,time:"16:15",league:"La Liga",  home:"Real Madrid",    away:"Barcelona",     status:"NS"},
  {fixture_id:1002,time:"18:30",league:"La Liga",  home:"Atlético Madrid",away:"Sevilla",        status:"NS"},
  {fixture_id:1003,time:"20:00",league:"Premier",  home:"Man City",       away:"Arsenal",        status:"NS"},
  {fixture_id:1004,time:"20:00",league:"Premier",  home:"Liverpool",      away:"Chelsea",        status:"NS"},
  {fixture_id:1005,time:"21:00",league:"Bundesliga",home:"Bayern Munich", away:"Dortmund",       status:"NS"},
  {fixture_id:1006,time:"21:00",league:"La Liga",  home:"Villarreal",     away:"Athletic Bilbao",status:"NS"},
];

const MOCK_STATS = {
  bankroll:1148.50, initial:1000, pl:148.50, total_stake:820, bets:18,
  won:11, lost:7, pending:2, in_flight:44, roi:18.1, winrate:61.1,
  max_drawdown:8.2, win_streak:5, loss_streak:3,
  bankroll_series:[
    {date:"Inicio",val:1000},{date:"2025-03-10",val:1028},{date:"2025-03-12",val:1009},
    {date:"2025-03-14",val:1055},{date:"2025-03-16",val:1038},{date:"2025-03-18",val:1092},
    {date:"2025-03-20",val:1080},{date:"2025-03-22",val:1130},{date:"2025-03-25",val:1148},
  ],
  by_market:[
    {market:"goals",    bets:8, won:5, pl:62.4,  roi:22.3},
    {market:"btts",     bets:3, won:2, pl:28.1,  roi:19.8},
    {market:"result",   bets:4, won:2, pl:18.5,  roi:12.1},
    {market:"corners",  bets:2, won:1, pl:8.2,   roi:9.4},
    {market:"cards",    bets:1, won:1, pl:18.3,  roi:31.0},
    {market:"over05",   bets:0, won:0, pl:0,     roi:0},
    {market:"ht",       bets:0, won:0, pl:0,     roi:0},
  ],
};

const MOCK_BETS = [
  {id:1,date_match:"2025-03-10",home_team:"Real Madrid",  away_team:"Barcelona",      market:"goals",  selection:"over", odds:1.85,stake:28,prob_model:0.68,ev:0.058,status:"won",  profit_loss:51.80,league:"La Liga"},
  {id:2,date_match:"2025-03-11",home_team:"Man City",     away_team:"Arsenal",        market:"goals",  selection:"over", odds:1.78,stake:32,prob_model:0.72,ev:0.082,status:"won",  profit_loss:24.96,league:"Premier"},
  {id:3,date_match:"2025-03-12",home_team:"Atlético",     away_team:"Sevilla",        market:"btts",   selection:"yes",  odds:1.90,stake:20,prob_model:0.61,ev:0.059,status:"lost", profit_loss:-20.00,league:"La Liga"},
  {id:4,date_match:"2025-03-13",home_team:"Valencia",     away_team:"Betis",          market:"result", selection:"draw", odds:3.50,stake:14,prob_model:0.33,ev:0.155,status:"won",  profit_loss:35.00,league:"La Liga"},
  {id:5,date_match:"2025-03-14",home_team:"Chelsea",      away_team:"Liverpool",      market:"cards",  selection:"over", odds:1.90,stake:22,prob_model:0.63,ev:0.097,status:"lost", profit_loss:-22.00,league:"Premier"},
  {id:6,date_match:"2025-03-15",home_team:"Bayern Munich",away_team:"Dortmund",       market:"goals",  selection:"over", odds:1.75,stake:35,prob_model:0.74,ev:0.045,status:"won",  profit_loss:26.25,league:"Bundesliga"},
  {id:7,date_match:"2025-03-18",home_team:"Osasuna",      away_team:"Girona",         market:"corners",selection:"over", odds:1.88,stake:18,prob_model:0.64,ev:0.083,status:"won",  profit_loss:15.84,league:"La Liga"},
  {id:8,date_match:"2025-03-20",home_team:"Man United",   away_team:"Everton",        market:"goals",  selection:"under",odds:2.05,stake:16,prob_model:0.60,ev:0.030,status:"pending",profit_loss:0,league:"Premier"},
  {id:9,date_match:"2025-03-21",home_team:"Real Madrid",  away_team:"Atlético Madrid",market:"ht",     selection:"draw", odds:2.20,stake:12,prob_model:0.38,ev:0.036,status:"pending",profit_loss:0,league:"La Liga"},
];

// ══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════
const C = {
  bg:"#050810",surf:"#0b1120",card:"#0f1929",border:"#192338",
  accent:"#3b82f6",green:"#10b981",red:"#f43f5e",yellow:"#f59e0b",
  cyan:"#22d3ee",purple:"#a78bfa",orange:"#fb923c",pink:"#ec4899",
  text:"#f1f5f9",muted:"#4b5563",dim:"#1e3050",
};

const MARKET_META = {
  // Football
  goals:      {icon:"⚽",label:"Goles O/U 2.5",      color:C.green},
  over05:     {icon:"✅",label:"Más de 0.5 goles",    color:C.cyan},
  btts:       {icon:"🎯",label:"BTTS",                color:C.purple},
  result:     {icon:"🏆",label:"Resultado 1X2",       color:C.accent},
  ht:         {icon:"⏱",label:"Resultado Descanso",  color:C.orange},
  cards:      {icon:"🟨",label:"Tarjetas O/U 3.5",   color:C.yellow},
  corners:    {icon:"📐",label:"Córners O/U 9.5",    color:C.pink},
  // Basketball
  total:      {icon:"🏀",label:"Puntos O/U",          color:C.orange},
  // Tennis
  winner:     {icon:"🎾",label:"Ganador",              color:C.green},
  total_sets: {icon:"📊",label:"Sets O/U",             color:C.purple},
};

const SPORT_CONFIG = {
  football:   {icon:"⚽", label:"Fútbol",      color:"#3b82f6"},
  basketball: {icon:"🏀", label:"Baloncesto",  color:"#fb923c"},
  tennis:     {icon:"🎾", label:"Tenis",       color:"#10b981"},
};

const LEAGUE_COLOR = {
  "La Liga":"#e85d04","Premier":"#3b82f6","Bundesliga":"#d62828",
  "Serie A":"#1d3557","Ligue 1":"#2d6a4f","UCL":"#f4d03f",
  "NBA":"#c9082a","EuroLeague":"#0e3b8f","ACB":"#ffd700",
  "ATP Masters 1000":"#1a7f37","WTA 1000":"#c2185b",
};

// ══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ══════════════════════════════════════════════════════════════

function Spinner() {
  return <div style={{width:20,height:20,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.accent}`,borderRadius:"50%",animation:"spin .8s linear infinite"}} />;
}

function KPI({label,value,sub,color,size=24}) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px"}}>
      <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>{label}</div>
      <div style={{fontSize:size,fontWeight:800,color:color||C.text,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:10,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function ProbBar({label,prob,color}) {
  return (
    <div style={{marginBottom:7}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
        <span style={{color:C.muted}}>{label}</span>
        <span style={{color,fontWeight:700}}>{(prob*100).toFixed(1)}%</span>
      </div>
      <div style={{background:C.dim,borderRadius:3,height:5}}>
        <div style={{width:`${prob*100}%`,height:"100%",background:color,borderRadius:3,transition:"width 1s ease"}} />
      </div>
    </div>
  );
}

function MiniChart({series,color=C.accent,height=60}) {
  if (!series||series.length<2) return null;
  const vals = series.map(s=>s.val);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max-min||1;
  const w = 100/(series.length-1);
  const pts = series.map((s,i)=>`${i*w},${height-((s.val-min)/range*(height-4)+2)}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{width:"100%",height}}>
      <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polyline points={`0,${height} ${pts} 100,${height}`} fill="url(#gr)" stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
      {series.map((s,i)=>(
        <circle key={i} cx={i*w} cy={height-((s.val-min)/range*(height-4)+2)} r="1.5" fill={color}/>
      ))}
    </svg>
  );
}

function StatusBadge({s}) {
  const map = {won:[C.green,"WON"],lost:[C.red,"LOST"],pending:[C.yellow,"PENDING"],push:[C.muted,"PUSH"],void:[C.muted,"VOID"]};
  const [c,l] = map[s]||[C.muted,s];
  return <span style={{fontSize:9,padding:"3px 8px",borderRadius:20,background:`${c}20`,color:c,border:`1px solid ${c}40`,letterSpacing:1,fontWeight:700}}>{l}</span>;
}

function ValueBadge({approved,ev,edge,stake}) {
  if (!approved) return <span style={{fontSize:9,color:C.muted}}>sin valor</span>;
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:`${C.green}20`,color:C.green,border:`1px solid ${C.green}40`}}>✅ VALUE</span>
      <span style={{fontSize:9,color:C.cyan}}>EV {ev}%</span>
      <span style={{fontSize:9,color:C.yellow}}>€{stake}</span>
    </div>
  );
}

function CalibrationChart({buckets}) {
  if (!buckets || buckets.length === 0) return null;

  // SVG layout
  const W=400, H=220, mx=44, my=12, bx=36, by=32;
  const pw = W-mx-bx, ph = H-my-by;  // plot width/height

  const withData = buckets.filter(b => b.actual !== null);

  // Scale helpers
  const sx = (i) => mx + (i / 10) * pw + pw/20;  // center of bucket i
  const sy = (v) => my + ph - (v/100)*ph;          // y for value 0-100

  const barW = pw/10 - 4;

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:4}}>CALIBRACIÓN DEL MODELO</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:16}}>
        Cuando el modelo dice 60%, ¿gana el 60% de las veces? La línea diagonal es la calibración perfecta.
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:500}}>
        {/* Grid lines Y */}
        {[0,25,50,75,100].map(v=>(
          <g key={v}>
            <line x1={mx} y1={sy(v)} x2={W-bx} y2={sy(v)} stroke={C.border} strokeWidth="0.5"/>
            <text x={mx-6} y={sy(v)+4} textAnchor="end" fontSize="9" fill={C.muted}>{v}%</text>
          </g>
        ))}

        {/* Perfect calibration diagonal */}
        <line x1={mx} y1={sy(0)} x2={W-bx} y2={sy(100)}
              stroke={C.muted} strokeWidth="1" strokeDasharray="4,3" opacity="0.6"/>
        <text x={W-bx+4} y={sy(100)+4} fontSize="8" fill={C.muted}>ideal</text>

        {/* Bars */}
        {buckets.map((b,i) => {
          if (b.actual === null) return null;
          const x    = mx + (i/10)*pw + 2;
          const diff = b.actual - b.predicted;
          const col  = diff >= 0 ? C.green : C.red;
          const yTop = sy(Math.max(b.actual, 0));
          const barH = Math.abs(sy(0) - sy(b.actual));
          return (
            <g key={b.bucket}>
              <rect x={x} y={yTop} width={barW} height={barH}
                    fill={col} opacity="0.25" rx="2"/>
              {/* Actual dot */}
              <circle cx={sx(i)} cy={sy(b.actual)} r="4" fill={col}/>
              {/* Total bets label */}
              {b.total > 0 && (
                <text x={sx(i)} y={H-by+14} textAnchor="middle" fontSize="8" fill={C.muted}>
                  {b.total}
                </text>
              )}
            </g>
          );
        })}

        {/* X axis labels */}
        {buckets.map((b,i)=>(
          <text key={b.bucket} x={sx(i)} y={H-by+26} textAnchor="middle" fontSize="8" fill={C.muted}>
            {b.mid}%
          </text>
        ))}

        {/* Axes */}
        <line x1={mx} y1={my} x2={mx} y2={H-by} stroke={C.border} strokeWidth="1"/>
        <line x1={mx} y1={H-by} x2={W-bx} y2={H-by} stroke={C.border} strokeWidth="1"/>

        {/* Axis labels */}
        <text x={mx-30} y={H/2} textAnchor="middle" fontSize="8" fill={C.muted}
              transform={`rotate(-90,${mx-30},${H/2})`}>Tasa real</text>
        <text x={(W-bx+mx)/2} y={H-2} textAnchor="middle" fontSize="8" fill={C.muted}>
          Prob. predicha
        </text>
      </svg>

      {/* Legend */}
      <div style={{display:"flex",gap:20,marginTop:12,fontSize:10,color:C.muted}}>
        <span><span style={{color:C.green}}>■</span> Por encima — modelo conservador</span>
        <span><span style={{color:C.red}}>■</span> Por debajo — modelo demasiado confiado</span>
        <span style={{color:C.muted}}>Nº = apuestas en ese rango</span>
      </div>

      {/* Stats summary */}
      {withData.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:16}}>
          {[
            ["Buckets con datos", withData.length, C.accent],
            ["Mejor calibrado",
              withData.reduce((a,b)=>Math.abs(b.actual-b.predicted)<Math.abs(a.actual-a.predicted)?b:a).bucket,
              C.green],
            ["Error medio",
              `${(withData.reduce((s,b)=>s+Math.abs(b.actual-b.predicted),0)/withData.length).toFixed(1)}%`,
              C.yellow],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:C.surf,borderRadius:8,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookmakerCompare({data}) {
  if (!data || !data.bookmakers || data.bookmakers.length === 0) return null;
  const fields = [
    {key:"result_home", label:"Local"},
    {key:"result_draw", label:"Empate"},
    {key:"result_away", label:"Visitante"},
    {key:"goals_over",  label:"+2.5"},
    {key:"goals_under", label:"-2.5"},
  ];
  const active = fields.filter(f => data.bookmakers.some(b => b[f.key]));
  if (active.length === 0) return null;
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:16}}>
      <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:12}}>📊 COMPARATIVA DE CASAS</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr>
              <th style={{textAlign:"left",padding:"4px 8px",fontSize:9,color:C.muted,fontWeight:400,letterSpacing:1}}>CASA</th>
              {active.map(f=>(
                <th key={f.key} style={{textAlign:"center",padding:"4px 8px",fontSize:9,color:C.muted,fontWeight:400,whiteSpace:"nowrap"}}>
                  {f.label}
                  {data.best[f.key] && <div style={{color:C.green,fontSize:8,marginTop:1}}>↑{data.best[f.key][1]?.toFixed(2)}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.bookmakers.map((bk,i)=>(
              <tr key={bk.name} style={{borderTop:`1px solid ${C.border}`,background:i%2===0?"transparent":`${C.surf}50`}}>
                <td style={{padding:"6px 8px",color:C.text,fontWeight:600,whiteSpace:"nowrap",fontSize:10}}>{bk.name}</td>
                {active.map(f=>{
                  const isBest = data.best[f.key]?.[0] === bk.name;
                  return (
                    <td key={f.key} style={{textAlign:"center",padding:"6px 8px",fontWeight:isBest?800:400,color:isBest?C.green:bk[f.key]?C.text:C.muted}}>
                      {bk[f.key] ? bk[f.key].toFixed(2) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FIXTURE CARD
// ══════════════════════════════════════════════════════════════

function FixtureCard({fix, onAnalyze, analyzing, selected}) {
  const lc = LEAGUE_COLOR[fix.league] || C.accent;
  return (
    <div onClick={() => onAnalyze(fix)}
      style={{
        background: selected ? `${C.accent}15` : C.card,
        border: `1px solid ${selected ? C.accent : C.border}`,
        borderRadius:10, padding:16, cursor:"pointer",
        transition:"all .2s", position:"relative", overflow:"hidden",
      }}>
      {selected && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.accent},${C.cyan})`}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:`${lc}20`,color:lc,border:`1px solid ${lc}30`}}>{fix.league}</span>
        <span style={{fontSize:11,color:C.muted}}>🕐 {fix.time}</span>
      </div>
      <div style={{textAlign:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{fix.home}</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>vs</div>
        <div style={{fontSize:13,fontWeight:700}}>{fix.away}</div>
      </div>
      <button style={{
        width:"100%",padding:"8px",background:analyzing?C.dim:`${C.accent}25`,
        border:`1px solid ${analyzing?C.border:C.accent}`,borderRadius:6,
        color:analyzing?C.muted:C.accent,fontSize:10,letterSpacing:2,
        fontFamily:"inherit",cursor:analyzing?"not-allowed":"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}>
        {analyzing ? <><Spinner/> ANALIZANDO...</> : "▶ ANALIZAR"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ANALYSIS PANEL
// ══════════════════════════════════════════════════════════════

function AnalysisPanel({result, onBet, bankroll, bookmakerOdds}) {
  const [placingId, setPlacingId] = useState(null);
  const [placed,    setPlaced]    = useState({});

  if (!result) return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:32,textAlign:"center",color:C.muted}}>
      <div style={{fontSize:32,marginBottom:12}}>⚽</div>
      <div style={{fontSize:13}}>Selecciona un partido para analizar</div>
    </div>
  );

  const handleBet = async (pick) => {
    const key = `${pick.market}_${pick.selection}`;
    setPlacingId(key);
    const id = await onBet(result, pick);
    if (id) setPlaced(p=>({...p,[key]:id}));
    setPlacingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:4}}>{result.league}</div>
            <div style={{fontSize:18,fontWeight:800}}>{result.home} <span style={{color:C.muted,fontWeight:400}}>vs</span> {result.away}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:2}}>xG esperado</div>
            <div style={{fontSize:14,fontWeight:700}}><span style={{color:C.green}}>{result.xg_home}</span> — <span style={{color:C.orange}}>{result.xg_away}</span></div>
          </div>
        </div>
        {result.value_count > 0 && (
          <div style={{background:`${C.green}10`,border:`1px solid ${C.green}30`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.green}}>
            ✅ {result.value_count} value bet{result.value_count>1?"s":""} detectada{result.value_count>1?"s":""}
          </div>
        )}
      </div>

      <BookmakerCompare data={bookmakerOdds} />

      {/* Mercados */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
        {Object.entries(result.markets||{}).map(([market, probs]) => {
          const meta = MARKET_META[market] || {icon:"?",label:market,color:C.muted};
          const picks = (result.picks||[]).filter(p=>p.market===market);

          return (
            <div key={market} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:10}}>
                {meta.icon} {meta.label}
              </div>

              {/* Probabilidades */}
              {Object.entries(probs).filter(([k])=>k!=="line").map(([sel,prob])=>(
                <ProbBar key={sel} label={sel.toUpperCase()} prob={prob}
                  color={sel==="over"||sel==="yes"||sel==="home" ? meta.color : C.muted} />
              ))}

              {/* Value bets de este mercado */}
              {picks.filter(p=>p.approved).map(p => {
                const key = `${p.market}_${p.selection}`;
                const isPlacing = placingId===key;
                const isPlaced  = placed[key];
                return (
                  <div key={key} style={{marginTop:10,padding:"8px 10px",background:`${C.green}10`,border:`1px solid ${C.green}30`,borderRadius:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,color:C.green,fontWeight:700}}>
                        ✅ {p.selection.toUpperCase()} @{p.odds}
                      </span>
                      <span style={{fontSize:10,color:C.cyan}}>EV {p.ev}%</span>
                    </div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:8}}>
                      Prob: {(p.prob*100).toFixed(1)}% · Edge: {p.edge}% · Stake: €{p.stake}
                    </div>
                    <button
                      onClick={()=>!isPlaced&&!isPlacing&&handleBet(p)}
                      style={{
                        width:"100%",padding:"6px",
                        background:isPlaced?`${C.green}30`:isPlacing?C.dim:`${C.green}20`,
                        border:`1px solid ${isPlaced?C.green:C.border}`,borderRadius:5,
                        color:isPlaced?C.green:isPlacing?C.muted:C.text,
                        fontSize:10,letterSpacing:2,fontFamily:"inherit",
                        cursor:isPlaced||isPlacing?"not-allowed":"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                      }}>
                      {isPlaced ? `✓ REGISTRADA #${placed[key]}` : isPlacing ? <><Spinner/>REGISTRANDO...</> : "APOSTAR"}
                    </button>
                  </div>
                );
              })}

              {/* Picks sin valor */}
              {picks.filter(p=>!p.approved).slice(0,1).map(p=>(
                <div key={`no_${p.selection}`} style={{marginTop:8,fontSize:10,color:C.muted}}>
                  — {p.selection.toUpperCase()} @{p.odds}: EV {p.ev}% (sin valor)
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BETS TABLE
// ══════════════════════════════════════════════════════════════

function BetsTable({bets, onSettle, loading}) {
  const [filter, setFilter] = useState("all");
  const [settling, setSettling] = useState(null);

  const visible = bets.filter(b=>filter==="all"||b.status===filter);

  const handleSettle = async (id, result) => {
    setSettling(id);
    await onSettle(id, result);
    setSettling(null);
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["all","pending","won","lost"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f?C.accent:C.border}`,
              background:filter===f?`${C.accent}20`:"transparent",color:filter===f?C.accent:C.muted,
              fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>
            {f.toUpperCase()} ({f==="all"?bets.length:bets.filter(b=>b.status===f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40}}><Spinner/></div>
      ) : (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:700}}>
              <thead>
                <tr style={{background:C.surf}}>
                  {["#","PARTIDO","MERCADO","SEL","CUOTA","STAKE","EV","P&L","STATUS",""].map(h=>(
                    <th key={h} style={{padding:"11px 12px",textAlign:"left",fontSize:9,letterSpacing:2,color:C.muted,fontWeight:400,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={10} style={{padding:32,textAlign:"center",color:C.muted}}>Sin apuestas</td></tr>
                )}
                {visible.map((b,i)=>(
                  <tr key={b.id} style={{borderTop:`1px solid ${C.border}`,background:i%2===0?"transparent":C.surf+"30"}}>
                    <td style={{padding:"10px 12px",color:C.muted}}>#{b.id}</td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{fontWeight:700,whiteSpace:"nowrap"}}>{b.home_team} vs {b.away_team}</div>
                      <div style={{color:C.muted,fontSize:9}}>{b.date_match} · {b.league}</div>
                    </td>
                    <td style={{padding:"10px 12px"}}>
                      <span style={{fontSize:10}}>{MARKET_META[b.market]?.icon||"?"} {b.market}</span>
                    </td>
                    <td style={{padding:"10px 12px",color:C.cyan,fontWeight:700}}>{b.selection?.toUpperCase()}</td>
                    <td style={{padding:"10px 12px",color:C.accent}}>@{b.odds}</td>
                    <td style={{padding:"10px 12px"}}>€{b.stake}</td>
                    <td style={{padding:"10px 12px",color:b.ev>=0.04?C.green:C.yellow}}>{(b.ev*100).toFixed(1)}%</td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:b.profit_loss>0?C.green:b.profit_loss<0?C.red:C.muted}}>
                      {b.profit_loss===0&&b.status==="pending"?"—":`${b.profit_loss>=0?"+":""}€${b.profit_loss?.toFixed(2)}`}
                    </td>
                    <td style={{padding:"10px 12px"}}><StatusBadge s={b.status}/></td>
                    <td style={{padding:"10px 12px"}}>
                      {b.status==="pending" && (
                        settling===b.id ? <Spinner/> : (
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>handleSettle(b.id,"won")}
                              style={{padding:"4px 8px",background:`${C.green}20`,border:`1px solid ${C.green}50`,borderRadius:4,color:C.green,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>W</button>
                            <button onClick={()=>handleSettle(b.id,"lost")}
                              style={{padding:"4px 8px",background:`${C.red}20`,border:`1px solid ${C.red}50`,borderRadius:4,color:C.red,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>L</button>
                            <button onClick={()=>handleSettle(b.id,"push")}
                              style={{padding:"4px 8px",background:`${C.muted}20`,border:`1px solid ${C.muted}50`,borderRadius:4,color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>P</button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════

export default function App() {
  const [tab,        setTab]        = useState("today");
  const [fixtures,   setFixtures]   = useState(MOCK_FIXTURES);
  const [stats,      setStats]      = useState(MOCK_STATS);
  const [bets,       setBets]       = useState(MOCK_BETS);
  const [analysis,      setAnalysis]      = useState(null);
  const [analyzing,     setAnalyzing]     = useState(null);
  const [selectedFix,   setSelectedFix]   = useState(null);
  const [bookmakerOdds, setBookmakerOdds] = useState(null);
  const [sport,         setSport]         = useState("football");
  const [calibration,   setCalibration]   = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, color=C.green) => {
    setToast({msg,color});
    setTimeout(()=>setToast(null),3000);
  };

  // Intentar conectar al backend
  useEffect(()=>{
    api.get("/api/status").then(r=>{
      if (r?.ok) {
        setConnected(true);
        loadAll();
      }
    });
  },[]);

  // Cargar calibración cuando se abre el tab
  useEffect(()=>{
    if (tab==="calibration" && connected && !calibration) {
      api.get("/api/calibration").then(r=>{
        if (r?.buckets) setCalibration(r.buckets);
      });
    }
  },[tab, connected]);

  const loadAll = useCallback(async(currentSport = "football")=>{
    setLoading(true);
    const [f,s,b] = await Promise.all([
      api.get(`/api/fixtures/today?sport=${currentSport}`),
      api.get("/api/stats"),
      api.get("/api/bets"),
    ]);
    if (f?.fixtures) setFixtures(f.fixtures);
    if (s?.bankroll) setStats(s);
    if (b?.bets)     setBets(b.bets);
    setLoading(false);
  },[]);

  const handleAnalyze = async (fix) => {
    setSelectedFix(fix.fixture_id);
    setAnalyzing(fix.fixture_id);
    setBookmakerOdds(null);
    setTab("analysis");

    if (connected) {
      // Cuotas + comparativa de casas en paralelo
      const [odds, compare] = await Promise.all([
        api.get(`/api/odds?home=${encodeURIComponent(fix.home)}&away=${encodeURIComponent(fix.away)}&league=${encodeURIComponent(fix.league)}`),
        api.get(`/api/odds/compare?home=${encodeURIComponent(fix.home)}&away=${encodeURIComponent(fix.away)}&league=${encodeURIComponent(fix.league)}`),
      ]);
      if (compare?.bookmakers) setBookmakerOdds(compare);
      const result = await api.post("/api/analyze", {
        home: fix.home, away: fix.away,
        league: fix.league,
        sport:  fix.sport || "football",
        odds: odds || undefined,
      });
      if (result && !result.error) {
        setAnalysis({...result, fixture_id: fix.fixture_id, date_match: fix.date});
      } else {
        showToast("Error al analizar — usando modelo local", C.yellow);
        setAnalysis(mockAnalysis(fix));
      }
    } else {
      // Mock
      await new Promise(r=>setTimeout(r,1200));
      setAnalysis(mockAnalysis(fix));
    }
    setAnalyzing(null);
  };

  const handleBet = async (analysisResult, pick) => {
    if (connected) {
      const r = await api.post("/api/bets", {
        home:       analysisResult.home,
        away:       analysisResult.away,
        league:     analysisResult.league,
        market:     pick.market,
        selection:  pick.selection,
        odds:       pick.odds,
        stake:      pick.stake,
        prob:       pick.prob,
        ev:         pick.ev/100,
        date_match: analysisResult.date_match,
        fixture_id: analysisResult.fixture_id,
      });
      if (r?.approved) {
        showToast(`✅ Apuesta #${r.bet_id} registrada — €${pick.stake}`);
        loadAll();
        return r.bet_id;
      } else {
        showToast(r?.error || "Error al registrar", C.red);
        return null;
      }
    } else {
      // Mock
      const id = Date.now();
      setBets(prev=>[{
        id, date_match: str(new Date()), home_team:analysisResult.home,
        away_team:analysisResult.away, league:analysisResult.league,
        market:pick.market, selection:pick.selection, odds:pick.odds,
        stake:pick.stake, prob_model:pick.prob, ev:pick.ev/100,
        status:"pending", profit_loss:0,
      },...prev]);
      showToast(`✅ Mock: apuesta #${id} registrada`);
      return id;
    }
  };

  const handleSettle = async (bet_id, result) => {
    if (connected) {
      const r = await api.post(`/api/bets/${bet_id}/settle`, {result});
      if (r?.bet_id) {
        showToast(`${result==="won"?"🟢":"🔴"} Apuesta #${bet_id} — ${result.toUpperCase()}`);
        loadAll();
      }
    } else {
      setBets(prev=>prev.map(b=>{
        if(b.id!==bet_id) return b;
        const pl = result==="won" ? +(b.stake*(b.odds-1)).toFixed(2) : result==="lost" ? -b.stake : 0;
        return {...b, status:result, profit_loss:pl};
      }));
      showToast(`${result==="won"?"🟢":"🔴"} #${bet_id} ${result.toUpperCase()}`);
    }
  };

  const roiColor = stats.roi>=10?C.green:stats.roi>=0?C.cyan:C.red;
  const ddColor  = stats.max_drawdown>15?C.red:stats.max_drawdown>8?C.yellow:C.green;
  const str = d => d.toISOString().split("T")[0];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'JetBrains Mono','Courier New',monospace",color:C.text,fontSize:13}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        * { box-sizing: border-box; }
        select,input,button { outline: none; }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${C.surf}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:16,right:16,zIndex:9999,background:C.card,border:`1px solid ${toast.color}`,borderRadius:8,padding:"10px 16px",fontSize:12,color:toast.color,animation:"slide .3s ease",boxShadow:"0 4px 20px #000a"}}>
          {toast.msg}
        </div>
      )}

      {/* TOPBAR */}
      <div style={{background:C.surf,borderBottom:`1px solid ${C.border}`,padding:"14px 28px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:16,fontWeight:900,letterSpacing:4,color:C.accent}}>QUANTBET</div>
        <div style={{fontSize:9,color:C.muted,letterSpacing:2}}>SISTEMA PROFESIONAL · 7 MERCADOS</div>
        <div style={{marginLeft:"auto",display:"flex",gap:16,alignItems:"center"}}>
          <div style={{fontSize:9,padding:"3px 10px",borderRadius:4,background:connected?`${C.green}20`:`${C.yellow}20`,color:connected?C.green:C.yellow,border:`1px solid ${connected?C.green:C.yellow}40`}}>
            {connected ? "● BACKEND CONECTADO" : "● MODO DEMO"}
          </div>
          {[
            ["BANKROLL",`€${stats.bankroll}`,C.green],
            ["ROI",`${stats.roi>=0?"+":""}${stats.roi}%`,roiColor],
            ["P&L",`${stats.pl>=0?"+":""}€${stats.pl}`,stats.pl>=0?C.green:C.red],
          ].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:8,color:C.muted,letterSpacing:2}}>{l}</div>
            </div>
          ))}
          {connected && (
            <button onClick={loadAll} style={{padding:"6px 12px",background:`${C.accent}20`,border:`1px solid ${C.accent}40`,borderRadius:6,color:C.accent,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
              ↻ SYNC
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",background:C.surf,borderBottom:`1px solid ${C.border}`,padding:"0 28px",overflowX:"auto"}}>
        {[
          ["today","📅 Partidos de hoy"],
          ["analysis","🔍 Análisis"],
          ["bets","📋 Apuestas"],
          ["dashboard","📊 Dashboard"],
          ["markets","🎯 Mercados"],
          ["calibration","📈 Calibración"],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{background:"none",border:"none",padding:"12px 18px",cursor:"pointer",
              color:tab===id?C.accent:C.muted,borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`,
              fontSize:10,letterSpacing:1,fontFamily:"inherit",whiteSpace:"nowrap"}}>
            {label}
            {id==="bets"&&stats.pending>0&&<span style={{marginLeft:6,fontSize:9,padding:"1px 5px",borderRadius:8,background:`${C.yellow}30`,color:C.yellow}}>{stats.pending}</span>}
          </button>
        ))}
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 20px"}}>

        {/* ══ PARTIDOS DE HOY ══ */}
        {tab==="today" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>Partidos disponibles hoy</div>
                <div style={{fontSize:11,color:C.muted}}>{fixtures.length} partidos · {connected?"datos en vivo":"datos de demo"}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {/* Sport selector */}
                {Object.entries(SPORT_CONFIG).map(([s,cfg])=>(
                  <button key={s} onClick={()=>{
                    setSport(s);
                    setFixtures([]);
                    if(connected) loadAll(s);
                  }} style={{
                    padding:"7px 14px",borderRadius:8,fontSize:11,cursor:"pointer",fontFamily:"inherit",
                    border:`1px solid ${sport===s?cfg.color:C.border}`,
                    background:sport===s?`${cfg.color}20`:"transparent",
                    color:sport===s?cfg.color:C.muted,
                    fontWeight:sport===s?700:400,
                  }}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
                {connected && (
                  <button onClick={()=>loadAll(sport)}
                    style={{padding:"7px 14px",background:`${C.accent}20`,border:`1px solid ${C.accent}`,borderRadius:8,color:C.accent,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                    ↻
                  </button>
                )}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
              {fixtures.map(fix=>(
                <FixtureCard key={fix.fixture_id} fix={fix}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing===fix.fixture_id}
                  selected={selectedFix===fix.fixture_id}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ ANÁLISIS ══ */}
        {tab==="analysis" && (
          <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:16}}>
            <div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:10}}>PARTIDOS DE HOY</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {fixtures.map(fix=>(
                  <div key={fix.fixture_id} onClick={()=>handleAnalyze(fix)}
                    style={{
                      background:selectedFix===fix.fixture_id?`${C.accent}15`:C.card,
                      border:`1px solid ${selectedFix===fix.fixture_id?C.accent:C.border}`,
                      borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"all .15s",
                    }}>
                    <div style={{fontSize:9,color:LEAGUE_COLOR[fix.league]||C.muted,marginBottom:4}}>{fix.league} · {fix.time}</div>
                    <div style={{fontSize:11,fontWeight:700,lineHeight:1.4}}>{fix.home}<br/>{fix.away}</div>
                    {analyzing===fix.fixture_id && <div style={{marginTop:6,display:"flex",gap:6,alignItems:"center"}}><Spinner/><span style={{fontSize:9,color:C.muted}}>analizando...</span></div>}
                  </div>
                ))}
              </div>
            </div>
            <AnalysisPanel result={analysis} onBet={handleBet} bankroll={stats.bankroll} bookmakerOdds={bookmakerOdds} />
          </div>
        )}

        {/* ══ APUESTAS ══ */}
        {tab==="bets" && (
          <BetsTable bets={bets} onSettle={handleSettle} loading={loading} />
        )}

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
              <KPI label="APUESTAS"   value={stats.bets}      sub={`${stats.pending} pendientes`} />
              <KPI label="WIN RATE"   value={`${stats.winrate}%`}  color={stats.winrate>=55?C.green:stats.winrate>=50?C.yellow:C.red} />
              <KPI label="ROI"        value={`${stats.roi>=0?"+":""}${stats.roi}%`} color={roiColor} />
              <KPI label="MAX DD"     value={`${stats.max_drawdown}%`} color={ddColor} sub="Drawdown máximo" />
              <KPI label="EN RIESGO"  value={`€${stats.in_flight}`} color={C.yellow} sub="Pendiente liquidar" />
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:2}}>EVOLUCIÓN DEL BANKROLL</div>
                  <div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>€{stats.bankroll}</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.muted}}>
                  <div>Inicial: €{stats.initial}</div>
                  <div style={{color:stats.pl>=0?C.green:C.red}}>{stats.pl>=0?"+":""}€{stats.pl} total</div>
                </div>
              </div>
              <MiniChart series={stats.bankroll_series} color={C.accent} height={80} />
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14}}>DISTRIBUCIÓN W/L</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[["GANADAS",stats.won,C.green],["PERDIDAS",stats.lost,C.red],["PENDIENTES",stats.pending,C.yellow],["TOTAL",stats.bets,C.accent]].map(([l,v,c])=>(
                    <div key={l} style={{background:C.surf,borderRadius:8,padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted,letterSpacing:2}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:2,height:8,borderRadius:4,overflow:"hidden"}}>
                  <div style={{flex:stats.won,background:C.green}}/>
                  <div style={{flex:stats.lost,background:C.red}}/>
                  <div style={{flex:stats.pending,background:C.yellow}}/>
                </div>
              </div>

              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14}}>RACHAS & RIESGO</div>
                {[
                  ["Max racha ganadora", stats.win_streak,  C.green],
                  ["Max racha perdedora",stats.loss_streak, C.red],
                  ["Max Drawdown",       `${stats.max_drawdown}%`, ddColor],
                  ["Total apostado",     `€${stats.total_stake}`,  C.accent],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                    <span style={{color:C.muted}}>{l}</span>
                    <span style={{color:c,fontWeight:700}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ MERCADOS ══ */}
        {tab==="markets" && (
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>RENDIMIENTO POR MERCADO</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:24}}>
              {Object.entries(MARKET_META).map(([key,meta])=>{
                const m = (stats.by_market||[]).find(x=>x.market===key)||{bets:0,won:0,pl:0,roi:0};
                return (
                  <div key={key} style={{background:C.card,border:`1px solid ${m.roi>=0?meta.color+"40":C.border}`,borderRadius:10,padding:16}}>
                    <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:8}}>{meta.icon} {meta.label}</div>
                    <div style={{fontSize:22,fontWeight:800,color:m.roi>=0?meta.color:C.red}}>
                      {m.bets===0?"—":`${m.roi>=0?"+":""}${m.roi}%`}
                    </div>
                    <div style={{fontSize:10,color:C.muted,marginTop:4}}>ROI</div>
                    <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                      {[["Bets",m.bets],["Won",m.won],["P&L",`€${m.pl}`]].map(([k,v])=>(
                        <div key={k} style={{background:C.surf,borderRadius:4,padding:"5px 8px"}}>
                          <div style={{fontSize:8,color:C.muted}}>{k}</div>
                          <div style={{fontSize:12,fontWeight:700}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabla de reglas de riesgo */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14}}>🛡 REGLAS DE RIESGO ACTIVAS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  ["EV mínimo para apostar","4%",C.green],
                  ["Probabilidad mínima","52%",C.green],
                  ["Rango de cuotas","1.40 – 4.00",C.cyan],
                  ["Stake máximo","5% bankroll",C.yellow],
                  ["Riesgo diario máximo","10% bankroll",C.yellow],
                  ["Máx apuestas/día","5",C.yellow],
                  ["Stop-loss diario","5% bankroll",C.red],
                  ["Pausa por racha","8 pérdidas seguidas",C.red],
                  ["Kelly utilizado","1/4 Kelly",C.purple],
                  ["Ajuste por racha","Reducción automática stake",C.orange],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.surf,borderRadius:6,fontSize:11}}>
                    <span style={{color:C.muted}}>{l}</span>
                    <span style={{color:c,fontWeight:700}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ CALIBRACIÓN ══ */}
        {tab==="calibration" && (
          <div>
            <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Calibración del modelo</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:20}}>
              Necesitas al menos 20-30 apuestas liquidadas para que el gráfico sea significativo.
              Mientras más apuestas, más fiable la calibración.
            </div>

            {!connected ? (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:32,textAlign:"center",color:C.muted}}>
                <div style={{fontSize:32,marginBottom:12}}>📊</div>
                <div>Conecta el backend para ver la calibración real</div>
              </div>
            ) : !calibration ? (
              <div style={{textAlign:"center",padding:40}}><Spinner/></div>
            ) : (
              <div style={{display:"grid",gap:16}}>
                <CalibrationChart buckets={calibration}/>

                {/* Interpretación */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14}}>CÓMO INTERPRETAR</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,fontSize:11}}>
                    {[
                      ["Punto EN la diagonal","Modelo perfectamente calibrado en ese rango",C.accent],
                      ["Punto POR ENCIMA","Modelo conservador — infravalora sus picks",C.green],
                      ["Punto POR DEBAJO","Modelo demasiado confiado — sobrevalora",C.red],
                      ["Buckets vacíos","Pocas apuestas en ese rango de probabilidad",C.muted],
                    ].map(([t,d,c])=>(
                      <div key={t} style={{background:C.surf,borderRadius:8,padding:"12px"}}>
                        <div style={{color:c,fontWeight:700,marginBottom:4}}>{t}</div>
                        <div style={{color:C.muted,fontSize:10}}>{d}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={()=>{
                  setCalibration(null);
                  api.get("/api/calibration").then(r=>r?.buckets&&setCalibration(r.buckets));
                }} style={{
                  padding:"10px",background:`${C.accent}15`,border:`1px solid ${C.accent}40`,
                  borderRadius:8,color:C.accent,fontSize:11,cursor:"pointer",fontFamily:"inherit",
                }}>
                  ↻ Recargar calibración
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mock analysis para demo ──
function mockAnalysis(fix) {
  const h = Math.random()*0.4+0.4, a = Math.random()*0.3+0.2, d = 1-h-a;
  const o25 = Math.random()*0.3+0.45, btts = Math.random()*0.25+0.45;
  return {
    home:fix.home, away:fix.away, league:fix.league,
    xg_home: +(Math.random()*1.5+0.8).toFixed(2),
    xg_away: +(Math.random()*1.2+0.6).toFixed(2),
    date_match: fix.date, fixture_id: fix.fixture_id,
    markets:{
      goals:   {over:+o25.toFixed(3),  under:+(1-o25).toFixed(3),    line:"2.5"},
      over05:  {over:0.924,             under:0.076,                   line:"0.5"},
      btts:    {yes:+btts.toFixed(3),   no:+(1-btts).toFixed(3)},
      result:  {home:+h.toFixed(3),     draw:+Math.max(0,d).toFixed(3),away:+a.toFixed(3)},
      ht:      {home:0.38,              draw:0.35,                     away:0.27},
      cards:   {over:0.54,             under:0.46,                    line:"3.5"},
      corners: {over:0.61,             under:0.39,                    line:"9.5"},
    },
    odds:{goals_over:1.85,goals_under:2.0,btts_yes:1.80,btts_no:2.0,
          result_home:+(1/h*1.08).toFixed(2),result_draw:+(1/Math.max(d,0.1)*1.1).toFixed(2),result_away:+(1/a*1.1).toFixed(2),
          ht_home:2.80,ht_draw:2.20,ht_away:4.50,over05:1.10,
          cards_over:1.90,cards_under:1.95,corners_over:1.80,corners_under:2.05},
    picks:[
      ...(o25>0.57?[{market:"goals",selection:"over",prob:+o25.toFixed(3),odds:1.85,ev:+((o25*1.85-1)*100).toFixed(1),edge:+((o25-1/1.85)*100).toFixed(1),stake:+(1000*Math.max(0,o25-1/1.85)/(1.85-1)*0.25).toFixed(2),approved:o25*1.85-1>=0.04}]:[]),
      ...(btts>0.58?[{market:"btts",selection:"yes",prob:+btts.toFixed(3),odds:1.80,ev:+((btts*1.80-1)*100).toFixed(1),edge:+((btts-1/1.80)*100).toFixed(1),stake:+(1000*Math.max(0,btts-1/1.80)/(1.80-1)*0.25).toFixed(2),approved:btts*1.80-1>=0.04}]:[]),
    ],
    value_count: (o25>0.57?1:0)+(btts>0.58?1:0),
  };
}
