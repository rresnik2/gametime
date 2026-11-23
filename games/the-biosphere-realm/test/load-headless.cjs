'use strict';
/* Loads The Biosphere Realm headless in a Node vm, with a do-nothing DOM, so its real
   simulation can be tested without a browser. Rendering, audio and input become no-ops. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function stub(name = 'stub') {
  const store = {};
  const fn = function () { return proxy; };
  const proxy = new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
      if (k === 'toString' || k === 'valueOf') return () => '';
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      if (k in store) return store[k];
      if (k === 'length' || k === 'width' || k === 'height' || k === 'clientWidth' || k === 'clientHeight') return 0;
      if (k === 'data') return (store.data = new Uint8ClampedArray(4));
      if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains: () => false };
      if (k === 'style' || k === 'dataset') return (store[k] = {});
      if (k === 'children' || k === 'childNodes') return [];
      if (k === 'contains') return () => false;
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 });
      if (k === 'querySelectorAll' || k === 'getElementsByTagName') return () => [];
      if (k === 'createImageData' || k === 'getImageData') return (w = 1, h = 1) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, (w | 0) * (h | 0) * 4)) });
      if (k === 'measureText') return () => ({ width: 0 });
      return proxy;
    },
    set(t, k, v) { store[k] = v; return true; },
    apply() { return proxy; },
    construct() { return proxy; },
  });
  return proxy;
}

/** Returns a vm context with the whole game loaded (world generated, nothing rendering). */
function loadBiosphere({ root = path.join(__dirname, '..'), seed = 'gametime-test', extra = [] } = {}) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  const doc = stub('document');
  const ctx = {
    console, Math, Date, JSON, Promise, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => Date.now() },
    matchMedia: () => ({ matches: false, addEventListener() {} }), devicePixelRatio: 1, innerWidth: 1280, innerHeight: 800,
    addEventListener() {}, removeEventListener() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { search: '', hash: '', href: 'http://localhost/' }, navigator: { userAgent: 'node', clipboard: {} },
    document: doc, Image: function () { return stub(); }, OffscreenCanvas: function () { return stub(); },
    AudioContext: undefined, webkitAudioContext: undefined, fetch: undefined, ResizeObserver: function () { return { observe() {} }; },
    URLSearchParams, TextEncoder, TextDecoder, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Uint32Array, Float32Array, Int32Array, Map, Set, WeakMap,
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  ctx.location.search = `?seed=${encodeURIComponent(seed)}`;
  for (const f of [...files, ...extra]) {
    const file = path.isAbsolute(f) ? f : path.join(root, f);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  // a fixed seed, so every test run sees the same world
  vm.runInContext(`genWorld(${JSON.stringify(seed)})`, ctx);
  return { ctx, run: (code) => vm.runInContext(code, ctx) };
}

module.exports = { loadBiosphere };
