"use strict";
/* ============ The Biosphere Realm on the GameTime session engine ============
   The adapter that plugs this game into games/engine (GTEngine): who can do what in a shared,
   streamed world.

   - Host (optional, the streamer): plays with the whole power tray as usual, and holds the
     session controls: viewer omens on or off, chaos omens on or off, AI seats on or off, mute,
     kick, block. The host can also issue an edict for any kingdom.
   - Players: each rules one kingdom, with the same moves Claude has as a ruler (ruler.js):
     war, peace, alliances, villages, patronage, plus a festival. One decree a year.
   - AIs: rule a kingdom like a player, with the same menu and checks. Any decide() works:
     the local ruler below (no model, offline), or Claude through the ruler bridge.
   - Viewers: send an omen to a kingdom they name from a list (rain, harvest, festival, a herd;
     lightning only when the host allows chaos). Viewers pick WHERE, never WHEN, so a stream a
     few seconds behind can't make an omen miss, and they can't type anything onto the stream.

   The engine applies actions between simulation steps (ui.js calls SESSION.tick()), checks
   each one when it is sent and again when it is applied, and keeps viewer impact the same at
   any audience size. Try it locally: index.html?session&players=2&ai=2&viewers=40&host */
const SESSION=(()=>{
  if(typeof GTEngine==='undefined')return {tick(){},live:null};
  const MONTH=YEAR/12;
  const MOVES=Object.keys(RULER.ACTIONS).filter(k=>k!=='wait');
  const OMENS={
    rain:{icon:'🌧️',desc:'Rain falls on the kingdom: more food.'},
    harvest:{icon:'🌾',desc:'A bountiful harvest fills the stores.'},
    festival:{icon:'🎉',desc:'The kingdom celebrates its god: devotion and its people’s gift.'},
    herd:{icon:'🐑',desc:'A herd of animals wanders in near the capital.'},
    lightning:{icon:'⚡',desc:'Lightning strikes the wilds near the kingdom (chaos: only when the host allows it).',chaos:true},
  };
  const seats=new Map(); /* tribe id -> member id */
  let worldRef=null,chaosOmens=false;

  const alive=T=>T&&T.alive&&T.pop>0;
  const tribeOf=ctx=>ctx.seat&&ctx.seat.tribe!=null&&tribes[ctx.seat.tribe]&&tribes[ctx.seat.tribe].title===ctx.seat.title?tribes[ctx.seat.tribe]:null;
  const byTitle=t=>tribes.find(T=>alive(T)&&T.title===t)||null;
  const titles=()=>tribes.filter(alive).map(T=>T.title);
  const freeTitles=()=>tribes.filter(T=>alive(T)&&!seats.has(T.id)&&!T.claude).map(T=>T.title);
  const seatFor=T=>({tribe:T.id,title:T.title,people:RACES[T.race].plural});
  const paused=()=>typeof speed!=='undefined'&&speed===0&&!(typeof warpLeft!=='undefined'&&warpLeft>0);
  const verbs={declare_war:t=>`march to war against the ${t}`,make_peace:t=>`make peace with the ${t}`,form_alliance:t=>`stand allied with the ${t}`,
    break_alliance:t=>`break faith with the ${t}`,found_village:()=>'send families to found a new village',patronize_arts:()=>'honor its artists and priests'};
  /* a decree names only what the report names, so a default one is built from the kingdom's own names */
  const defaultDecree=(move,target)=>`Hear the will of the realm: we ${verbs[move](target)}.`;

  function decision(T,args){
    return {action:args.move,target:args.target||null,decree:(args.decree&&args.decree.trim())||defaultDecree(args.move,args.target)};
  }
  function rule(T,args,who){
    const d=decision(T,args);
    log(`👑 ${who} decrees for the ${T.title}: “${d.decree}”`,[236,196,96],false,newsAt(T,'👑',1));
    RULER.apply(T,d);RULER.remember(T,d,true,`by ${who}`);
    return {kingdom:T.title,move:d.action,target:d.target};
  }
  const decreeArgs=targets=>({
    move:{type:'enum',values:MOVES},
    target:{type:'enum',optional:true,values:targets},
    decree:{type:'text',optional:true,max:RULER.DECREE_MAX},
  });
  const neighborTitles=ctx=>{const T=tribeOf(ctx);return T?RULER.situation(T).neighbors.map(n=>n.name):[]};

  const GAME={
    id:'the-biosphere-realm',
    name:'The Biosphere Realm',
    clockUnit:'months',
    now:()=>step/MONTH,
    roles:{host:{max:1},player:{max:6},viewer:{max:Infinity},ai:{max:6,actsAs:'player'}},
    settings:{viewerCooldownMs:5000,viewerBudget:{count:4,perMs:20000},queueMax:8,aiTurnMs:12000},

    onJoin(ctx,req){
      const role=ctx.actor.role;
      if(role!=='player'&&role!=='ai')return {};
      const T=req.kingdom?byTitle(req.kingdom):tribes.find(t=>freeTitles().includes(t.title));
      if(!T)return {errors:[req.kingdom?`there is no kingdom called "${req.kingdom}"`:'every kingdom already has a ruler']};
      if(seats.has(T.id)||T.claude)return {errors:[`the ${T.title} already has a ruler`]};
      seats.set(T.id,ctx.actor.id);
      log(`${ctx.actor.name} now rules the ${T.title}.`,T.color);
      return {seat:seatFor(T)};
    },
    onLeave(ctx){const T=tribeOf(ctx);if(T&&seats.get(T.id)===ctx.actor.id)seats.delete(T.id)},

    actions:{
      decree:{
        roles:['player'],hostToo:false,
        desc:'Rule your kingdom: one move a year (war, peace, alliances, a new village, patronage).',
        args:decreeArgs(neighborTitles),
        cooldownGame:{player:12},
        available(ctx){const T=tribeOf(ctx);return !T?['you have no kingdom; claim one']:!alive(T)?['your kingdom has fallen; claim another']:[]},
        check(ctx,a){const T=tribeOf(ctx);if(!alive(T))return [];return RULER.checkDecision(decision(T,a),RULER.situation(T))},
        apply:(ctx,a)=>rule(tribeOf(ctx),a,ctx.actor.name),
      },
      rite:{
        roles:['player'],hostToo:false,
        desc:'Hold a festival for your god (every two years).',
        cooldownGame:{player:24},
        available(ctx){const T=tribeOf(ctx);return !alive(T)?['you have no living kingdom']:T.food<6?['your stores are too empty for a festival']:[]},
        apply(ctx){const T=tribeOf(ctx);festival(T);return {kingdom:T.title}},
      },
      claim:{
        roles:['player'],hostToo:false,
        desc:'Take up a kingdom no one rules (when you have none, or yours has fallen).',
        args:{kingdom:{type:'enum',values:freeTitles}},
        immediate:true,
        available(ctx){return alive(tribeOf(ctx))?['you already rule a kingdom']:[]},
        apply(ctx,a){
          const T=byTitle(a.kingdom),old=tribeOf(ctx);
          if(old&&seats.get(old.id)===ctx.actor.id)seats.delete(old.id);
          seats.set(T.id,ctx.actor.id);
          ctx.setSeat(seatFor(T));
          log(`${ctx.actor.name} now rules the ${T.title}.`,T.color);
          return {kingdom:T.title};
        },
      },
      omen:{
        roles:['viewer'],
        desc:'Send an omen to a kingdom.',
        args:{kind:{type:'enum',values:()=>Object.keys(OMENS).filter(k=>chaosOmens||!OMENS[k].chaos)},kingdom:{type:'enum',values:titles}},
        available:()=>paused()?['the world is paused']:[],
        apply(ctx,a){
          const T=byTitle(a.kingdom),who=ctx.actor.name,O=OMENS[a.kind];
          const near=(r0,r1)=>{for(let k=0;k<30;k++){const ang=R()*6.283,r=r0+R()*(r1-r0),x=(T.cx+Math.cos(ang)*r)|0,y=(T.cy+Math.sin(ang)*r)|0;if(inb(x,y)&&walk(y*W+x)&&(a.kind!=='lightning'||own[y*W+x]!==T.id))return {x:x+.5,y:y+.5}}return null};
          switch(a.kind){
            case 'rain':setWeather('rain');T.food+=6;break;
            case 'harvest':T.food+=10;break;
            case 'festival':festival(T);break;
            case 'herd':{const p=near(3,9);if(p)spawnAt(p,pick(['sheep','deer','horse']));break}
            case 'lightning':{const p=near(10,18);if(p)strike(p);break}
          }
          log(`${O.icon} ${who} sent ${a.kind==='herd'?'a herd':a.kind} to the ${T.title}.`,T.color,false,newsAt(T,O.icon,1));
          return {kingdom:T.title,omen:a.kind};
        },
      },
      edict:{
        roles:['host'],
        desc:'The host decides a move for any kingdom.',
        args:{kingdom:{type:'enum',values:titles},...decreeArgs(ctx=>titles())},
        check(ctx,a){const T=byTitle(a.kingdom);return T?RULER.checkDecision(decision(T,a),RULER.situation(T)):[]},
        apply:(ctx,a)=>rule(byTitle(a.kingdom),a,'The host'),
      },
    },

    controls:{
      chaos(ctx,a){chaosOmens=!!a.on;return []},
    },

    observe(ctx){
      const T=tribeOf(ctx),role=ctx.actor?ctx.actor.role:null;
      if((role==='player'||role==='ai')&&alive(T))return RULER.situation(T);
      return {
        year:year(),
        kingdoms:tribes.filter(alive).map(K=>({name:K.title,people:RACES[K.race].plural,population:K.pop,era:AGE_NAME[K.age|0],ruledBy:seats.has(K.id)?'a player':K.claude?'Claude':null})),
        wars:wars.map(w=>`${tribes[w.a].title} vs ${tribes[w.b].title}`),
        omens:Object.keys(OMENS).filter(k=>chaosOmens||!OMENS[k].chaos),
      };
    },
    /* the one line a viewer who swipes in reads first (decision 012) */
    status(){
      const live=tribes.filter(alive).sort((a,b)=>b.pop-a.pop);
      if(!live.length)return `Year ${year()} · the world waits for its first people`;
      const top=live[0],w=wars[0];
      return [`Year ${year()}`,`${live.length} kingdoms`,`largest: the ${top.title} (${top.pop})`,
        w?`war: ${tribes[w.a].title} vs ${tribes[w.b].title}${wars.length>1?` (+${wars.length-1})`:''}`:'at peace'].join(' · ');
    },
    onTick(ctx){
      /* a new or loaded world: every seat is released, and rulers claim a kingdom again */
      if(worldRef&&worldRef!==tribes){
        seats.clear();
        for(const m of ctx.session.members())if(m.seat)ctx.session.setSeat(m.id,null);
        log('A new world: every ruler must claim a kingdom again.',[170,150,190]);
      }
      worldRef=tribes;
    },
  };

  /* ---------- AI rulers: decide() functions for GTEngine.createAIDriver ---------- */
  /* plays offline with no model: a cautious ruler that reads its situation report */
  function localRuler(req){
    const s=req.observation,ready=req.menu.find(m=>m.action==='decree');
    if(!s||!s.neighbors||!ready||!ready.ready)return {action:'wait'};
    const nb=s.neighbors,me=s.soldiers;
    const go=(move,target)=>({action:'decree',args:target?{move,target}:{move}});
    const tried=new Set((req.errors||[]).length&&req.last?[JSON.parse(req.last).args.move]:[]);
    const options=[];
    const losing=nb.filter(n=>n.atWar&&n.soldiers>me*1.3).sort((a,b)=>b.soldiers-a.soldiers)[0];
    if(losing)options.push(go('make_peace',losing.name));
    if(s.canSettle&&s.food>30)options.push(go('found_village'));
    if(s.stability<45||s.devotion<30)options.push(go('patronize_arts'));
    const friend=nb.filter(n=>!n.atWar&&!n.allied&&n.sameFaith).sort((a,b)=>b.population-a.population)[0];
    if(friend)options.push(go('form_alliance',friend.name));
    const prey=nb.filter(n=>!n.atWar&&!n.allied&&!n.sameFaith&&me>=4&&n.soldiers*1.6<me).sort((a,b)=>a.soldiers-b.soldiers)[0];
    if(prey)options.push(go('declare_war',prey.name));
    options.push(go('patronize_arts'));
    return options.find(o=>!tried.has(o.args.move))||{action:'wait'};
  }
  /* Claude through the ruler bridge (tools/ruler-bridge in SudipKing/The-Biosphere-Realm) */
  async function bridgeRuler(req){
    if(!req.observation||!req.observation.neighbors)return {action:'wait'};
    const r=await fetch(RULER.status.url+'/decide',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({situation:req.observation,last:req.last,errors:req.errors&&req.errors.length?req.errors:null})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||`the bridge answered ${r.status}`);
    const p=CHRON.parseReply(j.text);
    if(!p.ok)return j.text;
    const d=p.value;
    if(d.action==='wait')return {action:'wait'};
    return {action:'decree',args:{move:d.action,...(d.target?{target:d.target}:{}),...(d.decree?{decree:d.decree}:{})}};
  }

  /* ---------- sessions ---------- */
  /* one live session per page: ui.js ticks it between simulation steps */
  function create(opts={}){
    seats.clear();chaosOmens=false;worldRef=tribes;
    return api.live=GTEngine.createSession(GAME,opts);
  }

  const api={GAME,OMENS,create,localRuler,bridgeRuler,live:null,
    tick(){if(api.live)try{api.live.tick()}catch(e){if(typeof reportErr==='function')reportErr(e,'session')}},
    chaos:()=>chaosOmens};
  return api;
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SESSION;
