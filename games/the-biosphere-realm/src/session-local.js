"use strict";
/* ============ A local session, for trying the shared game on one machine ============
   index.html?session&host&players=2&ai=2&viewers=40   (add &bridge to let Claude rule the AI seats)

   Stands in for the network until it is built (decision 010: Supabase Realtime carries
   messages, an Edge Function checks each viewer). Simulated players and viewers send the same
   submit() calls the network will, so the engine's rules (seats, cooldowns, the viewer budget,
   the second check) run exactly as they will live. The panel shows the status line a viewer
   who swipes in would read, who is in the session, what just happened and, with &host, the
   host's controls. Without ?session nothing here runs. */
(()=>{
  const q=new URLSearchParams(location.search);
  if(!q.has('session')||typeof GTEngine==='undefined')return;
  const num=(k,d,max)=>Math.max(0,Math.min(max,parseInt(q.has(k)?q.get(k):d,10)||0));
  const S=SESSION.create();
  const NAMES=['Ash','Bryn','Cato','Dara','Eli','Fen','Gale','Hollis','Ira','Jun','Kit','Lark','Moss','Nell','Oak','Pim','Quill','Rue','Sage','Tam','Uma','Vale','Wren','Yara','Zed'];
  if(q.has('host'))S.join({id:'host',role:'host',name:'Host'});
  for(let i=0;i<num('players',2,6);i++)S.join({id:`p${i}`,role:'player',name:NAMES[i]});
  for(let i=0;i<num('ai',2,6);i++){
    const id=`ai${i}`;
    if(S.join({id,role:'ai',name:`AI ${i+1}`}).ok)GTEngine.createAIDriver(S,id,{decide:q.has('bridge')?SESSION.bridgeRuler:SESSION.localRuler});
  }
  const viewers=num('viewers',30,1000);
  for(let i=0;i<viewers;i++)S.join({id:`v${i}`,role:'viewer',name:`${NAMES[(i*7+3)%NAMES.length]}${i+1}`});

  /* simulated people: players think it over and act now and then; each second a few viewers tap an omen */
  setInterval(()=>{
    if(speed===0)return;
    for(const m of S.members('player')){
      if(RC()>.3)continue;
      const menu=S.menu(m.id);
      const claim=menu.find(x=>x.action==='claim'&&x.ready);
      if(claim&&claim.args.kingdom.values.length){S.submit(m.id,'claim',{kingdom:claim.args.kingdom.values[0]});continue}
      const d=SESSION.localRuler({observation:S.observe(m.id),menu,errors:[]});
      if(d.action!=='wait')S.submit(m.id,d.action,d.args);
    }
    const vs=S.members('viewer');
    for(let k=0;k<Math.min(vs.length,3+((RC()*vs.length*.1)|0));k++){
      const v=vs[(RC()*vs.length)|0],m=S.menu(v.id).find(x=>x.action==='omen');
      if(!m||!m.args.kingdom.values.length)continue;
      const pickRC=a=>a[(RC()*a.length)|0];
      S.submit(v.id,'omen',{kind:pickRC(m.args.kind.values),kingdom:pickRC(m.args.kingdom.values)});
    }
  },1000);

  /* ---------- the panel ---------- */
  const el=document.createElement('aside');
  el.className='gt-session';el.setAttribute('aria-label','Shared session');
  const st=document.createElement('style');
  st.textContent=`.gt-session{position:fixed;right:12px;top:64px;z-index:30;width:min(340px,calc(100vw - 24px));background:var(--panel);color:var(--ink);
    border:2px solid var(--line);box-shadow:3px 3px 0 var(--line);font:13px/1.35 var(--body);padding:8px 10px}
  .gt-session h2{font:12px var(--pixel);margin:0 0 4px;display:flex;justify-content:space-between;align-items:center}
  .gt-session .gt-line{font-weight:700;margin:0 0 2px}.gt-session .gt-people{color:var(--muted);margin:0 0 6px}
  .gt-session ol{list-style:none;margin:0;padding:0;max-height:150px;overflow:auto}.gt-session li{padding:2px 0;border-top:1px solid color-mix(in srgb,var(--line) 20%,transparent)}
  .gt-session .gt-no{color:var(--muted)}.gt-session .gt-ctl{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
  .gt-session button{font:12px var(--body);background:var(--btn);color:var(--ink);border:2px solid var(--line);padding:2px 8px;cursor:pointer}
  .gt-session button[aria-pressed="true"]{background:var(--sel);color:var(--sel-ink)}
  .gt-session.min ol,.gt-session.min .gt-ctl,.gt-session.min .gt-people{display:none}`;
  document.head.appendChild(st);
  const h=document.createElement('h2');h.textContent='Shared session';
  const minBtn=document.createElement('button');minBtn.textContent='–';minBtn.setAttribute('aria-label','Collapse the session panel');
  minBtn.onclick=()=>{el.classList.toggle('min');minBtn.textContent=el.classList.contains('min')?'+':'–'};
  h.appendChild(minBtn);
  const line=document.createElement('p');line.className='gt-line';
  const people=document.createElement('p');people.className='gt-people';
  const ctl=document.createElement('div');ctl.className='gt-ctl';
  const list=document.createElement('ol');list.setAttribute('aria-live','off');
  el.append(h,line,people);
  if(S.host()){
    const toggle=(label,get,set)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{set(!get());paint()};
      const paint=()=>b.setAttribute('aria-pressed',String(!!get()));paint();return b};
    ctl.append(
      toggle('Viewer omens',()=>S.settings().viewersEnabled,v=>S.control('host','set',{key:'viewersEnabled',value:v})),
      toggle('Chaos omens',()=>SESSION.chaos(),v=>S.control('host','chaos',{on:v})),
      toggle('AI seats',()=>S.settings().aiEnabled,v=>S.control('host','set',{key:'aiEnabled',value:v})));
    el.append(ctl);
  }
  el.append(list);
  document.querySelector('.stage').appendChild(el);

  const describe=e=>{
    if(e.kind==='applied'){
      const a=e.args||{},r=e.result||{};
      if(e.action==='omen')return `${e.name}: ${SESSION.OMENS[a.kind].icon} ${a.kind} → ${r.kingdom}`;
      if(e.action==='decree'||e.action==='edict')return `${e.name}: ${r.move.replace('_',' ')}${r.target?' → '+r.target:''} (${r.kingdom})`;
      return `${e.name}: ${e.action}${r.kingdom?' ('+r.kingdom+')':''}`;
    }
    if(e.kind==='refused'&&e.role!=='viewer')return {no:true,t:`${e.name||'?'}: ${e.action} refused, ${e.reasons[0]}`};
    if(e.kind==='control')return `Host: ${e.cmd} ${JSON.stringify(e.args)}`;
    return null;
  };
  let refusedViewers=0;
  S.on('refused',e=>{if(e.member&&e.member.role==='viewer')refusedViewers++});
  setInterval(()=>{
    const s=S.status();
    line.textContent=s.line;
    people.textContent=`${s.people} · viewer budget left ${S.budgetLeft()} · ${refusedViewers} viewer taps refused (cooldown or full)`;
    list.replaceChildren(...S.log(60).map(describe).filter(Boolean).slice(0,10).map(d=>{
      const li=document.createElement('li');if(d.no){li.className='gt-no';li.textContent=d.t}else li.textContent=d;return li}));
  },500);
  window.gtSession=S; /* for the console */
})();
