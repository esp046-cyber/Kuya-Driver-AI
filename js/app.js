/* ==========================================================================
   KUYA DRIVER AI — CLEAN PRODUCTION APP LOGIC (v6)
   Zero-Bloat, Crash-Proof JS for Maps, Car HUD, Calculators & Coding/SOS
   ========================================================================== */

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const $i = (id) => document.getElementById(id);

  const peso = (n) =>
    "₱" +
    (Number.isFinite(n) ? n : 0).toLocaleString("en-PH", {
      maximumFractionDigits: 2
    });

  const vd = (x) => {
    const n = typeof x === "number" ? x : parseInt(x, 10);
    return Number.isInteger(n) && n >= 0 && n <= 9 ? n : null;
  };

  const toast = (m) => {
    let t = $i("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = m;
    t.classList.add("on");
    clearTimeout(toast.i);
    toast.i = setTimeout(() => t.classList.remove("on"), 2300);
  };

  let store = {};
  try {
    store = JSON.parse(localStorage.getItem("kuya") || "{}") || {};
  } catch (e) {
    store = {};
  }

  store.custom = Array.isArray(store.custom) ? store.custom : [];
  store.pins = Array.isArray(store.pins) ? store.pins : ["krudo"];
  store.exp = (Array.isArray(store.exp) ? store.exp : []).filter(
    (x) => x && typeof x === "object" && Number.isFinite(+x.a)
  );
  store.rfid = Object.assign({ as: 500, et: 500 }, store.rfid || {});
  store.pms = Object.assign({ odo: "", last: "", iv: 5000 }, store.pms || {});
  store.calcVals =
    store.calcVals && typeof store.calcVals === "object" ? store.calcVals : {};
  store.plate = vd(store.plate);
  store.mid = vd(store.mid);
  store.dest = typeof store.dest === "string" ? store.dest : "";
  store.origin =
    typeof store.origin === "string" && store.origin.trim()
      ? store.origin
      : "Current GPS Location";
  store.routeMode = store.routeMode === "free" ? "free" : "toll";
  store.dk = Number.isFinite(+store.dk) && +store.dk >= 0 ? +store.dk : 0;
  store.tl = Number.isFinite(+store.tl) && +store.tl >= 0 ? +store.tl : 0;

  const save = () => {
    try {
      localStorage.setItem("kuya", JSON.stringify(store));
    } catch (e) {}
  };

  // Safe arithmetic evaluator
  function ev(s, v) {
    const t = String(s || "").match(/[A-Za-z_]\w*|\d*\.?\d+|[()+\-*/%]/g) || [];
    let i = 0;
    const E = () => {
      let a = T();
      while (t[i] === "+" || t[i] === "-") {
        const o = t[i++];
        const b = T();
        a = o === "+" ? a + b : a - b;
      }
      return a;
    };
    const T = () => {
      let a = F();
      while (t[i] === "*" || t[i] === "/") {
        const o = t[i++];
        const b = F();
        a = o === "*" ? a * b : b ? a / b : 0;
      }
      return a;
    };
    const F = () => {
      const x = t[i++];
      if (x === "-") return -F();
      if (x === "+") return F();
      if (x === "(") {
        const r = E();
        if (t[i] === ")") i++;
        return r;
      }
      let r = /^[A-Za-z_]/.test(x || "") ? Number(v[x] ?? 0) : parseFloat(x);
      if (!Number.isFinite(r)) r = 0;
      while (t[i] === "%") {
        i++;
        r /= 100;
      }
      return r;
    };
    try {
      const res = E();
      return Number.isFinite(res) ? res : 0;
    } catch (e) {
      return 0;
    }
  }

  const F_ = (id, label, def, type = "peso", min = 0, max = 100) => ({
    id,
    label,
    def,
    type,
    min,
    max
  });

  const PRE = [
    {
      id: "krudo",
      name: "Krudo at trip cost",
      f: [
        F_("dist", "Layo (km)", 120, "num"),
        F_("kml", "Km kada litro", 10, "num"),
        F_("price", "Presyo/litro (₱)", 62),
        F_("buf", "Traffic buffer (%)", 15, "slider", 0, 50),
        F_("pax", "Ilan ang maghahati", 3, "num")
      ],
      o: [
        ["Krudo kailangan (L)", "dist/kml*(1+buf/100)", 1],
        ["Kabuuang gastos", "dist/kml*(1+buf/100)*price", 2],
        ["Ambagan bawat isa", "dist/kml*(1+buf/100)*price/pax", 0]
      ]
    },
    {
      id: "toll",
      name: "Toll at RFID load",
      f: [
        F_("toll", "Toll isang biyahe (₱)", 170),
        F_("trips", "Bilang ng round trip", 2, "num"),
        F_("load", "Natitirang RFID load (₱)", 1000)
      ],
      o: [
        ["Toll (round trip)", "toll*2*trips", 0],
        ["Matitirang load", "load-toll*2*trips", 2]
      ]
    },
    {
      id: "sweldo",
      name: "Sweldo, OT at allowance",
      f: [
        F_("rate", "Daily rate (₱)", 800),
        F_("days", "Araw na pumasok", 12, "num"),
        F_("ot", "OT hours", 6, "num"),
        F_("allow", "Out-of-town allowance (₱)", 300),
        F_("meal", "Meal allowance/araw (₱)", 150),
        F_("bale", "Bale / cash advance (₱)", 500)
      ],
      o: [
        ["Gross", "rate*days+ot*rate/8*125%+allow+meal*days", 0],
        ["Take-home", "rate*days+ot*rate/8*125%+allow+meal*days-bale", 2]
      ]
    },
    {
      id: "ambagan",
      name: "Ambagan at tip",
      f: [
        F_("total", "Kabuuang bayarin (₱)", 1500),
        F_("pax", "Ilan ang maghahati", 4, "num"),
        F_("tip", "Tip (%)", 10, "slider", 0, 30)
      ],
      o: [
        ["May tip", "total*(1+tip/100)", 1],
        ["Bawat isa", "total*(1+tip/100)/pax", 2]
      ]
    },
    {
      id: "pms",
      name: "Boundary at net take-home",
      f: [
        F_("inc", "Kita bawat araw (₱)", 2200),
        F_("bound", "Boundary (₱)", 1100),
        F_("fuel", "Krudo bawat araw (₱)", 600),
        F_("pms", "PMS bawat buwan (₱)", 3000),
        F_("days", "Araw na pumasok", 26, "num")
      ],
      o: [
        ["Net bawat araw", "inc-bound-fuel-pms/days", 1],
        ["Net bawat buwan", "(inc-bound-fuel)*days-pms", 2]
      ]
    }
  ];

  function card(c, pinBtn = false) {
    const el = document.createElement("section");
    el.className = "card";
    const saved = store.calcVals[c.id] || {};
    const vals = {};

    el.innerHTML =
      `<h3><span class="ellip">${c.name}</span>${
        pinBtn
          ? `<button class="ghost" type="button" data-pin aria-label="I-pin sa Car HUD">${
              store.pins.includes(c.id) ? "Naka-pin" : "Pin"
            }</button>`
          : ""
      }</h3>` +
      c.f
        .map((f) => {
          const val = saved[f.id] !== undefined ? saved[f.id] : f.def;
          return `<label for="${c.id}_${f.id}"><span>${f.label}</span>${
            f.type === "slider" ? `<b data-v="${f.id}">${val}%</b>` : ""
          }</label>${
            f.type === "toggle"
              ? `<select id="${c.id}_${f.id}" data-f="${f.id}"><option value="0"${
                  +val === 0 ? " selected" : ""
                }>Hindi</option><option value="1"${
                  +val === 1 ? " selected" : ""
                }>Oo</option></select>`
              : `<input id="${c.id}_${f.id}" data-f="${f.id}" type="${
                  f.type === "slider" ? "range" : "number"
                }" inputmode="decimal" ${
                  f.type === "slider"
                    ? `min="${f.min ?? 0}" max="${f.max ?? 100}"`
                    : `min="0" step="any"`
                } value="${val}">`
          }`;
        })
        .join("") +
      `<div class="out" aria-live="polite"></div>` +
      `<div class="row" style="margin-top:10px">` +
      `<button type="button" class="gold" data-say style="flex:1">🔊 Basahin</button>` +
      `<button type="button" class="ghost" data-rst>I-reset</button>` +
      `</div>`;

    const run = (persist = false) => {
      el.querySelectorAll("[data-f]").forEach((i) => {
        const k = i.dataset.f;
        let v = parseFloat(i.value);
        if (!Number.isFinite(v) || v < 0) v = 0;
        if ((k === "kml" || k === "pax" || k === "days") && v === 0) v = 1;
        vals[k] = v;
        const b = el.querySelector(`[data-v="${k}"]`);
        if (b) b.textContent = i.value + "%";
      });
      if (persist) {
        store.calcVals[c.id] = Object.assign({}, vals);
        save();
      }
      const rows = c.o.map(([l, f, k]) => {
        const r = ev(f, vals);
        return { l, r, k, txt: /\(L\)/.test(l) ? r.toFixed(1) + " L" : peso(r) };
      });
      el.querySelector(".out").innerHTML = rows
        .map(
          (r, i) =>
            `<div class="${i === rows.length - 1 ? "main" : ""}"><span>${
              r.l
            }</span><b>${r.txt}</b></div>`
        )
        .join("");
      el._say = rows.map((r) => r.l + ": " + r.txt).join(". ");
    };

    el.addEventListener("input", () => run(true));
    run(false);

    el.querySelector("[data-say]").onclick = () => {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(
          el._say.replace(/₱/g, "piso ").replace(/\(L\)/g, "litro ")
        );
        u.lang = "fil-PH";
        speechSynthesis.speak(u);
      } catch (e) {
        toast("Walang voice readout sa device na ito");
      }
    };

    el.querySelector("[data-rst]").onclick = () => {
      delete store.calcVals[c.id];
      save();
      c.f.forEach((f) => {
        const inp = el.querySelector(`[data-f="${f.id}"]`);
        if (inp) inp.value = f.def;
      });
      run(false);
      toast("Na-reset sa default");
    };

    const pb = el.querySelector("[data-pin]");
    if (pb) {
      pb.onclick = () => {
        const i = store.pins.indexOf(c.id);
        if (i < 0) store.pins.push(c.id);
        else store.pins.splice(i, 1);
        save();
        pb.textContent = i < 0 ? "Naka-pin" : "Pin";
        toast(i < 0 ? "Na-pin sa Car HUD" : "Inalis sa Car HUD");
      };
    }
    return el;
  }

  const CODE = { 1: [1, 2], 2: [3, 4], 3: [5, 6], 4: [7, 8], 5: [9, 0] };
  const DAYS = [
    "Linggo",
    "Lunes",
    "Martes",
    "Miyerkules",
    "Huwebes",
    "Biyernes",
    "Sabado"
  ];

  const enc = encodeURIComponent;
  const GM = "https://www.google.com/maps/";
  const geo = navigator.geolocation;

  const hav = (a, b, c, d) => {
    const r = Math.PI / 180;
    const x =
      Math.sin(((c - a) * r) / 2) ** 2 +
      Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(x)));
  };

  const srch = (q) => GM + "search/?api=1&query=" + q;

  const HUBS = {
    "NAIA T1": [14.509, 121.003, 90, "Skyway/NAIAX"],
    "NAIA T2": [14.505, 121.009, 90, "Skyway/NAIAX"],
    "NAIA T3": [14.518, 121.02, 90, "Skyway/NAIAX"],
    "BGC": [14.5507, 121.0503, 0, "Walang toll"],
    "Makati CBD": [14.5547, 121.0244, 0, "Walang toll"],
    "Ortigas": [14.5873, 121.0615, 0, "Walang toll"],
    "Quezon City": [14.676, 121.0437, 0, "Walang toll"],
    "Alabang": [14.4198, 121.039, 60, "SLEX/Skyway"],
    "Tagaytay": [14.1153, 120.9621, 180, "SLEX + CALAX"],
    "Baguio": [16.4023, 120.596, 750, "NLEX + SCTEX + TPLEX"],
    "Clark": [15.185, 120.56, 300, "NLEX + SCTEX"]
  };

  const findHub = (name) => {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    const k = Object.keys(HUBS).find((key) => key.toLowerCase() === clean);
    return k ? { key: k, data: HUBS[k] } : null;
  };

  const PIT = [
    ["⛽", "Murang gas / pinakamalapit na krudo", "gas+station+near+me"],
    ["🔧", "Vulcanizing / auto repair", "vulcanizing+shop+auto+repair+near+me"],
    ["💳", "RFID reload: Autosweep at Easytrip", "Autosweep+Easytrip+RFID+station+near+me"],
    ["🅿️", "Parking malapit sa destination", "parking+lot+near+me"],
    ["🚻", "Restroom / stopover / drive-thru", "gas+station+with+restroom+drive+thru+near+me"],
    ["🚨", "Tow truck / ospital / emergency", "hospital+or+towing+service+near+me"]
  ];

  function getPos(cb, silent) {
    if (!geo) {
      if (!silent) toast("Walang GPS sa device na ito");
      return;
    }
    geo.getCurrentPosition(
      (p) => {
        store.pos = { la: p.coords.latitude, lo: p.coords.longitude };
        save();
        if (cb) cb(store.pos);
      },
      () => {
        if (!silent) toast("Hindi makuha ang GPS. I-allow ang Location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const V = {};

  // Tab 1: Maps & Biyahe
  V.maps = (m) => {
    m.innerHTML =
      `<h2>Maps at Biyahe</h2>` +
      `<section class="card">` +
      `<div class="two">` +
      `<div><label for="st">Panimulang punto</label><input id="st" value="${store.origin.replace(/"/g, "&quot;")}"></div>` +
      `<div><label for="md">Ruta</label><select id="md"><option value="toll"${store.routeMode === "toll" ? " selected" : ""}>May toll (mabilis)</option><option value="free"${store.routeMode === "free" ? " selected" : ""}>Iwas toll</option></select></div>` +
      `</div>` +
      `<label for="ds">Destination</label>` +
      `<input id="ds" value="${store.dest.replace(/"/g, "&quot;")}" placeholder="Saan ang punta?" autocomplete="off">` +
      `<div class="chips" aria-label="Mabilis na destination">${Object.keys(HUBS)
        .map((k) => `<button type="button" class="pill" data-h="${k}">${k}</button>`)
        .join("")}</div>` +
      `<a id="go" class="btn cta" href="#" target="_blank" rel="noopener">Buksan sa Google Maps Navigation</a>` +
      `<div class="out" id="es" aria-live="polite"></div>` +
      `<h3 style="margin-top:16px">Detalye ng biyahe</h3>` +
      `<div class="two">` +
      `<div><label for="dk">Layo (km)</label><input id="dk" type="number" inputmode="decimal" min="0" step="any" value="${store.dk || 0}"></div>` +
      `<div><label for="tl">Toll isang biyahe (₱)</label><input id="tl" type="number" inputmode="decimal" min="0" step="any" value="${store.tl || 0}"></div>` +
      `<div><label for="kl">Km kada litro</label><input id="kl" type="number" inputmode="decimal" min="1" step="any" value="${store.kml || 10}"></div>` +
      `<div><label for="pr">Presyo/litro (₱)</label><input id="pr" type="number" inputmode="decimal" min="0" step="any" value="${store.price || 62}"></div>` +
      `</div>` +
      `<label for="pl">Huling digit ng plaka (0–9)</label>` +
      `<input id="pl" type="number" inputmode="numeric" min="0" max="9" value="${store.plate ?? ""}" placeholder="Para sa coding warning">` +
      `</section>` +
      `<h2>Pit-stop at emergency</h2>` +
      `<div class="pit">${PIT.map(
        (p) =>
          `<a href="${srch(p[2])}" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">${p[0]}</span>${p[1]}</a>`
      ).join("")}</div>`;

    const g = (i) => m.querySelector("#" + i);

    const url = () => {
      const s = g("st").value.trim();
      const d = g("ds").value.trim();
      if (!d) return GM;
      let u = GM + "dir/?api=1&destination=" + enc(d) + "&travelmode=driving";
      if (s && !/^current/i.test(s)) u += "&origin=" + enc(s);
      else if (store.pos) u += "&origin=" + store.pos.la + "," + store.pos.lo;
      if (g("md").value === "free") u += "&avoid=tolls";
      return u;
    };

    const fill = () => {
      const hub = findHub(g("ds").value);
      if (!hub) return;
      const h = hub.data;
      const o = store.pos || { la: 14.5547, lo: 121.0244 };
      const fr = g("md").value === "free";
      g("dk").value = Math.max(
        1,
        Math.round(hav(o.la, o.lo, h[0], h[1]) * 1.35 * (fr ? 1.15 : 1))
      );
      g("tl").value = fr ? 0 : h[2];
    };

    const est = () => {
      const km = Math.max(0, +g("dk").value || 0);
      const tl = Math.max(0, +g("tl").value || 0);
      const k = Math.max(0.5, +g("kl").value || 10);
      const p = Math.max(0, +g("pr").value || 0);
      const gas = (km / k) * p;
      const hub = findHub(g("ds").value);
      const pv = g("pl").value.trim();
      const parsedPlate = pv === "" ? null : vd(+pv);

      store.kml = k;
      store.price = p;
      store.dk = km;
      store.tl = tl;
      store.origin = g("st").value.trim() || "Current GPS Location";
      store.routeMode = g("md").value;
      store.plate = parsedPlate;
      store.dest = g("ds").value.trim();
      save();

      let w = "";
      let cls = "yes";
      if (parsedPlate !== null) {
        const n = new Date();
        const dow = n.getDay();
        const cd = Object.keys(CODE).find((x) => CODE[x].includes(parsedPlate));
        const hr = n.getHours() + n.getMinutes() / 60;
        const win = (hr >= 7 && hr < 10) || (hr >= 17 && hr < 20);
        if (dow === 0 || dow === 6) {
          w = "Walang coding ngayon (" + DAYS[dow] + ").";
        } else if (dow === +cd) {
          cls = "no";
          w = win
            ? "Coded ka NGAYON at nasa restricted hours ka na (Metro Manila)."
            : "Coded ka ngayon. Bawal sa 7–10 AM at 5–8 PM (Metro Manila).";
        } else {
          w = "Hindi coded ngayon (" + DAYS[dow] + ").";
        }
      }

      g("es").innerHTML =
        `<div><span>Krudo, isang biyahe</span><b>${peso(gas)}</b></div>` +
        `<div><span>Krudo, balikan</span><b>${peso(gas * 2)}</b></div>` +
        `<div><span>Toll${
          hub && g("md").value === "toll" ? " (" + hub.data[3] + ")" : ""
        }, isang biyahe</span><b>${peso(tl)}</b></div>` +
        `<div class="main"><span>Kabuuan, balikan</span><b>${peso((gas + tl) * 2)}</b></div>` +
        (w ? `<div class="status ${cls}">${w}</div>` : "") +
        `<p class="note">Tantya lang ang layo at toll. I-edit ang mga numero kung iba ang ruta mo.</p>`;
      g("go").href = url();
    };

    if (store.dest && store.dk === 0 && findHub(store.dest)) fill();
    est();

    m.addEventListener("input", (e) => {
      if (e.target.id === "ds") fill();
      est();
    });
    m.addEventListener("change", (e) => {
      if (e.target.id === "md") {
        fill();
        est();
      }
    });
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-h]");
      if (b) {
        g("ds").value = b.dataset.h;
        fill();
        est();
        return;
      }
      if (e.target.closest("#go") && !g("ds").value.trim()) {
        e.preventDefault();
        toast("Maglagay muna ng destination");
      }
    });

    getPos(() => {
      if (findHub(g("ds").value)) fill();
      est();
    }, true);
  };

  // Tab 2: Car HUD
  const T = {
    run: false,
    t0: 0,
    acc: 0,
    d: 0,
    sp: null,
    hd: null,
    last: null,
    lastTs: null,
    wid: null
  };
  const D8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const EX = [
    ["Parking", 50],
    ["Toll", 100],
    ["Gas", 500],
    ["Meal", 150]
  ];

  function paint() {
    if (!$i("tm")) return;
    const s = Math.floor(T.acc + (T.run ? (Date.now() - T.t0) / 1000 : 0));
    const p = (n) => String(n).padStart(2, "0");
    $i("tm").textContent = `${p((s / 3600) | 0)}:${p(((s / 60) % 60) | 0)}:${p(
      s % 60
    )}`;
    $i("sp").textContent = T.sp == null ? "--" : Math.round(T.sp);
    $i("hd").textContent =
      T.hd == null || isNaN(T.hd)
        ? "--"
        : D8[Math.round(T.hd / 45) % 8] + " " + Math.round(T.hd) + "°";
    $i("dst").textContent = T.d.toFixed(1) + " km";
    $i("fb").textContent = peso((T.d / (store.kml || 10)) * (store.price || 62));
    $i("tg").textContent = T.run ? "Itigil" : "Simulan";
  }

  setInterval(paint, 1000);

  function watch() {
    if (T.wid != null || !geo) return;
    T.wid = geo.watchPosition(
      (p) => {
        const c = p.coords;
        const now = Date.now();
        let sp = c.speed != null && c.speed >= 0 ? c.speed * 3.6 : null;
        if (T.last && c.accuracy < 60) {
          const d = hav(T.last.la, T.last.lo, c.latitude, c.longitude);
          if (T.run && d > 0.003 && d < 0.5) T.d += d;
          if (sp == null && T.lastTs && now > T.lastTs) {
            const dt = (now - T.lastTs) / 3600000;
            if (dt > 0) {
              const estSp = d / dt;
              sp = estSp < 2 ? 0 : estSp <= 180 ? estSp : null;
            }
          }
        }
        T.sp = sp;
        T.hd = c.heading;
        T.last = { la: c.latitude, lo: c.longitude };
        T.lastTs = now;
        store.pos = T.last;
        paint();
      },
      () => toast("Walang GPS signal. I-allow ang Location."),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
  }

  function unwatch() {
    if (T.wid != null && geo) geo.clearWatch(T.wid);
    T.wid = null;
    T.sp = null;
  }

  function expPaint() {
    if (!$i("et")) return;
    const by = {};
    let t = 0;
    store.exp.forEach((e) => {
      by[e.n] = (by[e.n] || 0) + e.a;
      t += e.a;
    });
    $i("et").textContent = peso(t);
    const keys = Object.keys(by);
    $i("el").hidden = !keys.length;
    $i("el").innerHTML = keys
      .map(
        (k) =>
          `<div><span>${k}</span><b style="font-size:1.1rem">${peso(
            by[k]
          )}</b></div>`
      )
      .join("");
  }

  function parkPaint() {
    if (!$i("pi")) return;
    const p = store.park;
    $i("pb").hidden = !p;
    $i("pi").textContent = p
      ? "Naka-save: " +
        new Date(p.t).toLocaleString("en-PH") +
        " (" +
        p.la.toFixed(5) +
        ", " +
        p.lo.toFixed(5) +
        ")"
      : "Wala pang naka-save na spot.";
    if (p) $i("pb").href = srch(p.la + "," + p.lo);
  }

  V.hud = (m) => {
    m.innerHTML =
      `<h2>Car HUD</h2>` +
      `<div class="two" style="margin-bottom:14px">` +
      `<a class="btn cta" style="margin:0" href="${GM}" target="_blank" rel="noopener">Google Maps</a>` +
      `<a class="btn" style="margin:0" href="${srch("gas+station+near+me")}" target="_blank" rel="noopener">Krudo malapit</a>` +
      `</div>` +
      `<div class="hud-grid">` +
      `<section class="card">` +
      `<div class="two">` +
      `<div><label>Bilis (km/h)</label><div class="big" id="sp">--</div></div>` +
      `<div><label>Direksyon</label><div class="big" id="hd" style="font-size:2.2rem">--</div></div>` +
      `</div>` +
      `<div class="two" style="margin-top:12px">` +
      `<div><label>Oras</label><div class="num" id="tm">00:00:00</div></div>` +
      `<div><label>Layo</label><div class="num" id="dst">0.0 km</div></div>` +
      `</div>` +
      `<div class="out"><div><span>Nagastos na krudo (GPS)</span><b id="fb">₱0</b></div></div>` +
      `<div class="row" style="margin-top:12px">` +
      `<button type="button" class="gold" id="tg" style="flex:1">Simulan</button>` +
      `<button type="button" class="ghost" id="rs">I-reset</button>` +
      `</div>` +
      `</section>` +
      `<section class="card">` +
      `<label>Parking / pickup spot</label>` +
      `<button type="button" class="gold" id="pk" style="width:100%">I-save ang spot ko ngayon</button>` +
      `<p class="note" id="pi"></p>` +
      `<a id="pb" class="btn" target="_blank" rel="noopener" hidden>Balikan ang sasakyan sa Google Maps</a>` +
      `</section>` +
      `<section class="card" style="grid-column:1/-1">` +
      `<label>Mabilis na gastos</label>` +
      `<div class="exp">${EX.map(
        (x) =>
          `<button type="button" data-x="${x[1]}" data-n="${x[0]}" class="${
            x[0] === "Gas" ? "gold" : ""
          }">+${peso(x[1])} ${x[0]}</button>`
      ).join("")}</div>` +
      `<div class="out"><div class="main"><span>Kabuuan ngayon</span><b id="et">₱0</b></div><div id="el"></div></div>` +
      `<div class="row" style="margin-top:8px">` +
      `<button type="button" class="ghost" id="ec">Kopyahin ang listahan</button>` +
      `<button type="button" class="ghost" id="ex">I-reset</button>` +
      `</div>` +
      `</section>` +
      `</div>`;

    paint();
    expPaint();
    parkPaint();

    $i("tg").onclick = () => {
      if (T.run) {
        T.acc += (Date.now() - T.t0) / 1000;
        T.run = false;
        unwatch();
      } else {
        if (!geo) toast("Walang GPS. Oras lang ang gagana.");
        T.t0 = Date.now();
        T.run = true;
        watch();
      }
      paint();
    };
    $i("rs").onclick = () => {
      T.run = false;
      T.acc = 0;
      T.d = 0;
      T.last = null;
      T.lastTs = null;
      unwatch();
      paint();
      toast("Na-reset ang biyahe");
    };
    $i("pk").onclick = () =>
      getPos((p) => {
        store.park = { la: p.la, lo: p.lo, t: Date.now() };
        save();
        parkPaint();
        toast("Na-save ang parking/pickup spot");
      });
    m.querySelectorAll("[data-x]").forEach((b) => {
      b.onclick = () => {
        store.exp.push({ n: b.dataset.n, a: +b.dataset.x, t: Date.now() });
        save();
        expPaint();
        toast("Naitala: " + b.dataset.n);
      };
    });
    $i("ec").onclick = () => {
      if (!store.exp.length) {
        toast("Wala pang naitalang gastos");
        return;
      }
      const t = store.exp.reduce((a, e) => a + e.a, 0);
      const s =
        store.exp
          .map(
            (e) =>
              new Date(e.t).toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit"
              }) +
              " " +
              e.n +
              " " +
              peso(e.a)
          )
          .join("\n") +
        "\nKabuuan: " +
        peso(t);
      navigator.clipboard
        ? navigator.clipboard
            .writeText(s)
            .then(() => toast("Na-kopya ang listahan"), () => toast("Hindi makopya"))
        : toast("Hindi suportado ang copy");
    };
    $i("ex").onclick = () => {
      store.exp = [];
      save();
      expPaint();
      toast("Na-reset ang gastos");
    };
  };

  // Tab 3: Calculators
  V.calc = (m) => {
    m.innerHTML = "<h2>Mga calculator</h2><div class='grid'></div>";
    const g = $(".grid", m);
    PRE.forEach((c) => g.append(card(c, false)));
  };

  // Tab 4: Coding & SOS
  function applyTheme(t) {
    const r = document.documentElement;
    if (t === "light" || t === "dark") r.dataset.theme = t;
    else delete r.dataset.theme;
    const d =
      t === "dark" ||
      (t !== "light" && matchMedia("(prefers-color-scheme:dark)").matches);
    const meta = document.querySelector("meta[name=theme-color]");
    if (meta) meta.content = d ? "#0B0F19" : "#0038A8";
  }

  const MONTHS = [
    "October",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September"
  ];
  const ORD = (n) =>
    n +
    (n % 10 === 1 && n !== 11
      ? "st"
      : n % 10 === 2 && n !== 12
      ? "nd"
      : n % 10 === 3 && n !== 13
      ? "rd"
      : "th");

  function ltoInfo(l, mid) {
    if (l == null) return null;
    const mn = l === 0 ? 10 : l;
    const last = new Date(new Date().getFullYear(), mn, 0).getDate();
    if (mid == null) {
      return { month: MONTHS[l], wn: null, range: "Piliin ang middle digit" };
    }
    const wn =
      mid >= 1 && mid <= 3 ? 1 : mid >= 4 && mid <= 6 ? 2 : mid === 7 || mid === 8 ? 3 : 4;
    const rg = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, last]
    ][wn - 1];
    return { month: MONTHS[l], wn, range: ORD(rg[0]) + "–" + ORD(rg[1]) };
  }

  V.sos = (m) => {
    const opt = (s) =>
      `<option value="">—</option>` +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((i) => `<option value="${i}"${s === i ? " selected" : ""}>${i}</option>`)
        .join("");
    const W = [
      ["as", "Autosweep", "SLEX, Skyway, NAIAX, STAR, MCX"],
      ["et", "Easytrip", "NLEX, SCTEX, TPLEX, CAVITEX, CALAX"]
    ];
    const P = store.pms;
    const call = (h, ic, l, n) =>
      `<a class="call" href="${h}"><span class="ic" aria-hidden="true">${ic}</span>${l}<b>${n}</b></a>`;
    const mp = (ic, l, q) =>
      `<a href="${srch(q)}" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">${ic}</span>${l}<small>Google Maps, malapit sa akin</small></a>`;

    m.innerHTML =
      `<h2>Coding at SOS</h2>` +
      `<section class="card"><h3>Number coding (MMDA)</h3>` +
      `<div class="two"><div><label for="sl">Huling digit ng plaka</label><select id="sl">${opt(store.plate)}</select></div>` +
      `<div><label for="sm">Middle digit (ikalawa sa huli)</label><select id="sm">${opt(store.mid)}</select></div></div>` +
      `<div id="cb" aria-live="polite" style="margin-top:12px"></div>` +
      `<a id="cm" class="btn" target="_blank" rel="noopener">Buksan sa Google Maps</a>` +
      `<p class="note">Hindi awtomatikong iniiwasan ng Google Maps ang coding. Exempt ang mga expressway. Iwasan ang Makati at EDSA kapag coded ka. Walang coding kapag holiday.</p></section>` +
      `<h2>RFID Load Wallet</h2>` +
      `<section class="card"><label for="ta">Toll na ibabawas bawat tap (₱)</label>` +
      `<input id="ta" type="number" inputmode="decimal" min="0" step="any" value="${store.tollamt || 100}">` +
      `<div class="two" style="margin-top:12px">${W.map(
        (w) =>
          `<div class="wal" data-w="${w[0]}"><b>${w[1]}</b><small class="note" style="display:block;margin:2px 0 8px">${w[2]}</small><label for="b_${w[0]}">Balance (₱)</label><input id="b_${w[0]}" type="number" inputmode="decimal" min="0" step="any" value="${store.rfid[w[0]]}"><div class="stack"><button type="button" data-a="500">+₱500 Reload</button><button type="button" data-a="1000">+₱1000 Reload</button><button type="button" class="ghost" data-a="toll">−Toll</button></div><div class="alert" hidden>Mababa na ang load! I-reload bago pumasok sa tollway.</div></div>`
      ).join("")}</div></section>` +
      `<h2>Roadside SOS</h2>` +
      `<div class="sos">${call("tel:136", "📞", "MMDA Roadside Assistance", "136")}${call("tel:911", "🚨", "National Emergency Hotline", "911")}${call("tel:135000", "🛣️", "NLEX / SCTEX Hotline", "1-35000")}${call("tel:0253188655", "🛣️", "Skyway / SLEX Hotline", "(02) 5318-8655")}${mp("🔧", "Pinakamalapit na 24/7 vulcanizing at auto shop", "24/7+vulcanizing+auto+repair+shop+near+me")}${mp("🏥", "Pinakamalapit na ospital / ER", "hospital+emergency+room+near+me")}</div>` +
      `<h2>LTO Registration at PMS</h2>` +
      `<section class="card"><h3>Rehistro (LTO)</h3><div id="lt"></div><p class="note">Buwan = huling digit. Linggo = middle digit.</p></section>` +
      `<section class="card" style="margin-top:12px"><h3>Change oil (PMS)</h3>` +
      `<div class="two"><div><label for="po">Odometer ngayon (km)</label><input id="po" type="number" inputmode="numeric" min="0" value="${P.odo}"></div>` +
      `<div><label for="pl2">Huling change oil (km)</label><input id="pl2" type="number" inputmode="numeric" min="0" value="${P.last}"></div></div>` +
      `<label for="pi2">Kada ilang km (interval)</label><input id="pi2" type="number" inputmode="numeric" min="500" value="${P.iv || 5000}">` +
      `<div id="pm" aria-live="polite" style="margin-top:12px"></div></section>`;

    const g = (i) => m.querySelector("#" + i);

    const cb = () => {
      const d = store.plate;
      const n = new Date();
      const dow = n.getDay();
      const hr = n.getHours() + n.getMinutes() / 60;
      const bd = d == null ? null : Object.keys(CODE).find((k) => CODE[k].includes(d));
      const ban = bd != null && dow === +bd;
      const inC = (hr >= 7 && hr < 10) || (hr >= 17 && hr < 20);
      const inMk = hr >= 7 && hr < 19;
      let b;
      if (d == null) b = `<div class="codeban">Piliin ang huling digit ng plaka mo</div>`;
      else if (ban)
        b = `<div class="codeban no">🔴 CODING KA TODAY<small>Banned Day: ${DAYS[bd]}</small></div>`;
      else
        b = `<div class="codeban yes">🟢 LIGTAS BUMiyahe Today<small>${
          dow === 0 || dow === 6
            ? "Walang coding tuwing weekend"
            : "Hindi ka coded ngayon (" +
              DAYS[dow] +
              "). Coded ang plakang " +
              d +
              " tuwing " +
              DAYS[bd] +
              "."
        }</small></div>`;
      b += `<div class="out stk"><div><span>Metro Manila coding</span><b>7–10 AM, 5–8 PM</b></div><div><span>Window hours</span><b>10:01 AM–4:59 PM, 8:01 PM–6:59 AM</b></div><div><span>Makati</span><b>7 AM–7 PM, walang window</b></div></div>`;
      if (ban) {
        b += `<div class="status ${inC ? "no" : "yes"}">Metro Manila ngayon: ${
          inC ? "BAWAL (coding hours)" : "puwede (window hours)"
        }</div><div class="status ${inMk ? "no" : "yes"}">Makati ngayon: ${
          inMk ? "BAWAL hanggang 7 PM" : "puwede (labas ng oras)"
        }</div>`;
      }
      g("cb").innerHTML = b;
      g("cm").href = store.dest
        ? GM + "dir/?api=1&destination=" + enc(store.dest) + "&travelmode=driving"
        : GM;
    };

    const lt = () => {
      const r = ltoInfo(store.plate, store.mid);
      g("lt").innerHTML = r
        ? `<div class="out" style="margin-top:0"><div><span>Buwan</span><b>${r.month}</b></div><div class="main"><span>${
            r.wn ? "Linggo " + r.wn : "Linggo"
          }</span><b>${r.range}</b></div></div>`
        : `<p class="note" style="margin:0">Piliin ang huling digit at middle digit ng plaka.</p>`;
    };

    const wl = () =>
      m.querySelectorAll(".wal").forEach((w) => {
        const k = w.dataset.w;
        w.querySelector(".alert").hidden = !(store.rfid[k] < 200);
        w.classList.toggle("low", store.rfid[k] < 200);
      });

    const pm = () => {
      const rawO = g("po").value.trim();
      const rawL = g("pl2").value.trim();
      const iv = Math.max(500, +g("pi2").value || 5000);
      store.pms = { odo: rawO, last: rawL, iv };
      save();
      if (rawO === "" || rawL === "") {
        g("pm").innerHTML = `<p class="note" style="margin:0">Ilagay ang odometer at huling change oil.</p>`;
        return;
      }
      const o = +rawO || 0;
      const l = +rawL || 0;
      if (o < l) {
        g("pm").innerHTML = `<div class="status no">Mas mababa ang Odometer ngayon kaysa sa Huling change oil.</div>`;
        return;
      }
      const left = l + iv - o;
      const pc = Math.max(0, Math.min(100, ((o - l) / iv) * 100));
      const cl = left <= 0 ? "red" : left <= iv * 0.2 ? "gold" : "";
      g("pm").innerHTML = `<div class="bar ${cl}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(
        pc
      )}"><i style="width:${pc}%"></i></div><div class="out" style="margin-top:8px"><div class="main"><span>${
        left <= 0 ? "Lampas na! Magpa-change oil na" : "Natitirang km"
      }</span><b>${Math.abs(left)} km</b></div><div><span>Susunod na change oil</span><b>${
        l + iv
      } km</b></div></div>`;
    };

    m.addEventListener("change", (e) => {
      if (e.target.id === "sl" || e.target.id === "sm") {
        store[e.target.id === "sl" ? "plate" : "mid"] = vd(
          e.target.value === "" ? NaN : +e.target.value
        );
        save();
        cb();
        lt();
      }
    });
    m.addEventListener("input", (e) => {
      const t = e.target;
      if (t.id === "ta") {
        store.tollamt = +t.value || 0;
        save();
      } else if (t.id && t.id.startsWith("b_")) {
        store.rfid[t.id.slice(2)] = Math.max(0, +t.value || 0);
        save();
        wl();
      } else if (["po", "pl2", "pi2"].includes(t.id)) pm();
    });
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]");
      if (!b) return;
      const k = b.closest(".wal").dataset.w;
      const a = b.dataset.a === "toll" ? -(store.tollamt || 100) : +b.dataset.a;
      store.rfid[k] = Math.max(0, Math.round((store.rfid[k] + a) * 100) / 100);
      save();
      g("b_" + k).value = store.rfid[k];
      wl();
      toast(a > 0 ? "Nadagdagan ang load" : "Nabawasan ang toll");
    });

    cb();
    lt();
    wl();
    pm();
  };

  function go(t) {
    const target = V[t] ? t : "maps";
    document.body.classList.toggle("car", target === "hud");
    const o = $i("view") || $("main");
    if (!o) return;
    const v = o.cloneNode(false);
    v.id = "view";
    o.replaceWith(v);
    V[target](v);
    $$("nav button").forEach((b) =>
      b.dataset.t === target
        ? b.setAttribute("aria-current", "page")
        : b.removeAttribute("aria-current")
    );
    scrollTo(0, 0);
  }

  const navEl = $("nav");
  if (navEl) {
    navEl.onclick = (e) => {
      const b = e.target.closest("button");
      if (b && b.dataset.t) go(b.dataset.t);
    };
  }

  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  };

  const themeIcon = () => {
    const d = isDark();
    const b = $i("themeBtn");
    if (!b) return;
    b.textContent = d ? "☀️" : "🌙";
    b.setAttribute(
      "aria-label",
      d ? "Palitan sa maliwanag na theme" : "Palitan sa madilim na theme"
    );
  };

  const sa =
    matchMedia("(display-mode:standalone)").matches || navigator.standalone;

  if ($i("themeBtn")) {
    $i("themeBtn").onclick = () => {
      store.theme = isDark() ? "light" : "dark";
      save();
      applyTheme(store.theme);
      themeIcon();
    };
  }

  if ($i("installBtn")) {
    $i("installBtn").hidden = sa;
    $i("installBtn").onclick = () => {
      if (window.dp) {
        window.dp.prompt();
        window.dp = null;
      } else {
        toast(
          /iphone|ipad|ipod/i.test(navigator.userAgent)
            ? "Sa Safari: pindutin ang Share, tapos Add to Home Screen"
            : "Buksan ang menu ng browser at piliin ang Install app"
        );
      }
    };
  }

  addEventListener("appinstalled", () => {
    if ($i("installBtn")) $i("installBtn").hidden = true;
  });

  const nt = () => {
    const o = navigator.onLine;
    if ($i("net")) $i("net").textContent = o ? "Online" : "Offline";
    if (!o)
      toast(
        "Walang internet? Offline mode active. Gumagana pa rin ang mga calculator mo!"
      );
  };
  addEventListener("online", nt);
  addEventListener("offline", nt);
  nt();

  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.dp = e;
  });

  applyTheme(store.theme || "auto");
  themeIcon();
  go("maps");

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    const had = !!navigator.serviceWorker.controller;
    let rl = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (had && !rl) {
        rl = true;
        location.reload();
      }
    });
    addEventListener("load", () =>
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {})
    );
  }
})();
