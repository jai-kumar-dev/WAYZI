import { useEffect, useMemo, useState } from 'react';
import { Accessibility, ArrowDown, ArrowLeft, ArrowRight, Check, ChevronRight, CirclePause, CirclePlay, Flag, LocateFixed, MapPin, Navigation, RotateCcw, Route, Volume2, X } from 'lucide-react';

// Coordinates use the same viewBox as the supplied GTBIT campus image (1376 × 1113).
// The graph follows the visible paved walkways. Distances are illustrative routing costs.
const NODES = {
  gate: { label: 'Main Gate', p: [720, 950], area: 'outdoor' },
  gateRight: { label: 'Main Gate right-side path', p: [920, 950], area: 'outdoor' },
  gateBend: { label: 'Right-side path entrance bend', p: [940, 920], area: 'outdoor' },
  southeast: { label: 'Right-side lower path', p: [1110, 900], area: 'outdoor' },
  southeastBend: { label: 'Right-side path bend', p: [1280, 830], area: 'outdoor' },
  eastMid: { label: 'Right-side paved gully', p: [1330, 700], area: 'outdoor' },
  eastUpper: { label: 'Right-side paved gully', p: [1310, 500], area: 'outdoor' },
  eastTop: { label: 'Right-side paved gully upper bend', p: [1325, 360], area: 'outdoor' },
  northeast: { label: 'Rear-right walkway', p: [1300, 290], area: 'outdoor' },
  rearUpper: { label: 'Walkway behind the Lab Block', p: [1240, 230], area: 'outdoor' },
  labRampApproach: { label: 'Walkway approaching the Lab Block ramp', p: [1100, 208], area: 'outdoor' },
  labRamp: { label: 'Lab Block right-side ramp', p: [1007, 208], area: 'ramp' },
  labFront: { label: 'Lab Block main entrance (stairs)', p: [758, 266], area: 'stairs' },
  fountain: { label: 'Fountain courtyard', p: [720, 800], area: 'outdoor' },
  courtyard: { label: 'Central paved courtyard', p: [720, 660], area: 'outdoor' },
  connector: { label: 'Covered connector', p: [720, 565], area: 'outdoor' },
  bvsApproach: { label: 'BVS Block approach', p: [400, 755], area: 'outdoor' },
  bvsPath: { label: 'Left courtyard path', p: [285, 790], area: 'outdoor' },
  leftBend: { label: 'Left-side paved path', p: [155, 720], area: 'outdoor' },
  canteen1: { label: 'Canteen 1', p: [105, 600], area: 'outdoor' },
  leftUpper: { label: 'Left-side paved path', p: [120, 430], area: 'outdoor' },
  canteen2: { label: 'Canteen 2', p: [135, 318], area: 'outdoor' },
  leftRear: { label: 'Rear-left walkway', p: [180, 290], area: 'outdoor' },
  leftRearBend: { label: 'Upper-left walkway bend', p: [145, 270], area: 'outdoor' },
  labRearWest: { label: 'Walkway behind the Lab Block', p: [180, 230], area: 'outdoor' },
  labRearMid: { label: 'Walkway behind the Lab Block', p: [520, 230], area: 'outdoor' },
  labRearEast: { label: 'Walkway behind the Lab Block', p: [1020, 230], area: 'outdoor' },
  bvsDoor: { label: 'BVS Block entrance', p: [400, 740], area: 'entrance' },
  academicApproach: { label: 'Academic Block approach', p: [1170, 790], area: 'outdoor' },
  academicDoor: { label: 'Academic Block main entrance', p: [1170, 785], area: 'entrance' },
  academicSecond: { label: 'Academic Block second entrance', p: [1010, 515], area: 'ramp' },
  academicSide: { label: 'Academic Block side walkway', p: [1025, 650], area: 'outdoor' },
  labRoom: { label: 'Lab Block interior', p: [730, 220], area: 'indoor' },
  bvsRoom: { label: 'BVS Block interior', p: [400, 560], area: 'indoor' },
  academicRoom: { label: 'Academic Block interior', p: [1170, 590], area: 'indoor' },
};
const EDGES = [
  ['gate','gateRight'],['gateRight','gateBend'],['gateBend','southeast'],['southeast','southeastBend'],['southeastBend','eastMid'],['eastMid','eastUpper'],['eastUpper','eastTop'],['eastTop','northeast'],['northeast','rearUpper'],['rearUpper','labRampApproach'],['labRampApproach','labRamp'],
  ['gate','fountain'],['fountain','courtyard'],['courtyard','connector'],['connector','academicSecond'],['academicSecond','academicSide'],['academicSide','academicApproach'],
  ['fountain','bvsPath'],['bvsPath','bvsApproach'],['bvsPath','leftBend'],['leftBend','canteen1'],['canteen1','leftUpper'],['leftUpper','canteen2'],
  // Direct upper walkway: Canteen 2 -> upper-left bend -> rear Lab Block walkway -> right-side ramp.
  ['canteen2','leftRearBend'],['leftRearBend','labRearWest'],['labRearWest','labRearMid'],['labRearMid','labRearEast'],['labRearEast','labRamp'],
  ['leftRear','labFront'],
  ['bvsApproach','bvsDoor'],['bvsDoor','bvsRoom'],['southeast','academicApproach'],['academicApproach','academicDoor'],['academicDoor','academicRoom'],
  ['labRamp','labRoom'],
  // Ordinary visitors may use the front stairs; wheelchair mode excludes this link.
  ['labFront','labRoom','stairs'],
  ['courtyard','bvsApproach'],
];
const DESTS = [
  'Main Gate','Fountain','BVS Block entrance','BVS Block · BVK12','BVS Block · BVK13','BVS Block · Chemistry Lab','BVS Block · Library',
  'Academic Block entrance','Academic Block · Second Gate','Academic Block · Room 104','Academic Block · Room 202','Academic Block · Auditorium',
  'Lab Block entrance','Lab Block · Right-side ramp','Lab Block · Lift lobby','Lab Block · Reading Room','Lab Block · CSE Lab 01','Lab Block · ECE Lab 01','Lab Block · Ground-floor washroom',
  'Canteen 1','Canteen 2','Covered connector','Ground path under connector'
];
const STARTS = DESTS;
const DEST_NODE = {
  'Main Gate':'gate','Fountain':'fountain','BVS Block entrance':'bvsDoor','BVS Block · BVK12':'bvsRoom','BVS Block · BVK13':'bvsRoom','BVS Block · Chemistry Lab':'bvsRoom','BVS Block · Library':'bvsRoom',
  'Academic Block entrance':'academicDoor','Academic Block · Second Gate':'academicSecond','Academic Block · Room 104':'academicRoom','Academic Block · Room 202':'academicRoom','Academic Block · Auditorium':'academicRoom',
  'Lab Block entrance':'labFront','Lab Block · Right-side ramp':'labRamp','Lab Block · Lift lobby':'labRoom','Lab Block · Reading Room':'labRoom','Lab Block · CSE Lab 01':'labRoom','Lab Block · ECE Lab 01':'labRoom','Lab Block · Ground-floor washroom':'labRoom',
  'Canteen 1':'canteen1','Canteen 2':'canteen2','Covered connector':'connector','Ground path under connector':'courtyard'
};
function pointDistance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function shortestRoute(startKey,endKey,wheelchair){
  const graph=new Map(Object.keys(NODES).map(k=>[k,[]]));
  EDGES.forEach(([a,b,type='path'])=>{
    if(wheelchair && type==='stairs') return;
    const weight=pointDistance(NODES[a].p,NODES[b].p);
    graph.get(a).push({to:b,weight,type}); graph.get(b).push({to:a,weight,type});
  });
  const dist=new Map([[startKey,0]]), prev=new Map(), pending=new Set(graph.keys());
  while(pending.size){let u=null,best=Infinity;for(const id of pending){const d=dist.get(id)??Infinity;if(d<best){best=d;u=id;}}if(u===null||best===Infinity)break;if(u===endKey)break;pending.delete(u);for(const e of graph.get(u)||[]){if(!pending.has(e.to))continue;const nd=best+e.weight;if(nd<(dist.get(e.to)??Infinity)){dist.set(e.to,nd);prev.set(e.to,{from:u,type:e.type});}}}
  if(!dist.has(endKey))return null;
  const ids=[];let cur=endKey;ids.unshift(cur);while(cur!==startKey){const p=prev.get(cur);if(!p)return null;cur=p.from;ids.unshift(cur);}
  return {ids,distance:dist.get(endKey)};
}
function turnFor(a,b){const [dx,dy]=[b[0]-a[0],b[1]-a[1]];if(Math.abs(dx)>Math.abs(dy)*1.25)return dx>0?'right':'left';if(Math.abs(dy)>Math.abs(dx)*1.25)return dy>0?'straight':'straight';return dx>0?'right':dx<0?'left':'straight';}
function buildSteps(route,from,to){
  if(!route)return [{title:'No route available',detail:'Choose another starting point or destination.',turn:'straight'}];
  const rows=[{title:`Start at ${from}`,detail:'Follow the highlighted paved campus path.',turn:'start'}];
  for(let i=1;i<route.ids.length;i++){
    const prev=NODES[route.ids[i-1]],node=NODES[route.ids[i]];
    let title;
    if(node.area==='ramp') title='Use the step-free entrance / ramp';
    else if(node.area==='stairs') title='Use the main entrance stairs';
    else if(node.area==='indoor') title='Continue inside to the destination area';
    else if(node.label===to) title=`Arrive at ${to}`;
    else if(i===route.ids.length-1) title=`Arrive at ${to}`;
    else title=turnFor(prev.p,node.p)==='right'?'Follow the path to the right':turnFor(prev.p,node.p)==='left'?'Follow the path to the left':'Continue straight along the paved path';
    rows.push({title,detail:node.area==='ramp'?'The prototype routes wheelchair users to the Lab Block ramp on the right/rear side.':node.area==='indoor'?'Indoor room position is illustrative; use the building corridor and lift as appropriate.':`Continue along ${node.label.toLowerCase()}.`,turn:/right/i.test(title)?'right':/left/i.test(title)?'left':node.area==='indoor'?'lift':'straight'});
  }
  if(rows.length===1) rows.push({title:`Arrive at ${to}`,detail:'You are already at the selected destination.',turn:'arrive'});
  else rows.push({title:'You have arrived',detail:`You reached ${to}.`,turn:'arrive'});
  return rows;
}
function ArrowFor({turn}){if(turn==='left')return <ArrowLeft/>;if(turn==='right')return <ArrowRight/>;if(turn==='arrive')return <Flag/>;return <Navigation/>}
export default function AccessibleJourney(){
 const [from,setFrom]=useState('Main Gate'); const [to,setTo]=useState('Lab Block · Right-side ramp'); const [wheelchair,setWheelchair]=useState(true); const [started,setStarted]=useState(false); const [step,setStep]=useState(0); const [auto,setAuto]=useState(false); const [voice,setVoice]=useState(false);
 const startNode=(wheelchair && from==='Lab Block entrance')?'labRamp':DEST_NODE[from];
 const endNode=(wheelchair && /^Lab Block(?: ·|$)/i.test(to))?'labRamp':DEST_NODE[to];
 const route=useMemo(()=>shortestRoute(startNode,endNode,wheelchair),[startNode,endNode,wheelchair]);
 const routeIds=route?.ids||[]; const points=routeIds.map(id=>NODES[id].p); const steps=useMemo(()=>buildSteps(route,from,to),[route,from,to]);
 const progress=started?Math.min(100,Math.round(step/Math.max(1,steps.length-1)*100)):0;
 useEffect(()=>{if(!auto||!started)return;const timer=setInterval(()=>setStep(s=>{if(s>=steps.length-1){setAuto(false);return s;}return s+1;}),3500);return()=>clearInterval(timer);},[auto,started,steps.length]);
 useEffect(()=>{if(voice&&started&&steps[step]&&'speechSynthesis'in window){window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(steps[step].title));}},[step,voice,started,steps]);
 const changeRoute=(setter,value)=>{setter(value);setStarted(false);setAuto(false);setStep(0);};
 const marker=points[Math.min(points.length-1,Math.floor((step/Math.max(1,steps.length-1))*Math.max(0,points.length-1)))];
 const routeD=points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
 const distanceM=route?Math.round(route.distance*0.13):0; const minutes=route?Math.max(1,Math.ceil(distanceM/(wheelchair?45:75))):0;
 const same=from===to;
 return <main className="journey-shell">
  <header className="journey-heading"><div><div className="journey-eyebrow"><span className="live-dot"/> GTBIT CAMPUS · DEMO MODE</div><h1>Where do you want to go?</h1><p>Shortest-path routing across the mapped paved campus paths, with a step-free preference.</p></div><div className="journey-mode"><Accessibility size={20}/><span><b>Wheelchair-friendly routing</b><small>Exclude stairs · prefer ramps and lifts</small></span><button type="button" className={`mode-switch ${wheelchair?'':'mode-off'}`} onClick={()=>{setWheelchair(v=>!v);setStarted(false);setStep(0);setAuto(false)}}>{wheelchair?'ON':'OFF'}</button></div></header>
  <section className="journey-planner"><label><span>FROM</span><div className="journey-select-wrap"><span className="journey-origin-dot"/><select value={from} onChange={e=>changeRoute(setFrom,e.target.value)}>{STARTS.map(x=><option key={x}>{x}</option>)}</select></div></label><button className="journey-swap" title="Swap starting point and destination" onClick={()=>{const old=from;changeRoute(setFrom,to);changeRoute(setTo,old)}}><ArrowDown size={17}/></button><label><span>TO</span><div className="journey-select-wrap"><MapPin size={17}/><select value={to} onChange={e=>changeRoute(setTo,e.target.value)}>{DESTS.map(x=><option key={x}>{x}</option>)}</select></div></label><button className="journey-go" onClick={()=>{setStarted(true);setStep(0);setAuto(false)}}><Route size={17}/> Preview shortest route</button></section>
  {wheelchair&&<div className="journey-warning"><Accessibility size={18}/><span><b>Step-free route preference is ON.</b> Stair links are excluded and the Lab Block's right-side ramp is used. Campus paths, ramp slope, curb cuts and lift availability are illustrative and still require on-site verification.</span></div>}
  <div className="journey-content"><section className="journey-map-card"><div className="journey-map-top"><div><span className="journey-label">LIVE ROUTE PREVIEW</span><h2>{started?(step===steps.length-1?'You have arrived':steps[step]?.title):`${from} → ${to}`}</h2></div><span className="demo-map-pill"><span/> SHORTEST PATH</span></div>
   <div className="journey-map"><svg viewBox="0 0 1376 1113" role="img" aria-label="GTBIT campus image with shortest route drawn over walkable paths" preserveAspectRatio="xMidYMid meet"><image href="/gtbit-campus-map.png" x="0" y="0" width="1376" height="1113" preserveAspectRatio="none"/><path d={routeD} fill="none" stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" opacity=".94"/><path d={routeD} fill="none" stroke={wheelchair?'#e21d2b':'#1769e8'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={started?'none':'13 9'}/>{points.length>0&&<><circle cx={points[0][0]} cy={points[0][1]} r="13" fill={wheelchair?'#e21d2b':'#1769e8'} stroke="#fff" strokeWidth="5"/><circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="13" fill={wheelchair?'#16a34a':'#e21d2b'} stroke="#fff" strokeWidth="5"/>{points.slice(1).map((p,i)=>{const a=points[i];const angle=Math.atan2(p[1]-a[1],p[0]-a[0])*180/Math.PI;const x=(p[0]+a[0])/2,y=(p[1]+a[1])/2;return <path key={`${i}-${p[0]}-${p[1]}`} d="M -8 -6 L 8 0 L -8 6 Z" transform={`translate(${x} ${y}) rotate(${angle})`} fill="#fff" stroke={wheelchair?'#e21d2b':'#1769e8'} strokeWidth="2"/>})}{started&&marker&&<g transform={`translate(${marker[0]} ${marker[1]})`}><circle r="24" fill="#1769e8" opacity=".2"/><circle r="12" fill="#1769e8" stroke="#fff" strokeWidth="4"/><path d="M0 -7 L6 5 L0 2 L-6 5Z" fill="#fff"/></g>}</>}</svg><div className="journey-map-footer"><span><i className="legend-route" style={{background:wheelchair?'#e21d2b':'#1769e8'}}/> {wheelchair?'Wheelchair-friendly route':'Walking route'}</span><span><i className="legend-dot" style={{background:wheelchair?'#16a34a':'#e21d2b'}}/> Destination</span><span>Illustrative map · not to scale</span></div></div>
   <div className="journey-progress-wrap"><div className="journey-progress-label"><span>{started?`STEP ${Math.min(step+1,steps.length)} OF ${steps.length}`:'ROUTE READY TO PREVIEW'}</span><b>{progress}%</b></div><div className="journey-progress"><span style={{width:`${progress}%`}}/></div></div>
   <div className="journey-controls"><button className="journey-secondary" onClick={()=>{setStarted(false);setStep(0);setAuto(false)}}><RotateCcw size={16}/> Reset</button><button className="journey-secondary" onClick={()=>setVoice(v=>!v)}><Volume2 size={16}/>{voice?'Voice on':'Voice guidance'}</button><button className="journey-primary" disabled={!started||step>=steps.length-1||!route} onClick={()=>{setAuto(false);setStep(s=>Math.min(steps.length-1,s+1))}}>Next instruction <ChevronRight size={17}/></button><button className="journey-play" disabled={!started||step>=steps.length-1||!route} onClick={()=>setAuto(a=>!a)}>{auto?<CirclePause size={18}/>:<CirclePlay size={18}/>} {auto?'Pause':'Auto-play'}</button></div>
  </section><aside className="journey-directions"><div className="journey-directions-header"><div><span className="journey-label">TURN-BY-TURN</span><h2>Follow these steps</h2></div><span className="journey-time">{minutes} min <small>demo estimate</small></span></div><div className="journey-current"><div className="journey-current-icon"><ArrowFor turn={steps[step]?.turn}/></div><div><span>{started?'CURRENT INSTRUCTION':'FIRST INSTRUCTION'}</span><h3>{started?(steps[step]?.title||'Start navigation'):'Ready when you are'}</h3><p>{started?(steps[step]?.detail||'Follow the highlighted route'):'Preview the route to see the shortest walkable path and instructions.'}</p></div></div><div className="journey-step-list">{steps.map((s,i)=><button key={i} className={`journey-step-row ${i===step&&started?'current':''} ${i<step&&started?'completed':''}`} onClick={()=>{setStarted(true);setAuto(false);setStep(i)}}><span className="journey-step-symbol">{i<step&&started?<Check size={15}/>:<ArrowFor turn={s.turn}/>}</span><span className="journey-step-copy"><b>{s.title}</b><small>{s.detail}</small></span>{i===step&&started?<span className="journey-here">NOW</span>:<ChevronRight size={15}/>}</button>)}</div><div className="journey-demo-note"><LocateFixed size={17}/><p><b>{same?'Already at destination':'Shortest path calculated'}</b><br/>{route?`Approx. ${distanceM} m along the mapped path. Distances and indoor room positions are illustrative; this is not a verified navigation or wheelchair-safety service.`:'No route exists in the current path graph. Select another destination.'}</p></div></aside></div>
  <footer className="journey-footer"><span><Accessibility size={17}/> {wheelchair?'Step-free preference enabled':'Standard walking route'}</span><span><MapPin size={16}/> GTBIT campus reference image</span><span><b>Prototype data</b> · confirm actual paths and accessibility on site</span></footer>
 </main>;
}
