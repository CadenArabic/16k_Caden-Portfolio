/* ============================================================================
   effects.js — plain-JavaScript ports of React Bits effects (reactbits.dev,
   MIT + Commons Clause): Aurora, Blur Text, Count Up, Spotlight Card, Magnet,
   Click Spark, Card Swap and Logo Loop. Same look, no React, no build step.

   Every effect checks prefers-reduced-motion and falls back to a still state.
   ========================================================================= */

window.Effects = (function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---- Aurora: WebGL2 northern-lights band (shader from React Bits) ---- */

  const AURORA_VERT = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

  const AURORA_FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uStops[3];
uniform float uAmplitude;
uniform float uBlend;
uniform float uHeight;
uniform float uScale;
uniform float uGlow;
uniform vec3 uPointer;
uniform float uReveal;
uniform float uOpacity;
out vec4 outColor;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float smootherstep(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}
vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * 2.0;
  int i = int(min(floor(x), 1.0));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f);
  return mix(uStops[i], uStops[i + 1], f);
}
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec2 frag = gl_FragCoord.xy;
  float y = 1.0 - frag.y / uResolution.y;
  float u = frag.x / uResolution.x;
  float X = (frag.x - uResolution.x * 0.5) / uResolution.y;
  float t = uTime;
  float reach = uPointer.z * exp(-pow((X - uPointer.x) / 0.38, 2.0));
  vec3 glow = vec3(0.0);
  float cover = 0.0;
  for (int k = 0; k < 2; k++) {
    float layer = float(k);
    float seed = layer * 13.7;
    float pace = t * (1.0 - layer * 0.18);
    float warp = snoise(vec2(X * 0.45 * uScale + pace * 0.02 + seed, pace * 0.05 + seed));
    float wave = snoise(vec2(X * 0.75 * uScale + warp * 0.35 - pace * 0.03 + seed, pace * 0.07 - seed)) * 0.72
      + snoise(vec2(X * 1.6 * uScale + warp * 0.5 + pace * 0.04 - seed, pace * 0.1 + seed * 0.5)) * 0.28;
    float hem = uHeight + layer * 0.07 + wave * 0.15 * uAmplitude;
    hem += reach * 0.08 * (layer < 0.5 ? 1.0 : 0.4);
    hem = mix(-0.25, hem, uReveal);
    float soft = (0.04 + uBlend * 0.16) * (1.0 + layer * 0.9);
    float rise = hem - y;
    float body = pow(smootherstep(-soft - uGlow * 0.14, 0.26 + soft * 0.6, rise), 1.5 + uGlow * 0.6);
    float lobes = 0.86 + 0.14 * snoise(vec2(X * 0.9 * uScale - pace * 0.025 + seed, y * 0.3 + pace * 0.04));
    float alpha = body * lobes * (layer < 0.5 ? 1.0 : 0.32 / layer);
    alpha = clamp(alpha * (1.0 + reach * 0.25 * smootherstep(0.9, 0.0, abs(y - hem))), 0.0, 1.0);
    vec3 tint = ramp(u + 0.05 * sin(pace * 0.08 + layer * 2.3) + layer * 0.1 + max(rise, 0.0) * 0.05);
    glow = 1.0 - (1.0 - glow) * (1.0 - tint * alpha);
    cover = 1.0 - (1.0 - cover) * (1.0 - alpha);
  }
  float fade = smootherstep(0.0, 0.7, uReveal) * uOpacity;
  glow *= fade;
  cover *= fade;
  float dither = (hash(frag) - 0.5) / 255.0;
  outColor = vec4(glow + dither, clamp(cover + dither, 0.0, 1.0));
}`;

  function hexToRgb(hex) {
    const v = parseInt(hex.replace("#", ""), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }

  function aurora(canvas, opts = {}) {
    if (!canvas) return;
    const o = Object.assign({
      stops: ["#0A3A26", "#2FBF73", "#0D4F34"],
      amplitude: 1.1, blend: 0.6, height: 0.34, scale: 1, glow: 0.5, speed: 0.55, opacity: 0.55,
    }, opts);
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, AURORA_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, AURORA_FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPosition");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    const U = (n) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uResolution"), time: U("uTime"), stops: U("uStops"), amp: U("uAmplitude"), blend: U("uBlend"),
      height: U("uHeight"), scale: U("uScale"), glow: U("uGlow"), pointer: U("uPointer"), reveal: U("uReveal"), opacity: U("uOpacity"),
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const palette = new Float32Array(o.stops.slice(0, 3).flatMap(hexToRgb));
    const host = canvas.parentElement;
    const st = { clock: 0, px: 0, py: 0.5, reach: 0, reveal: reduce ? 1 : 0 };
    const pointer = { x: 0, y: 0, inside: false };
    let raf = 0, last = 0, visible = true, w = 1, h = 1;

    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, st.clock);
      gl.uniform3fv(u.stops, palette);
      gl.uniform1f(u.amp, o.amplitude);
      gl.uniform1f(u.blend, o.blend);
      gl.uniform1f(u.height, o.height);
      gl.uniform1f(u.scale, o.scale);
      gl.uniform1f(u.glow, o.glow);
      gl.uniform3f(u.pointer, st.px, st.py, st.reach);
      gl.uniform1f(u.reveal, 1 - Math.pow(1 - st.reveal, 3));
      gl.uniform1f(u.opacity, o.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      if (!reduce) st.clock += dt * o.speed;
      const engaged = pointer.inside && finePointer && !reduce;
      const follow = 1 - Math.exp(-dt / 0.6);
      if (engaged) {
        st.px += ((pointer.x - w / 2) / h - st.px) * follow;
        st.py += (pointer.y / h - st.py) * follow;
      }
      st.reach += ((engaged ? 1 : 0) - st.reach) * (1 - Math.exp(-dt / (engaged ? 0.9 : 1.4)));
      if (st.reveal < 1) st.reveal = Math.min(1, st.reveal + dt / 2.4);
      draw();
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

    const resize = () => {
      w = Math.max(1, host.clientWidth); h = Math.max(1, host.clientHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      draw(); wake();
    };

    new ResizeObserver(resize).observe(host);
    new IntersectionObserver((e) => { visible = e.some((x) => x.isIntersecting); if (visible) { last = 0; wake(); } }).observe(host);
    window.addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => { last = 0; wake(); });
    canvas.classList.add("is-live");
    resize();
  }

  /* ---- Blur Text: words fall in out of a blur, one at a time ----------- */

  function blurText(el) {
    if (!el || reduce || el.dataset.blurred) return;
    el.dataset.blurred = "1";
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) { walk(child); return; }
        if (child.nodeType !== 3 || !child.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement("span");
          s.className = "bw"; s.textContent = part; s.style.setProperty("--i", i++);
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      });
    };
    walk(el);
    el.classList.add("is-blurring");
  }

  /* ---- Count Up: numbers roll up from zero when they come into view ---- */

  function countUp(el, to, format, duration = 1700) {
    if (!el) return;
    const from = Number(el.dataset.value || 0);
    el.dataset.value = to;
    if (reduce || from === to || !Number.isFinite(to)) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = format(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---- Spotlight Card: light + lit rim that follow the cursor --------- */

  function spotlight() {
    if (!finePointer) return;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---- Magnet: buttons lean toward the cursor when it gets close ------ */

  function magnet(els, padding = 70, strength = 4) {
    if (reduce || !finePointer || !els.length) return;
    window.addEventListener("pointermove", (e) => {
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.abs(dx) < r.width / 2 + padding && Math.abs(dy) < r.height / 2 + padding;
        el.style.translate = near ? `${(dx / strength).toFixed(1)}px ${(dy / strength).toFixed(1)}px` : "";
      });
    }, { passive: true });
  }

  /* ---- Click Spark: a burst of lines from where you clicked ----------- */

  function clickSpark(canvas, color = "#5EF39A") {
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    const bursts = [];
    let raf = 0;
    const size = () => {
      const r = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * r; canvas.height = innerHeight * r;
      ctx.setTransform(r, 0, 0, r, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    const tick = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        const p = (now - burst.t) / 520;
        if (p >= 1) { bursts.splice(b, 1); continue; }
        const e = 1 - Math.pow(1 - p, 3);
        ctx.globalAlpha = 1 - Math.max(0, (p - 0.55) / 0.45);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round";
        burst.sparks.forEach((a) => {
          const d = 34 * e, len = 13 * Math.pow(1 - p, 1.6);
          ctx.beginPath();
          ctx.moveTo(burst.x + Math.cos(a) * d, burst.y + Math.sin(a) * d);
          ctx.lineTo(burst.x + Math.cos(a) * (d + len), burst.y + Math.sin(a) * (d + len));
          ctx.stroke();
        });
      }
      ctx.globalAlpha = 1;
      raf = bursts.length ? requestAnimationFrame(tick) : 0;
    };
    document.addEventListener("click", (e) => {
      if (!e.target.closest || !e.target.closest("[data-spark]")) return;
      const sparks = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4);
      bursts.push({ x: e.clientX, y: e.clientY, t: performance.now(), sparks });
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  /* ---- Card Swap: a 3D deck where the front card drops to the back ---- */

  function cardSwap(root, { delay = 4200, dx = 44, dy = 40, dz = 70, skew = 4 } = {}) {
    if (!root) return;
    const cards = [...root.querySelectorAll(".swap__card")];
    if (cards.length < 2) return;
    let order = cards.slice();
    const slot = (i) => `translate(-50%, -50%) translate3d(${i * dx}px, ${-i * dy}px, ${-i * dz}px) skewY(${skew}deg)`;
    const place = () => order.forEach((c, i) => {
      c.style.zIndex = String(cards.length - i);
      c.style.transform = slot(i);
      c.classList.toggle("is-back", i > 0);
      c.tabIndex = i === 0 ? 0 : -1;
    });
    place();
    if (reduce) return;

    let paused = false, busy = false;
    const swap = () => {
      if (paused || busy || document.hidden) return;
      const r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      busy = true;
      const front = order[0];
      front.classList.add("is-dropping");
      front.style.transform = slot(0) + " translateY(560px)";
      setTimeout(() => {
        order = order.slice(1).concat(front);
        order.slice(0, -1).forEach((c, i) => {
          c.style.zIndex = String(cards.length - i);
          c.style.transform = slot(i);
          c.classList.toggle("is-back", i > 0);
          c.tabIndex = i === 0 ? 0 : -1;
        });
        setTimeout(() => {
          front.style.transition = "none";
          front.style.zIndex = "0";
          front.style.transform = slot(order.length - 1) + " translateY(560px)";
          void front.offsetWidth;
          front.style.transition = "";
          front.classList.remove("is-dropping");
          front.classList.add("is-back");
          front.tabIndex = -1;
          front.style.transform = slot(order.length - 1);
          setTimeout(() => { busy = false; }, 900);
        }, 380);
      }, 560);
    };
    setInterval(swap, delay);
    root.addEventListener("pointerenter", () => { paused = true; });
    root.addEventListener("pointerleave", () => { paused = false; });
    root.addEventListener("focusin", () => { paused = true; });
    root.addEventListener("focusout", () => { paused = false; });
  }

  /* ---- Logo Loop: an endless strip that pauses on hover --------------- */

  function logoLoop(track, pxPerSecond = 45) {
    if (!track || reduce || track.dataset.looped) return;
    track.dataset.looped = "1";
    [...track.children].forEach((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.querySelectorAll("img").forEach((img) => img.setAttribute("alt", ""));
      track.appendChild(copy);
    });
    const set = () => track.style.setProperty("--loop-dur", (track.scrollWidth / 2 / pxPerSecond).toFixed(1) + "s");
    set();
    new ResizeObserver(set).observe(track);
    track.classList.add("is-looping");
  }

  /* ---- Reveal: sections ease in (and un-blur) as they enter the view -- */

  function reveal(onReveal) {
    const els = [...document.querySelectorAll("[data-reveal]")];
    const done = (el) => {
      el.classList.add("is-in");
      if (onReveal) onReveal(el);
      const d = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
      setTimeout(() => { el.removeAttribute("data-reveal"); el.classList.remove("is-in"); el.classList.add("was-revealed"); }, 1000 + d * 80);
    };
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(done); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); done(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  return { reduce, aurora, blurText, countUp, spotlight, magnet, clickSpark, cardSwap, logoLoop, reveal };
})();
