"use strict";
/* ============ GameTime session engine ============
   One set of rules for every GameTime game: who is in a session (an optional host, players,
   viewers and AIs), what each of them may do, and how their actions reach the game fairly.

   The engine never draws, never networks and never runs a model. A game plugs in with an
   adapter (its actions, what each role sees, a one-line status); a transport (Supabase
   Realtime in production, a local loop in dev and tests) feeds `submit()` and listens to
   events; an AI driver turns any `decide()` function (a model, a bridge, a scripted bot)
   into a seat that plays by the same rules as a person.

   Plain JavaScript with no dependencies: a classic <script> sets `window.GTEngine`, and
   Node's require() gets the same object. See games/engine/README.md for the rules. */
(function (root, factory) {
  const E = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  else root.GTEngine = E;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = '0.1.0';
  const ROLES = ['host', 'player', 'viewer', 'ai'];

  /* Seats per role. A game may lower the limits; the host stays optional in every game. */
  const DEFAULT_ROLES = {
    host: { max: 1 },
    player: { max: 4 },
    viewer: { max: Infinity },
    ai: { max: 4, actsAs: 'player' },
  };

  /* The house rules. Every game gets these; a game's adapter can change the values, and the
     host can change the ones marked live. Times are milliseconds of real time. */
  const HOUSE_RULES = {
    viewersEnabled: true, // live: the host can switch viewer actions off
    aiEnabled: true, // live: the host can pause every AI seat
    anonymousCanAct: false, // signed-out viewers watch but never act (decision 010)
    viewerCooldownMs: 4000, // per viewer, between any two actions
    viewerBudget: { count: 6, perMs: 30000 }, // all viewers together: the audience size never changes difficulty
    queueMax: 8, // accepted actions waiting for the next tick; more are refused as "full"
    aiTurnMs: 15000, // how often an AI seat is asked for a move
    aiRetries: 2, // a refused AI move goes back to it with the reasons, this many times
    textMax: 240, // the longest free text (an AI's decree, a host's note)
    viewerText: false, // viewers never send free text: only names the game already knows reach the stream
    logKeep: 200,
    logViewerRefusals: false, // refused viewer taps are events, not log entries

  };
  const LIVE_SETTINGS = new Set(['viewersEnabled', 'aiEnabled', 'viewerCooldownMs', 'viewerBudget', 'queueMax', 'aiTurnMs']);

  /* ---------- small helpers ---------- */
  const isFn = (f) => typeof f === 'function';
  const plain = (o) => o != null && typeof o === 'object' && !Array.isArray(o);
  const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const say = (list) => list.filter(Boolean);

  function checkAdapter(game) {
    const errors = [];
    if (!plain(game)) return ['the game adapter must be an object'];
    if (typeof game.id !== 'string' || !game.id) errors.push('the adapter needs an "id"');
    if (!plain(game.actions) || !Object.keys(game.actions).length) errors.push('the adapter needs at least one action');
    for (const [name, a] of Object.entries(game.actions || {})) {
      if (!Array.isArray(a.roles) || !a.roles.length) errors.push(`action "${name}" needs "roles"`);
      else for (const r of a.roles) if (!ROLES.includes(r)) errors.push(`action "${name}" names an unknown role "${r}"`);
      if (!isFn(a.apply)) errors.push(`action "${name}" needs an apply() function`);
    }
    for (const r of Object.keys(game.roles || {})) if (!ROLES.includes(r)) errors.push(`unknown role "${r}" in roles`);
    return errors;
  }

  /* ---------- the session ---------- */
  function createSession(game, opts = {}) {
    const bad = checkAdapter(game);
    if (bad.length) throw new Error(`GTEngine: ${bad.join('; ')}`);

    const roles = {};
    for (const r of ROLES) roles[r] = { ...DEFAULT_ROLES[r], ...((game.roles || {})[r] || {}) };
    roles.host.max = Math.min(1, roles.host.max);

    const settings = { ...HOUSE_RULES, ...(game.settings || {}), ...(opts.settings || {}) };
    const now = isFn(opts.now) ? opts.now : () => Date.now();
    const gameNow = isFn(game.now) ? () => game.now() : now;

    const members = new Map(); // id -> member
    const blocked = new Set(); // ids that may not rejoin
    const queue = []; // accepted actions waiting for tick()
    const log = []; // newest first
    const listeners = new Map();
    const lastAct = new Map(); // `${id}|${action}` and `${id}|*` -> {real, game}
    const budget = []; // real times of accepted viewer actions, for the global budget
    const drivers = new Map(); // ai id -> driver
    let seq = 0;

    const emit = (type, data) => {
      const ev = { type, at: now(), ...data };
      for (const key of [type, '*']) for (const fn of listeners.get(key) || []) {
        try { fn(ev); } catch (e) { if (typeof console !== 'undefined') console.error('GTEngine listener', e); }
      }
      return ev;
    };
    const remember = (entry) => {
      log.unshift({ seq: ++seq, at: now(), ...entry });
      if (log.length > settings.logKeep) log.length = settings.logKeep;
    };

    const host = () => [...members.values()].find((m) => m.role === 'host') || null;
    /* the roles a member's actions are checked against: an AI also holds the role it stands in for */
    const actsAs = (m) => (m.role === 'ai' ? ['ai', roles.ai.actsAs].filter(Boolean) : [m.role]);
    const viewerLike = (m) => actsAs(m).includes('viewer');
    /* what a game's hooks get: who is acting, their seat (game data such as "rules kingdom 3"), and a way to move that seat */
    const ctxFor = (m) => ({
      session: api, actor: m ? publicMember(m) : null, seat: m ? m.seat : null, settings: { ...settings }, now: now(), gameNow: gameNow(),
      setSeat: (seat) => { if (m) m.seat = seat; },
    });

    function publicMember(m) {
      return { id: m.id, name: m.name, role: m.role, kind: m.kind, anonymous: m.anonymous, muted: m.muted, seat: clone(m.seat) };
    }

    /* ---- joining and leaving ---- */
    function join(req = {}) {
      const { id, role } = req;
      const name = typeof req.name === 'string' && req.name.trim() ? req.name.trim().slice(0, 40) : String(id);
      const errors = [];
      if (id == null || id === '') errors.push('a member needs an id');
      if (!ROLES.includes(role)) errors.push(`"${role}" is not a role; use one of ${ROLES.join(', ')}`);
      if (errors.length) return refuse(null, 'join', errors);
      if (blocked.has(id)) return refuse(null, 'join', ['the host has blocked this member']);
      if (members.has(id)) return refuse(null, 'join', ['already in this session']);
      const anonymous = !!req.anonymous;
      if (anonymous && role !== 'viewer') return refuse(null, 'join', ['only viewers may join signed out']);
      const taken = [...members.values()].filter((m) => m.role === role).length;
      if (taken >= roles[role].max) return refuse(null, 'join', [roles[role].max === 0 ? `this game has no ${role} seats` : `all ${roles[role].max} ${role} seats are taken`]);
      const m = { id, name, role, kind: role === 'ai' ? 'ai' : 'human', anonymous, muted: false, seat: null, joinedAt: now() };
      if (isFn(game.onJoin)) {
        const r = game.onJoin(ctxFor(m), req) || {};
        if (r.errors && r.errors.length) return refuse(null, 'join', r.errors);
        m.seat = r.seat || null;
      }
      members.set(id, m);
      remember({ kind: 'join', who: id, name, role });
      emit('join', { member: publicMember(m) });
      return { ok: true, member: publicMember(m) };
    }

    function leave(id, why = 'left') {
      const m = members.get(id);
      if (!m) return false;
      if (isFn(game.onLeave)) game.onLeave(ctxFor(m));
      members.delete(id);
      drivers.delete(id);
      for (let i = queue.length - 1; i >= 0; i--) if (queue[i].who === id) queue.splice(i, 1);
      remember({ kind: 'leave', who: id, name: m.name, role: m.role, why });
      emit('leave', { member: publicMember(m), why });
      return true;
    }

    /* ---- the arguments an action takes ----
       {type:'enum', values:[...] | ctx => [...]}: one of a known list (names the game already knows)
       {type:'int', min, max}
       {type:'text', max}: free text, which viewers may never send unless settings.viewerText
       {optional:true}: may be left out */
    function checkArgs(m, spec, args) {
      const errors = [];
      if (!spec) return errors;
      if (!plain(args)) return ['"args" must be an object'];
      for (const k of Object.keys(args)) if (!(k in spec)) errors.push(`"${k}" is not an argument of this action`);
      for (const [k, s] of Object.entries(spec)) {
        const v = args[k];
        if (v == null || v === '') { if (!s.optional) errors.push(`"${k}" is required`); continue; }
        if (s.type === 'enum') {
          const values = isFn(s.values) ? s.values(ctxFor(m)) : s.values || [];
          if (!values.includes(v)) errors.push(`"${v}" is not a valid ${k}; choose one of ${values.slice(0, 12).join(', ')}${values.length > 12 ? '…' : ''}`);
        } else if (s.type === 'int') {
          if (!Number.isInteger(v)) errors.push(`"${k}" must be a whole number`);
          else if ((s.min != null && v < s.min) || (s.max != null && v > s.max)) errors.push(`"${k}" must be from ${s.min} to ${s.max}`);
        } else if (s.type === 'text') {
          if (typeof v !== 'string') errors.push(`"${k}" must be text`);
          else if (viewerLike(m) && !settings.viewerText) errors.push('viewers cannot send free text');
          else if (v.length > (s.max || settings.textMax)) errors.push(`"${k}" must be at most ${s.max || settings.textMax} characters`);
          else if (/[<>]/.test(v)) errors.push(`"${k}" must be plain text`);
        } else errors.push(`"${k}" has an unknown type`);
      }
      return errors;
    }

    /* a per-role value from an action ({player: 3, viewer: 1}); an AI uses the value of the role it stands in for */
    const perRole = (map, m) => (!map ? undefined : map[m.role] != null ? map[m.role] : m.role === 'ai' ? map[roles.ai.actsAs] : undefined);

    /* how long this member must still wait before using this action: real ms and game time ({ms:0, game:0}: ready) */
    function waitFor(m, name, a) {
      const tReal = now(), tGame = gameNow();
      const last = lastAct.get(`${m.id}|${name}`), lastAny = lastAct.get(`${m.id}|*`);
      let ms = 0, gameLeft = 0;
      const own = perRole(a.cooldownMs, m);
      if (own && last) ms = Math.max(ms, last.real + own - tReal);
      if (viewerLike(m) && settings.viewerCooldownMs && lastAny) ms = Math.max(ms, lastAny.real + settings.viewerCooldownMs - tReal);
      const g = perRole(a.cooldownGame, m);
      if (g && last) gameLeft = Math.max(0, last.game + g - tGame);
      return { ms: Math.max(0, ms), game: gameLeft };
    }
    const waitText = (w) => say([w.ms > 0 && `${Math.ceil(w.ms / 1000)} s`, w.game > 0 && `${Math.ceil(w.game)} ${game.clockUnit || 'game ticks'}`]).join(' and ');
    const isWaiting = (w) => w.ms > 0 || w.game > 0;
    const mayUse = (m, a) => a.roles.some((r) => actsAs(m).includes(r)) || (m.role === 'host' && a.hostToo !== false);

    function budgetLeft() {
      const b = settings.viewerBudget;
      if (!b || !b.count) return Infinity;
      const since = now() - b.perMs;
      while (budget.length && budget[0] <= since) budget.shift();
      return b.count - budget.length;
    }

    /* every reason this member may not use this action right now (empty: allowed) */
    function blockers(m, name, args, { forApply = false, forMenu = false } = {}) {
      const a = game.actions[name];
      if (!m) return ['not in this session'];
      if (!a) return [`"${name}" is not an action; choose one of ${Object.keys(game.actions).join(', ')}`];
      if (!mayUse(m, a)) return [`a ${m.role} cannot use "${name}"`];
      const errors = [];
      if (m.muted) errors.push('the host has muted you');
      if (m.anonymous && !settings.anonymousCanAct) errors.push('sign in to take part');
      if (m.role === 'viewer' && !settings.viewersEnabled) errors.push('the host has switched viewer actions off');
      if (m.role === 'ai' && !settings.aiEnabled) errors.push('the host has paused the AI seats');
      if (errors.length) return errors;
      if (!forMenu) {
        const argErrors = checkArgs(m, a.args, args || {});
        if (argErrors.length) return argErrors;
      }
      if (!forApply) {
        const w = waitFor(m, name, a);
        if (isWaiting(w)) errors.push(`cooling down: wait ${waitText(w)}`);
        if (viewerLike(m) && budgetLeft() <= 0) errors.push('full: the audience has used every action for now');
        if (queue.length >= settings.queueMax) errors.push('full: too many actions are waiting');
      }
      /* available(ctx): may this seat use the action at all right now (no arguments needed)?
         check(ctx, args): is this exact move legal? Both return a list of reasons, as sentences. */
      if (isFn(a.available)) errors.push(...say(a.available(ctxFor(m)) || []));
      if (!forMenu && isFn(a.check)) errors.push(...say(a.check(ctxFor(m), args || {}) || []));
      return errors;
    }

    function refuse(m, name, reasons, extra = {}) {
      const r = { ok: false, status: 'refused', action: name, reasons };
      /* a busy audience is refused all the time (cooldowns, a full budget): those still go out as events, but stay
         out of the log, so they never push what actually happened out of it */
      const noise = m && m.role === 'viewer' && !settings.logViewerRefusals && !extra.late;
      if (!noise) remember({ kind: 'refused', who: m ? m.id : null, name: m ? m.name : null, role: m ? m.role : null, action: name, reasons });
      emit('refused', { member: m ? publicMember(m) : null, action: name, reasons, ...extra });
      return r;
    }

    /* ---- acting ---- */
    function submit(id, name, args = {}) {
      const m = members.get(id);
      const reasons = blockers(m, name, args);
      if (reasons.length) return refuse(m, name, reasons);
      const a = game.actions[name];
      const t = { real: now(), game: gameNow() };
      lastAct.set(`${m.id}|${name}`, t);
      lastAct.set(`${m.id}|*`, t);
      if (viewerLike(m)) budget.push(t.real);
      const item = { n: ++seq, who: m.id, action: name, args: clone(args), at: t.real };
      if (a.immediate) return applyItem(item);
      queue.push(item);
      emit('queued', { member: publicMember(m), action: name, args: clone(args), position: queue.length });
      return { ok: true, status: 'queued', action: name, position: queue.length };
    }

    function applyItem(item) {
      const m = members.get(item.who);
      /* the world moved on since the action was accepted: check it again against the world as it is now */
      const late = blockers(m, item.action, item.args, { forApply: true });
      if (late.length) return refuse(m, item.action, late.map((r) => `too late: ${r}`), { late: true });
      let result;
      try { result = game.actions[item.action].apply(ctxFor(m), item.args); }
      catch (e) { return refuse(m, item.action, [`the game could not do it: ${e.message}`]); }
      remember({ kind: 'applied', who: m.id, name: m.name, role: m.role, action: item.action, args: item.args, result: clone(result) });
      emit('applied', { member: publicMember(m), action: item.action, args: clone(item.args), result: clone(result) });
      return { ok: true, status: 'applied', action: item.action, result };
    }

    /* call between simulation steps, never inside one: applies waiting actions and asks AIs that are due */
    function tick() {
      const out = [];
      while (queue.length) out.push(applyItem(queue.shift()));
      if (settings.aiEnabled) for (const d of drivers.values()) d.maybeTurn();
      if (isFn(game.onTick)) game.onTick(ctxFor(null));
      return out;
    }

    /* ---- the host's controls ----
       With a host, only the host may use them. Without one, the game itself (id null) may, so a
       stream with no host still runs on the game's defaults. */
    const CONTROLS = {
      set: (args) => {
        if (!LIVE_SETTINGS.has(args.key)) return [`"${args.key}" cannot be changed during a session`];
        settings[args.key] = args.value;
        return [];
      },
      mute: (args) => { const m = members.get(args.id); if (!m) return ['no such member']; if (m.role === 'host') return ['the host cannot be muted']; m.muted = true; return []; },
      unmute: (args) => { const m = members.get(args.id); if (!m) return ['no such member']; m.muted = false; return []; },
      kick: (args) => { const m = members.get(args.id); if (!m) return ['no such member']; if (m.role === 'host') return ['the host cannot be removed']; leave(args.id, 'removed by the host'); return []; },
      block: (args) => { const m = members.get(args.id); if (m && m.role === 'host') return ['the host cannot be blocked']; blocked.add(args.id); if (m) leave(args.id, 'blocked by the host'); return []; },
      unblock: (args) => { blocked.delete(args.id); return []; },
    };
    function control(id, cmd, args = {}) {
      const h = host();
      if (h ? id !== h.id : id != null) return refuse(members.get(id), `control:${cmd}`, [h ? 'only the host can do that' : 'only the game can do that while there is no host']);
      const fn = CONTROLS[cmd] || (game.controls && game.controls[cmd] && ((a) => game.controls[cmd](ctxFor(h), a) || []));
      if (!fn) return refuse(h, `control:${cmd}`, [`"${cmd}" is not a control`]);
      const errors = fn(args);
      if (errors.length) return refuse(h, `control:${cmd}`, errors);
      remember({ kind: 'control', who: id, cmd, args: clone(args) });
      emit('control', { cmd, args: clone(args), by: id });
      return { ok: true, status: 'done', cmd };
    }

    /* ---- what each member can see and do ---- */
    function menu(id) {
      const m = members.get(id);
      if (!m) return [];
      return Object.entries(game.actions)
        .filter(([, a]) => mayUse(m, a))
        .map(([name, a]) => {
          const reasons = blockers(m, name, null, { forMenu: true });
          const args = {};
          for (const [k, s] of Object.entries(a.args || {})) args[k] = { ...s, values: isFn(s.values) ? s.values(ctxFor(m)) : s.values };
          return { action: name, desc: a.desc || '', args, ready: !reasons.length, reasons };
        });
    }
    const observe = (id) => {
      const m = members.get(id);
      return isFn(game.observe) ? game.observe(ctxFor(m)) : {};
    };
    /* the one line that tells someone who swipes in what is going on (decision 012) */
    function status() {
      const count = (r) => [...members.values()].filter((m) => m.role === r).length;
      const people = say([host() ? `host ${host().name}` : 'no host', `${count('player')} playing`, count('ai') && `${count('ai')} AI`, `${count('viewer')} watching`]).join(' · ');
      return { line: isFn(game.status) ? game.status(ctxFor(null)) : game.name || game.id, people };
    }

    const api = {
      game: game.id,
      version: VERSION,
      roles: clone(roles),
      join, leave, submit, tick, control, menu, observe, status,
      on(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); return () => listeners.get(type).delete(fn); },
      member: (id) => (members.has(id) ? publicMember(members.get(id)) : null),
      members: (role) => [...members.values()].filter((m) => !role || m.role === role).map(publicMember),
      host: () => (host() ? publicMember(host()) : null),
      settings: () => ({ ...settings }),
      log: (n = 20) => clone(log.slice(0, n)),
      pending: () => clone(queue),
      budgetLeft,
      /* for the game only (a new world releases every seat); never wire this to a transport */
      setSeat(id, seat) { const m = members.get(id); if (m) m.seat = seat; },
      attachAI(id, driver) { drivers.set(id, driver); },
    };
    return api;
  }

  /* ---------- AI seats ----------
     An AI is a member like any other. Its driver asks decide() for a move, with the same menu
     and view a person in that seat would get, plus the reasons its last move was refused.
     decide(request) may return {action, args}, a JSON string of that, or a promise of either.
     The engine checks every move, twice: when it is made and again when it is applied. */
  function createAIDriver(session, id, opts = {}) {
    if (!isFn(opts.decide)) throw new Error('GTEngine: an AI driver needs a decide() function');
    const now = isFn(opts.now) ? opts.now : () => Date.now();
    let busy = false;
    let lastTurn = -Infinity;
    const history = [];

    function parse(reply) {
      if (plain(reply)) return { ok: true, value: reply };
      if (typeof reply !== 'string') return { ok: false, error: 'the reply must be a JSON object' };
      const m = reply.match(/\{[\s\S]*\}/);
      if (!m) return { ok: false, error: 'the reply has no JSON object in it' };
      try { return { ok: true, value: JSON.parse(m[0]) }; } catch (e) { return { ok: false, error: `the JSON does not parse: ${e.message}` }; }
    }

    async function turn() {
      if (busy) return { ok: false, status: 'busy' };
      busy = true;
      lastTurn = now();
      try {
        const retries = session.settings().aiRetries;
        let errors = [];
        let last = null;
        for (let n = 0; n <= retries; n++) {
          const member = session.member(id);
          if (!member) return { ok: false, status: 'gone' };
          const request = {
            game: session.game,
            you: member,
            rules: RULES_FOR_AI,
            menu: session.menu(id),
            observation: session.observe(id),
            last,
            errors,
          };
          const reply = await opts.decide(request);
          if (!session.member(id)) return { ok: false, status: 'gone' };
          const p = parse(reply);
          if (!p.ok) { errors = [p.error]; last = typeof reply === 'string' ? reply : JSON.stringify(reply); continue; }
          const d = p.value;
          if (d.action == null || d.action === 'wait') { history.unshift({ at: now(), action: 'wait' }); return { ok: true, status: 'waited' }; }
          const r = session.submit(id, d.action, d.args || {});
          history.unshift({ at: now(), action: d.action, args: d.args, result: r.status, reasons: r.reasons });
          if (r.ok) return r;
          errors = r.reasons;
          last = JSON.stringify(d);
        }
        return { ok: false, status: 'gave-up', reasons: errors };
      } catch (e) {
        history.unshift({ at: now(), action: 'error', reasons: [e.message] });
        return { ok: false, status: 'error', reasons: [e.message] };
      } finally {
        busy = false;
        if (history.length > 20) history.length = 20;
      }
    }

    const driver = {
      turn,
      history: () => clone(history),
      busy: () => busy,
      /* called from session.tick(): starts a turn when one is due; it finishes later, between ticks */
      maybeTurn() {
        const every = opts.everyMs != null ? opts.everyMs : session.settings().aiTurnMs;
        if (!busy && now() - lastTurn >= every) turn();
      },
    };
    session.attachAI(id, driver);
    return driver;
  }

  /* what every AI is told, in every game */
  const RULES_FOR_AI = [
    'You hold one seat in a live, streamed game. Choose ONE move per turn from "menu", or wait.',
    'Only moves marked ready can succeed. Arguments must use the exact values listed for them.',
    'If "errors" is not empty, your last move was refused for those reasons: choose again.',
    'Reply with only JSON: {"action": "<menu action or wait>", "args": {...}}',
  ].join('\n');

  return { VERSION, ROLES, DEFAULT_ROLES, HOUSE_RULES, RULES_FOR_AI, createSession, createAIDriver, checkAdapter };
});
