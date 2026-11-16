/*
 * Lynceus demo video: animation engine. Canvas 2D, 1920 x 1080, 30 s.
 * SIMULATED DATA: every number shown comes from the real engine run on a fictional
 * crew member (datos/control-C-d126.json); every data scene carries the simulated mark.
 *
 * Same shape as the TOYP videos' engines: buildTimeline(cfg) gives the times of each
 * moment from the voice; drawFrame(ctx, tl, t) draws the frame at t seconds and keeps no
 * state between frames, so any frame can be drawn alone and the render is deterministic.
 * Colours, font, star field, icons and brand mark come from the "Campo oscuro" design
 * system (../../sistema-de-diseno/). Decisions: ../decisiones.md.
 */
(function () {
  'use strict';

  var W = 1920, H = 1080;
  var DS = '../../sistema-de-diseno/sistema/';
  var FONT = "'Atkinson Hyperlegible Next', system-ui, sans-serif";

  // Design tokens (sistema/tokens.css). Colour belongs to the levels; the pale blue of the
  // Earth is the one exception (decisiones.md).
  var C = {
    bg: '#000000', raised: '#161616', border: '#3a3a3a', strong: '#a3a3a3',
    text: '#ffffff', text2: '#c6c9ce', muted: '#9fa3a9',
    none: '#e8e8e8', advisory: '#6cb6ff', caution: '#ffd84d', warning: '#ff756c',
    glowCaution: 'rgba(255, 216, 77, 0.5)', earth: '#a9c8e8',
  };

  // ------------------------------------------------------------------ timing
  // Phrases of the trimmed voice (audio/tiempos-voz.json), seconds from the start of the voice.
  var VOICE = [
    [0, 1.81], [2.218, 3.169], [3.517, 5.377], [5.645, 6.754], [7.022, 11.252], [11.52, 14.134],
    [14.402, 15.825], [16.093, 18.107], [18.375, 19.153], [19.411, 20.122], [20.389, 21.098],
    [21.366, 22.305], [22.573, 25.434], [25.822, 26.512], [26.82, 28.194], [28.374, 29.315],
  ];
  var DEFAULTS = { voiceOffset: 0.15, total: 30, lead: 0.15, phrases: VOICE };

  function buildTimeline(cfg) {
    cfg = Object.assign({}, DEFAULTS, cfg || {});
    var o = cfg.voiceOffset;
    var p = cfg.phrases.map(function (x) { return { s: x[0] + o, e: x[1] + o }; });
    var L = cfg.lead; // the picture changes this long before the phrase
    var T = {
      // A: the astronaut at the porthole
      blink: 1.15,
      callout: p[1].s + 0.30,          // "OD · RIGHT EYE" points at the eye
      zoomA: p[2].s - 0.40, zoomB: p[2].s + 0.42,
      // B: the scan through the nerve, before the flight and today
      scanIn: p[2].s + 0.30, wipeA: p[2].e - 0.62, wipeB: p[2].e + 0.32, scanOut: p[4].s - L,
      // C: seventy percent (enters once the scan has gone)
      cIn: p[4].s + 0.05, cLit: p[4].s + 1.55, cOut: p[5].s - 0.30,
      // D: the ship and the Earth
      dIn: p[5].s - 0.05, specialist: p[5].s + 0.55, earthRing: p[5].e - 0.55,
      link: p[6].s - L, dOut: p[7].s - 0.40,
      // E: the capture and the result screen (the disc is born once the camera reaches the ship's window)
      eIn: p[7].s - 0.10, sweepA: p[7].s, sweepB: p[7].s + 0.50, settle: p[7].s + 0.52, screen: p[7].s + 0.57,
      // F: four cuts
      cuts: [p[8].s - L, p[9].s - L, p[10].s - L, p[11].s - L], cutsEnd: p[12].s - L,
      // G: the report travels to the Earth; the flight surgeon
      reportA: p[12].s - L, travelA: p[12].s + 0.20, travelB: p[12].s + 0.85, docIn: p[12].s + 1.20,
      onMonitor: p[12].s + 1.45, press: p[13].s - 0.10, gOut: p[14].s - L,
      // H: the brand
      hIn: p[14].s - L, isoA: p[14].s + 0.05, nameIn: p[14].s + 0.35, tagIn: p[15].s - 0.05, smallIn: p[15].s + 0.25,
    };
    return { cfg: cfg, p: p, T: T, total: cfg.total };
  }

  // ------------------------------------------------------------------ helpers
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function prog(t, a, b) { return b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  var E = {
    out: function (k) { return 1 - Math.pow(1 - k, 3); },
    inOut: function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    in: function (k) { return k * k * k; },
    smooth: function (k) { return k * k * (3 - 2 * k); },
  };
  /** 0 → 1 between a and a+d, 1 → 0 between b-d and b. */
  function span(t, a, b, d) { return Math.min(prog(t, a, a + d), 1 - prog(t, b - d, b)); }

  function font(size, weight) { return (weight || 400) + ' ' + size + 'px ' + FONT; }
  function text(ctx, s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = font(o.size || 24, o.weight || 400);
    ctx.fillStyle = o.color || C.text;
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.letterSpacing = (o.track ? o.track * (o.size || 24) : 0) + 'px';
    ctx.fillText(s, x, y);
    var w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }
  function measure(ctx, s, size, weight, track) {
    ctx.save(); ctx.font = font(size, weight); ctx.letterSpacing = (track ? track * size : 0) + 'px';
    var w = ctx.measureText(s).width; ctx.restore(); return w;
  }
  function line(ctx, x1, y1, x2, y2, color, w, alpha, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  /** The design system's halo: black at 94 % with a soft edge, behind a group floating on the field. */
  function halo(ctx, x, y, w, h, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.filter = 'blur(22px)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
    ctx.fillRect(x, y, w, h);
    ctx.filter = 'none';
    ctx.fillRect(x + 14, y + 14, w - 28, h - 28);
    ctx.restore();
  }

  /** Smooth path through the points (Catmull–Rom as cubic Béziers). */
  function smoothPath(pts, closed, path) {
    path = path || new Path2D();
    var n = pts.length;
    path.moveTo(pts[0][0], pts[0][1]);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
      path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (closed) path.closePath();
    return path;
  }

  // ------------------------------------------------------------------ assets
  var A = { img: {}, icon: {}, data: null, boxes: null, iso: null, ready: false };
  var IMAGES = {
    lejos: DS + 'assets/campo/campo-lejos.svg',
    cerca: DS + 'assets/campo/campo-cerca.svg',
    before: 'datos/corte-C-OD-d0-k0.png',
    today: 'datos/corte-C-OD-d126-k0.png',
    fundus: '../pantallas/img/fondo-C-OD-d126.jpg',
    screen: 'capturas/resultado-d126@2x.png',
    'pieza-ocular-od': 'capturas/pieza-ocular-od@4x.png',
    'pieza-seguro': 'capturas/pieza-seguro@4x.png',
    'pieza-pasos': 'capturas/pieza-pasos@4x.png',
    'pieza-resultado': 'capturas/pieza-resultado@4x.png',
  };
  // Icons of the design system, drawn white (or in a level colour).
  var ICONS = [
    ['flask-conical', C.text2], ['eye', C.text], ['ruler', C.text], ['target', C.text], ['list-checks', C.text],
    ['stethoscope', C.text], ['file-text', C.text], ['origen-reference', C.text2], ['origen-derived', C.text2],
    ['nivel-caution', C.caution], ['circle-dot', C.text], ['circle-dot', C.bg], ['scan-eye', C.text],
  ];

  function loadImage(src) {
    return new Promise(function (ok, fail) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { fail(new Error('Cannot load ' + src)); };
      im.src = src;
    });
  }
  function svgImage(svgText, color) {
    var s = svgText.replace(/<!--[\s\S]*?-->/g, '').replace(/currentColor/g, color).replace(/var\(--color-bg, #000\)/g, '#000')
      .replace(/color="#fff"/g, '');
    return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s));
  }

  function loadAssets(cb) {
    var jobs = Object.keys(IMAGES).map(function (k) { return loadImage(IMAGES[k]).then(function (im) { A.img[k] = im; }); });
    jobs.push(fetch('datos/control-C-d126.json').then(function (r) { return r.json(); }).then(function (d) { A.data = d; }));
    jobs.push(fetch('capturas/cajas.json').then(function (r) { return r.json(); }).then(function (d) { A.boxes = d.boxes; }));
    ICONS.forEach(function (ic) {
      jobs.push(fetch(DS + 'assets/iconos/' + ic[0] + '.svg').then(function (r) { return r.text(); })
        .then(function (s) { return svgImage(s, ic[1]); }).then(function (im) { A.icon[ic[0] + '|' + ic[1]] = im; }));
    });
    jobs.push(fetch(DS + 'assets/marca/isotipo.svg').then(function (r) { return r.text(); }).then(function (s) {
      var lines = [], re = /<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"\/>/g, m;
      while ((m = re.exec(s))) lines.push([+m[1], +m[2], +m[3], +m[4]]);
      var c = /<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/.exec(s);
      A.iso = { lines: lines, pupil: [+c[1], +c[2], +c[3]] };
    }));
    return Promise.all(jobs).then(function () { A.ready = true; if (cb) cb(); });
  }

  function icon(ctx, name, color, x, y, size, alpha) {
    var im = A.icon[name + '|' + color];
    if (!im || alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha == null ? 1 : alpha; ctx.drawImage(im, x, y, size, size); ctx.restore();
  }

  // ------------------------------------------------------------------ star field
  /**
   * The two seeded tiles of the design system. The stars never move or twinkle: the camera
   * does, and the near tile shifts more than the far one (parallax).
   */
  function campo(ctx, t, tl, alpha) {
    var T = tl.T;
    // Camera travel in px: a slow drift, plus the flights between scenes.
    var travel = 9 * t + 60 * E.inOut(prog(t, T.dIn - 0.3, T.dIn + 0.6)) + 120 * E.inOut(prog(t, T.dOut, T.eIn + 0.35))
      + 160 * E.inOut(prog(t, T.travelA, T.docIn)) + 40 * E.inOut(prog(t, T.hIn - 0.3, T.hIn + 0.5));
    var lift = 18 * Math.sin(t * 0.21);
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    tile(ctx, A.img.lejos, 1200, 1200, 340 - travel * 0.45, 180 - lift * 0.45);
    tile(ctx, A.img.cerca, 1700, 1300, -travel, -lift);
    ctx.restore();
  }
  function tile(ctx, im, w, h, ox, oy) {
    var x0 = ((ox % w) + w) % w - w, y0 = ((oy % h) + h) % h - h;
    for (var x = x0; x < W; x += w) for (var y = y0; y < H; y += h) ctx.drawImage(im, x, y, w, h);
  }

  // ------------------------------------------------------------------ figures
  // Line drawings in head units (crown at y≈0, about 450 units to the neck), facing LEFT.
  // Each stroke: [points, width factor, alpha]. Closed shapes: { c: [x, y, r] }.
  var ASTRONAUT = {
    eye: [99, 221],
    strokes: [
      [[[92, 92], [110, 56], [146, 26], [196, 8], [248, 4], [302, 14], [352, 40], [390, 84], [414, 140], [422, 200], [416, 262], [398, 318], [378, 358], [366, 396], [362, 440], [364, 500], [368, 552]], 1, 1],
      [[[92, 92], [80, 124], [72, 160], [68, 192], [76, 212], [67, 238], [53, 268], [39, 294], [42, 308], [56, 314], [70, 316], [68, 331], [60, 345], [67, 354], [73, 357], [64, 365], [63, 375], [73, 386], [80, 392], [72, 410], [70, 424], [82, 440], [108, 448], [140, 452], [166, 458], [174, 488], [178, 520], [182, 548]], 1, 1],
      [[[104, 446], [150, 432], [200, 410], [240, 384], [258, 362]], 0.8, 0.7],
      [[[262, 214], [283, 203], [305, 210], [316, 234], [313, 262], [301, 284], [284, 296], [268, 293]], 0.9, 0.95],
      [[[278, 226], [295, 228], [301, 246], [291, 264]], 0.7, 0.6],
      [[[92, 92], [128, 94], [166, 108], [200, 134], [222, 176], [236, 220], [242, 258]], 0.8, 0.8],
      [[[324, 226], [334, 276], [350, 330], [366, 394]], 0.8, 0.75],
      [[[140, 44], [196, 30], [252, 34]], 0.7, 0.35],
      [[[300, 60], [340, 92], [366, 140]], 0.7, 0.35],
      [[[118, 74], [168, 58], [226, 56]], 0.6, 0.28],
      [[[376, 150], [392, 200], [394, 248]], 0.6, 0.28],
      [[[176, 92], [214, 86], [256, 96]], 0.6, 0.22],
      [[[80, 198], [98, 191], [118, 189], [138, 194]], 1.5, 0.95],
      [[[90, 219], [99, 213], [111, 211], [123, 216]], 1, 1],
      [[[93, 224], [102, 229], [113, 229], [121, 225]], 0.8, 0.8],
      [[[96, 208], [110, 204], [124, 209]], 0.7, 0.4],
      [[[50, 305], [57, 300], [65, 304]], 0.8, 0.8],
      [[[73, 357], [88, 359]], 0.8, 0.8],
      [[[82, 296], [90, 318], [92, 342]], 0.7, 0.35],
      // flight polo: collar, chest, shoulder, sleeve and mission patch
      [[[180, 540], [240, 552], [306, 552], [370, 540]], 0.9, 0.9],
      [[[172, 566], [232, 580], [304, 582], [376, 566]], 0.9, 0.9],
      [[[182, 546], [168, 584], [204, 604]], 0.9, 0.9],
      [[[172, 566], [160, 620], [152, 700], [150, 820]], 1, 1],
      [[[376, 566], [432, 580], [500, 612], [540, 662], [556, 740], [560, 820]], 1, 1],
      [[[420, 652], [428, 720], [434, 820]], 0.8, 0.75],
      [[[428, 760], [492, 770], [553, 760]], 0.7, 0.6],
    ],
    circles: [[490, 700, 26, 0.8, 0.8], [490, 700, 13, 0.6, 0.55]],
    blinkHide: [10, 11, 12],
    blink: [[[90, 221], [102, 225], [114, 225], [123, 220]], 1, 1],
  };

  var SURGEON = {
    eye: [103, 221],
    strokes: [
      // head with the hair gathered in a low bun
      [[[96, 96], [114, 58], [150, 28], [200, 10], [250, 6], [304, 16], [352, 42], [388, 86], [410, 140], [418, 198], [412, 252], [398, 296]], 1, 1],
      [[[392, 344], [372, 380], [360, 420], [356, 470], [358, 520], [362, 560]], 1, 1],
      [[[96, 96], [84, 128], [77, 162], [74, 192], [80, 210], [72, 236], [61, 262], [50, 286], [52, 300], [63, 306], [76, 309], [74, 323], [66, 336], [72, 346], [78, 349], [70, 357], [69, 368], [78, 380], [84, 388], [78, 404], [80, 418], [94, 432], [120, 440], [150, 446], [172, 452], [178, 484], [180, 520], [184, 552]], 1, 1],
      [[[110, 438], [156, 426], [204, 404], [238, 382], [252, 362]], 0.8, 0.65],
      [[[96, 96], [140, 92], [190, 104], [236, 128], [276, 160], [320, 200], [360, 240], [384, 278]], 0.8, 0.8],
      [[[120, 60], [200, 46], [290, 70], [360, 130], [400, 210]], 0.7, 0.4],
      [[[110, 80], [180, 74], [260, 100], [330, 160], [380, 240]], 0.7, 0.35],
      [[[84, 196], [100, 190], [120, 188], [140, 192]], 1.2, 0.9],
      [[[94, 219], [103, 213], [115, 211], [126, 215]], 1, 1],
      [[[97, 224], [106, 228], [116, 228], [124, 224]], 0.8, 0.8],
      [[[94, 219], [88, 214]], 0.7, 0.8],
      [[[56, 298], [62, 294], [70, 298]], 0.8, 0.8],
      [[[78, 349], [92, 351]], 0.8, 0.8],
      // glasses
      [[[90, 201], [86, 220], [89, 239]], 0.9, 0.9],
      [[[90, 201], [106, 199], [124, 202]], 0.9, 0.9],
      [[[89, 239], [104, 242], [120, 237]], 0.9, 0.7],
      [[[124, 202], [190, 206], [262, 214]], 0.8, 0.85],
      // headset: band over the head, mic boom
      [[[290, 214], [304, 160], [304, 100], [286, 44], [252, 4], [214, -12]], 1, 0.95],
      [[[266, 290], [222, 332], [164, 356], [114, 362]], 1, 0.95],
      // white coat, shirt collar and stethoscope
      [[[184, 548], [232, 560], [300, 560], [364, 548]], 0.9, 0.85],
      [[[178, 560], [214, 620], [246, 700], [256, 820], [258, 930]], 1, 1],
      [[[176, 570], [164, 640], [158, 720], [158, 820], [160, 930]], 1, 1],
      [[[364, 560], [420, 580], [480, 612], [520, 660], [536, 740], [540, 820], [542, 930]], 1, 1],
      [[[346, 566], [306, 606], [262, 664], [238, 724]], 0.8, 0.75],
      // the hair gathered in a low bun: a few strands
      [[[376, 300], [394, 290], [414, 296]], 0.7, 0.5],
      [[[372, 318], [392, 312], [416, 320]], 0.7, 0.5],
    ],
    circles: [[398, 312, 32, 1, 1], [232, 738, 11, 0.8, 0.8]],
    earcup: [288, 252, 56, 78],
    mic: [108, 362],
  };

  var PATH_CACHE = new Map();
  function figurePaths(fig) {
    var c = PATH_CACHE.get(fig);
    if (c) return c;
    c = fig.strokes.map(function (s) { return { path: smoothPath(s[0], false), w: s[1], a: s[2] }; });
    PATH_CACHE.set(fig, c);
    return c;
  }

  /**
   * Draws a figure. o: { x, y, s (scale), mirror, lw (screen px), alpha, blink (0..1), skip(i) }.
   * The line keeps its width on screen at any scale.
   */
  function drawFigure(ctx, fig, o) {
    var paths = figurePaths(fig);
    var s = o.s, lw = o.lw || 2.6;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale(o.mirror ? -s : s, s);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.strokeStyle = o.color || C.text;
    ctx.fillStyle = o.color || C.text;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var blinking = o.blink > 0 && fig.blinkHide;
    paths.forEach(function (p, i) {
      if (blinking && fig.blinkHide.indexOf(i) >= 0) return;
      if (o.skip && o.skip(i)) return;
      ctx.save(); ctx.globalAlpha *= p.a; ctx.lineWidth = lw * p.w / s; ctx.stroke(p.path); ctx.restore();
    });
    if (blinking) {
      ctx.save(); ctx.lineWidth = lw / s; ctx.stroke(smoothPath(fig.blink[0], false)); ctx.restore();
    }
    (fig.circles || []).forEach(function (cc) {
      ctx.save(); ctx.globalAlpha *= cc[4]; ctx.lineWidth = lw * cc[3] / s;
      ctx.beginPath(); ctx.arc(cc[0], cc[1], cc[2], 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
    if (fig.earcup) {
      var e = fig.earcup;
      ctx.save(); ctx.lineWidth = lw / s; ctx.beginPath(); ctx.roundRect(e[0] - e[2] / 2, e[1] - e[3] / 2, e[2], e[3], 24); ctx.stroke();
      ctx.globalAlpha *= 0.55; ctx.lineWidth = lw * 0.7 / s; ctx.beginPath(); ctx.roundRect(e[0] - e[2] / 2 + 10, e[1] - e[3] / 2 + 12, e[2] - 20, e[3] - 24, 14); ctx.stroke(); ctx.restore();
    }
    if (fig.mic) {
      ctx.save(); ctx.lineWidth = lw / s; ctx.beginPath(); ctx.ellipse(fig.mic[0], fig.mic[1], 10, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // The pupil: a white dot, as in the brand mark.
    if (!blinking && o.pupil !== false) {
      ctx.beginPath(); ctx.arc(fig.eye[0], fig.eye[1], o.pupilR || 4.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** Screen position of a figure point. */
  function figPoint(o, pt) { return [o.x + (o.mirror ? -1 : 1) * pt[0] * o.s, o.y + pt[1] * o.s]; }

  // ------------------------------------------------------------------ shared pieces
  /** The simulated-data mark: the dashed "ficha" of the application's top strip. */
  function fichaSimulado(ctx, cx, cy, alpha, scale) {
    if (alpha <= 0) return;
    scale = scale || 1.25;
    var size = 14 * scale, label = 'SIMULATED DATA';
    var tw = measure(ctx, label, size, 600, 0.12), iw = 16 * scale, pad = 9 * scale, h = 28 * scale;
    var w = pad * 2 + iw + 6 * scale + tw, x = cx - w / 2, y = cy - h / 2;
    halo(ctx, x - 16, y - 12, w + 32, h + 24, alpha);
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.strokeStyle = C.strong; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 2); ctx.stroke(); ctx.setLineDash([]);
    icon(ctx, 'flask-conical', C.text2, x + pad, cy - iw / 2, iw, 1);
    text(ctx, label, x + pad + iw + 6 * scale, cy + size * 0.36, { size: size, weight: 600, color: C.text2, track: 0.12 });
    ctx.restore();
  }

  /** A reading: number and unit, the line under it, the label and the origin sign (design system "Lectura"). */
  function lectura(ctx, o) {
    var a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0) return;
    var vs = o.size || 120, us = Math.round(vs * 0.36);
    var vw = measure(ctx, o.value, vs, 300, -0.02), uw = o.unit ? measure(ctx, o.unit, us, 400) : 0;
    var gap = o.unit ? vs * 0.12 : 0, total = vw + gap + uw;
    var lw = Math.max(total, o.minLine || 0), ls = o.labelSize || 24;
    var labW = o.label ? measure(ctx, o.label, ls, 500) + (o.origin ? ls * 1.1 : 0) : 0;
    lw = Math.max(lw, labW);
    var x = o.align === 'center' ? o.x - lw / 2 : o.x;
    var vx = o.align === 'center' ? o.x - total / 2 : o.x;
    var y = o.y;
    if (o.halo !== false) halo(ctx, x - 40, y - vs * 0.95 - (o.kicker ? ls * 2 : 0), lw + 80, vs * 0.95 + ls * 3.6 + (o.kicker ? ls * 2 : 0), a);
    ctx.save(); ctx.globalAlpha *= a;
    if (o.kicker) text(ctx, o.kicker, vx, y - vs * 0.78 - ls * 0.6, { size: ls, weight: 600, color: C.text2, track: 0.12 });
    text(ctx, o.value, vx, y, { size: vs, weight: 300, track: -0.02 });
    if (o.unit) text(ctx, o.unit, vx + vw + gap, y, { size: us, weight: 400, color: C.text2 });
    var ly = y + vs * 0.2;
    line(ctx, x, ly, x + lw, ly, C.strong, 1.5, 1);
    if (o.label) {
      var lx = x;
      if (o.origin) { icon(ctx, o.origin, C.text2, lx, ly + ls * 0.55, ls * 0.75, 1); lx += ls * 1.1; }
      text(ctx, o.label, lx, ly + ls * 1.35, { size: ls, weight: 500, color: C.text2 });
    }
    if (o.note) text(ctx, o.note, x, ly + ls * 2.6, { size: ls * 0.8, weight: 400, color: C.muted });
    ctx.restore();
  }

  /** A circular control with its word in capitals (the application's navigation buttons). */
  function control(ctx, iconName, word, x, y, o) {
    o = o || {};
    var a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0) return;
    var r = o.r || 34, size = o.size || 30, filled = o.filled || 0;
    var ww = measure(ctx, word, size, 600, 0.12);
    if (o.wordLeft) halo(ctx, x - r - 30 - ww - 24, y - r - 20, r * 2 + 30 + ww + 48, r * 2 + 40, a);
    else halo(ctx, x - r - 24, y - r - 20, r * 2 + 30 + ww + 48, r * 2 + 40, a);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (filled > 0) { ctx.save(); ctx.globalAlpha *= filled; ctx.fillStyle = C.text; ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = C.strong; ctx.lineWidth = 1.5; ctx.stroke();
    var is = r * 0.95;
    icon(ctx, iconName, C.text, x - is / 2, y - is / 2, is, 1 - filled);
    if (filled > 0) icon(ctx, iconName, C.bg, x - is / 2, y - is / 2, is, filled);
    if (o.wordLeft) text(ctx, word, x - r - 22 - size * 0.12, y + size * 0.36, { size: size, weight: 600, color: C.text, track: 0.12, align: 'right' });
    else text(ctx, word, x + r + 22, y + size * 0.36, { size: size, weight: 600, color: C.text, track: 0.12 });
    ctx.restore();
  }

  /** The four corners of what is in focus (design system "Marco"). */
  function corners(ctx, x, y, w, h, len, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = C.text; ctx.lineWidth = 1.5;
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (c) {
      ctx.beginPath(); ctx.moveTo(c[0] + c[2] * len, c[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0], c[1] + c[3] * len); ctx.stroke();
    });
    ctx.restore();
  }

  function earth(ctx, x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, 'rgba(169, 200, 232, 0.35)'); g.addColorStop(1, 'rgba(169, 200, 232, 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.earth; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** The ship, as a technical drawing: command module, habitat, engine and two solar arrays. Faces left. */
  function ship(ctx, x, y, s, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = C.text; ctx.lineWidth = 2 / s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(-112, -24); ctx.lineTo(-112, 24); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-112, -26, 150, 52, 6); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(38, -34, 84, 68, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(122, -16); ctx.lineTo(152, -28); ctx.lineTo(152, 28); ctx.lineTo(122, 16); ctx.stroke();
    ctx.globalAlpha *= 0.85;
    [[-46, -112, 66, 70], [-46, 42, 66, 70]].forEach(function (r) {
      ctx.beginPath(); ctx.rect(r[0], r[1], r[2], r[3]); ctx.stroke();
      ctx.save(); ctx.globalAlpha *= 0.5; ctx.lineWidth = 1 / s;
      for (var i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(r[0] + r[2] * i / 3, r[1]); ctx.lineTo(r[0] + r[2] * i / 3, r[1] + r[3]); ctx.stroke(); }
      for (i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(r[0], r[1] + r[3] * i / 4); ctx.lineTo(r[0] + r[2], r[1] + r[3] * i / 4); ctx.stroke(); }
      ctx.restore();
    });
    ctx.beginPath(); ctx.moveTo(-13, -26); ctx.lineTo(-13, -42); ctx.moveTo(-13, 26); ctx.lineTo(-13, 42); ctx.stroke();
    ctx.lineWidth = 1.5 / s;
    [-88, -66, -44].forEach(function (px) { ctx.beginPath(); ctx.arc(px, 0, 5, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();
  }
  var SHIP_WINDOW = [-88, 0];

  // ------------------------------------------------------------------ scene A: the porthole
  var PORT = { x: 840, y: 560, r: 300, frame: 352 };
  var ASTRO_POSE = { x: 1081, y: 297, s: 0.62, mirror: true };
  // Inverse of the camera zoom of scene A: line widths are multiplied by it to stay the same on screen.
  var INV = 1;

  function hull(ctx, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.lineWidth = INV;
    var edge = new Path2D();
    edge.moveTo(-10, -10); edge.lineTo(1250, -10);
    edge.bezierCurveTo(1300, 300, 1300, 780, 1250, 1090); edge.lineTo(-10, 1090); edge.closePath();
    ctx.fillStyle = C.bg; ctx.fill(edge);
    // hull edge, fading at both ends
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(163,163,163,0)'); g.addColorStop(0.2, 'rgba(163,163,163,0.55)');
    g.addColorStop(0.8, 'rgba(163,163,163,0.55)'); g.addColorStop(1, 'rgba(163,163,163,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2 * INV;
    ctx.beginPath(); ctx.moveTo(1250, -10); ctx.bezierCurveTo(1300, 300, 1300, 780, 1250, 1090); ctx.stroke();
    // panel seams with rivets
    ctx.strokeStyle = C.border; ctx.fillStyle = C.border; ctx.lineWidth = 1.5 * INV;
    [130, 990].forEach(function (y) {
      ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(1262, y); ctx.stroke();
      for (var x = 20; x < 1250; x += 44) { ctx.beginPath(); ctx.arc(x, y + 12, 1.8 * INV, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.restore();
  }

  function porthole(ctx, t, tl, alpha) {
    var T = tl.T;
    ctx.save(); ctx.globalAlpha *= alpha;
    // glass: dark cabin behind the crew member
    ctx.save();
    ctx.beginPath(); ctx.arc(PORT.x, PORT.y, PORT.r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#030303'; ctx.fillRect(PORT.x - PORT.r, PORT.y - PORT.r, PORT.r * 2, PORT.r * 2);
    // the cabin behind him: a small panel with three switches, clear of his outline
    ctx.save(); ctx.globalAlpha *= 0.26; ctx.strokeStyle = C.text2; ctx.fillStyle = C.text2; ctx.lineWidth = 2 * INV; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.roundRect(586, 540, 150, 104, 6); ctx.stroke();
    [614, 654, 694].forEach(function (sx) { ctx.beginPath(); ctx.arc(sx, 610, 6, 0, Math.PI * 2); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(606, 566); ctx.lineTo(714, 566); ctx.stroke();
    ctx.restore();
    // the crew member: floats, blinks
    var bob = Math.sin(t * 1.9) * 3.2, tilt = Math.sin(t * 1.3 + 0.6) * 0.006;
    var blink = span(t, T.blink, T.blink + 0.16, 0.04) > 0.2 ? 1 : 0;
    ctx.save(); ctx.translate(PORT.x, PORT.y); ctx.rotate(tilt); ctx.translate(-PORT.x, -PORT.y);
    drawFigure(ctx, ASTRONAUT, { x: ASTRO_POSE.x, y: ASTRO_POSE.y + bob, s: ASTRO_POSE.s, mirror: true, lw: 2.6 * INV, blink: blink });
    ctx.restore();
    // glass reflection, in the upper left, away from his face
    ctx.save(); ctx.globalAlpha *= 0.06; ctx.strokeStyle = C.text; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.arc(PORT.x, PORT.y, PORT.r - 36, -2.75, -2.2); ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(PORT.x, PORT.y, PORT.r - 70, -2.65, -2.35); ctx.stroke(); ctx.restore();
    ctx.restore();
    // frame and bolts
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.4 * INV;
    ctx.beginPath(); ctx.arc(PORT.x, PORT.y, PORT.r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2 * INV; ctx.beginPath(); ctx.arc(PORT.x, PORT.y, PORT.frame, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha *= 0.5; ctx.lineWidth = 1.2 * INV; ctx.beginPath(); ctx.arc(PORT.x, PORT.y, PORT.r + 9, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha /= 0.5;
    ctx.lineWidth = 1.6 * INV;
    for (var i = 0; i < 16; i++) {
      var ang = (i / 16) * Math.PI * 2 + 0.1;
      ctx.beginPath(); ctx.arc(PORT.x + Math.cos(ang) * 328, PORT.y + Math.sin(ang) * 328, 6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  /** Camera of scene A: a slow push, then the flight into the right eye. */
  function camA(t, tl) {
    var T = tl.T;
    var eye = figPoint(ASTRO_POSE, ASTRONAUT.eye);
    var push = 1 + 0.05 * E.smooth(prog(t, 0, T.zoomA));
    var k = E.in(prog(t, T.zoomA, T.zoomB));
    var z = push * Math.pow(46, k);
    var fx = lerp(PORT.x, eye[0], E.smooth(prog(t, T.zoomA - 0.2, T.zoomB - 0.2)));
    var fy = lerp(PORT.y, eye[1], E.smooth(prog(t, T.zoomA - 0.2, T.zoomB - 0.2)));
    var sx = lerp(PORT.x, 960, E.smooth(prog(t, T.zoomA - 0.2, T.zoomB - 0.1)));
    var sy = lerp(PORT.y, 540, E.smooth(prog(t, T.zoomA - 0.2, T.zoomB - 0.1)));
    return { fx: fx, fy: fy, sx: sx, sy: sy, z: z };
  }

  function sceneA(ctx, t, tl) {
    var T = tl.T;
    if (t > T.zoomB + 0.05) return;
    var cam = camA(t, tl), a = 1 - prog(t, T.zoomB - 0.12, T.zoomB + 0.05);
    ctx.save();
    ctx.translate(cam.sx, cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.fx, -cam.fy);
    INV = 1 / cam.z;
    hull(ctx, a);
    // Earth, out in space to the right
    earth(ctx, 1600, 470, 7, a);
    porthole(ctx, t, tl, a);
    INV = 1;
    ctx.restore();
    // callout to the right eye, then the overlays of the first frame
    var eye = figPoint(ASTRO_POSE, ASTRONAUT.eye);
    var es = [(eye[0] - cam.fx) * cam.z + cam.sx, (eye[1] - cam.fy) * cam.z + cam.sy];
    var ca = span(t, T.callout, T.zoomA + 0.25, 0.15);
    if (ca > 0) {
      ctx.save(); ctx.globalAlpha *= ca;
      var lx = es[0] + 150, ly = es[1] - 120;
      line(ctx, es[0] + 10, es[1] - 8, lx, ly, C.text, 1.5, 0.9);
      ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(es[0] + 10, es[1] - 8, 3.5, 0, Math.PI * 2); ctx.fill();
      chipOjo(ctx, lx + 8, ly - 22, 1);
      ctx.restore();
    }
    var ra = 1 - prog(t, T.zoomA - 0.1, T.zoomA + 0.2);
    // Earth label
    halo(ctx, 1530, 495, 140, 50, ra);
    text(ctx, 'EARTH', 1600, 528, { size: 18, weight: 600, color: C.text2, track: 0.12, align: 'center', alpha: ra });
    // DAY 126, written from the first frame
    lectura(ctx, { x: 118, y: 880, value: '126', size: 168, kicker: 'DAY', label: 'SIM-CREW-C · simulated crew member', labelSize: 24, minLine: 300, alpha: ra, halo: false });
  }

  /** The application's eye chip: "OD" in a box and the eye's name. */
  function chipOjo(ctx, x, y, alpha, size) {
    size = size || 22;
    ctx.save(); ctx.globalAlpha *= alpha;
    var bw = measure(ctx, 'OD', size, 600, 0.12) + size * 0.8, bh = size * 1.55;
    var nw = measure(ctx, 'RIGHT EYE', size, 600, 0.12);
    halo(ctx, x - 14, y - 10, bw + nw + size * 1.4, bh + 20, 1);
    ctx.strokeStyle = C.strong; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 2); ctx.stroke();
    text(ctx, 'OD', x + size * 0.4, y + bh / 2 + size * 0.36, { size: size, weight: 600, track: 0.12 });
    text(ctx, 'RIGHT EYE', x + bw + size * 0.55, y + bh / 2 + size * 0.36, { size: size, weight: 600, track: 0.12 });
    ctx.restore();
  }

  // ------------------------------------------------------------------ scene B: the scan through the nerve
  // Crop of the 768 x 496 scan. It starts at row 64 so that the scan before the flight, moved
  // about 50 to 60 rows to align it, still has image at the top.
  var SCAN = { c0: 64, r0: 64, cw: 640, rh: 300, x: 300, y: 290, w: 1320 };
  SCAN.h = SCAN.w * SCAN.rh / SCAN.cw;

  function scanPoint(col, row, cam) {
    var x = SCAN.x + (col - SCAN.c0) / SCAN.cw * SCAN.w, y = SCAN.y + (row - SCAN.r0) / SCAN.rh * SCAN.h;
    return [(x - 960) * cam + 960, (y - 590) * cam + 590];
  }
  /**
   * The instrument places each capture at its own depth and tilt. To compare the two scans,
   * the one before the flight is moved so that its two opening points of Bruch's membrane (the
   * fixed points the engine measures from) fall on today's: row + shift(col), linear in col.
   */
  function registration() {
    var a = A.data.images.beforeOD.bmo, b = A.data.images.OD.scan.bmo;
    var d0 = b[0].rowPx - a[0].rowPx, d1 = b[1].rowPx - a[1].rowPx;
    var c0 = (a[0].columnPx + b[0].columnPx) / 2, c1 = (a[1].columnPx + b[1].columnPx) / 2;
    var slope = (d1 - d0) / (c1 - c0);
    return { at: function (col) { return d0 + slope * (col - c0); }, slope: slope, d0: d0, c0: c0 };
  }
  function ilmPath(values, cam, shift) {
    var p = new Path2D(), pen = false;
    for (var c = SCAN.c0; c <= SCAN.c0 + SCAN.cw; c += 2) {
      var v = values[c];
      if (v == null) { pen = false; continue; }
      var q = scanPoint(c, v + (shift ? shift.at(c) : 0), cam);
      if (pen) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]);
      pen = true;
    }
    return p;
  }
  /** Draws a scan image so that its (col, row) lands on scanPoint(col, row + shift(col)). */
  function drawScan(ctx, im, cam, shift) {
    var kx = SCAN.w / SCAN.cw * cam, ky = SCAN.h / SCAN.rh * cam;
    var o = scanPoint(0, 0, cam);
    var s0 = shift ? shift.at(0) : 0, s1 = shift ? shift.slope : 0;
    ctx.save();
    ctx.transform(kx, s1 * ky, 0, ky, o[0], o[1] + s0 * ky);
    ctx.drawImage(im, 0, 0);
    ctx.restore();
  }

  function sceneB(ctx, t, tl) {
    var T = tl.T, d = A.data;
    if (t < T.scanIn - 0.15 || t > T.scanOut + 0.35) return;
    var aIn = E.out(prog(t, T.scanIn - 0.15, T.scanIn + 0.25)), aOut = 1 - E.inOut(prog(t, T.scanOut - 0.1, T.scanOut + 0.3));
    var a = Math.min(aIn, aOut);
    var cam = 1 + 0.035 * E.smooth(prog(t, T.scanIn, T.scanOut)) - 0.06 * (1 - aOut);
    var p0 = scanPoint(SCAN.c0, SCAN.r0, cam), p1 = scanPoint(SCAN.c0 + SCAN.cw, SCAN.r0 + SCAN.rh, cam);
    var x = p0[0], y = p0[1], w = p1[0] - p0[0], h = p1[1] - p0[1];
    // reveal: a circle that opens from the pupil
    var rr = lerp(110, 1200, E.inOut(prog(t, T.scanIn - 0.15, T.scanIn + 0.45)));
    ctx.save();
    ctx.globalAlpha *= a;
    halo(ctx, x - 30, y - 90, w + 60, h + 150, 1);
    ctx.beginPath(); ctx.arc(960, 540, rr, 0, Math.PI * 2); ctx.clip();
    var wipe = E.inOut(prog(t, T.wipeA, T.wipeB));
    var wx = x + w * wipe;
    var reg = registration();
    // before the flight (aligned on today's membrane opening), then today from the left as the wipe passes
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = C.bg; ctx.fillRect(x, y, w, h);
    drawScan(ctx, A.img.before, cam, reg);
    if (wipe > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, wx - x, h); ctx.clip();
      ctx.fillStyle = C.bg; ctx.fillRect(x, y, w, h);
      drawScan(ctx, A.img.today, cam, null);
      ctx.restore();
    }
    // the retina surface found by the engine on each image; after the wipe, the one before the
    // flight stays as a dashed line, so the swelling is the gap between the two
    var dashed = prog(t, T.wipeB - 0.05, T.wipeB + 0.35);
    ctx.lineWidth = 2.4; ctx.strokeStyle = C.text; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.save(); ctx.beginPath(); ctx.rect(wx, y, x + w - wx, h); ctx.clip(); ctx.globalAlpha *= 0.9; ctx.stroke(ilmPath(d.images.beforeOD.ilmPx, cam, reg)); ctx.restore();
    if (dashed > 0) {
      ctx.save(); ctx.globalAlpha *= dashed; ctx.setLineDash([9, 7]); ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 5; ctx.stroke(ilmPath(d.images.beforeOD.ilmPx, cam, reg));
      ctx.strokeStyle = C.text; ctx.lineWidth = 2.2; ctx.stroke(ilmPath(d.images.beforeOD.ilmPx, cam, reg));
      ctx.restore();
    }
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, wx - x, h); ctx.clip(); ctx.stroke(ilmPath(d.images.OD.scan.ilmPx, cam, null)); ctx.restore();
    ctx.restore();
    corners(ctx, x - 10, y - 10, w + 20, h + 20, 22, 1);
    // the wipe line and its two tags
    if (wipe > 0 && wipe < 1) {
      var la = span(wipe, 0, 1, 0.08);
      line(ctx, wx, y - 10, wx, y + h + 34, C.text, 2, la);
      text(ctx, 'DAY 126', wx - 14, y + h + 44, { size: 22, weight: 600, track: 0.12, align: 'right', alpha: la });
      text(ctx, 'BEFORE FLIGHT', wx + 14, y + h + 44, { size: 22, weight: 600, track: 0.12, color: C.text2, alpha: la });
    }
    var before = 1 - prog(t, T.wipeA - 0.05, T.wipeA + 0.15), after = prog(t, T.wipeB - 0.1, T.wipeB + 0.1);
    text(ctx, 'BEFORE FLIGHT', x + w, y - 44, { size: 22, weight: 600, track: 0.12, color: C.text2, align: 'right', alpha: before });
    text(ctx, 'DAY 126', x + w, y - 44, { size: 22, weight: 600, track: 0.12, align: 'right', alpha: after });
    ctx.restore();
    // header: which eye, which scan
    ctx.save(); ctx.globalAlpha *= a * prog(t, T.scanIn + 0.2, T.scanIn + 0.45);
    chipOjo(ctx, x, y - 70, 1);
    text(ctx, 'Scan through the optic nerve', x + 250, y - 44, { size: 24, weight: 500, color: C.text2 });
    ctx.restore();
    // legend, once the before line is dashed
    var lg = a * prog(t, T.wipeB, T.wipeB + 0.3);
    if (lg > 0) {
      var ly = y + h + 52;
      halo(ctx, x - 20, ly - 36, w + 40, 60, lg);
      ctx.save(); ctx.globalAlpha *= lg;
      line(ctx, x, ly - 7, x + 44, ly - 7, C.text, 2.4, 1);
      var lx = x + 58 + text(ctx, 'Day 126', x + 58, ly, { size: 22, weight: 500, color: C.text2 }) + 40;
      line(ctx, lx, ly - 7, lx + 44, ly - 7, C.text, 2.2, 1, [9, 7]);
      lx += 58 + text(ctx, 'Before the flight', lx + 58, ly, { size: 22, weight: 500, color: C.text2 }) + 40;
      text(ctx, 'Retina surface found by the engine · scans aligned on the membrane under the retina', lx, ly, { size: 20, weight: 400, color: C.muted });
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ scene C: seventy percent
  function sceneC(ctx, t, tl) {
    var T = tl.T;
    if (t < T.cIn - 0.1 || t > T.cOut + 0.4) return;
    var a = Math.min(E.out(prog(t, T.cIn, T.cIn + 0.35)), 1 - E.inOut(prog(t, T.cOut - 0.05, T.cOut + 0.35)));
    var drift = 18 * E.smooth(prog(t, T.cIn, T.cOut + 0.4));
    ctx.save(); ctx.globalAlpha *= a;
    // ten crew members; seven lit
    var n = 10, gap = 150, x0 = 960 - (n - 1) * gap / 2 - drift, base = 800;
    halo(ctx, x0 - 120, base - 210, (n - 1) * gap + 240, 260, 1);
    for (var i = 0; i < n; i++) {
      var lit = i < 7 ? E.out(prog(t, T.cLit + i * 0.05, T.cLit + i * 0.05 + 0.25)) : 0;
      var col = lit > 0 ? C.text : C.border;
      drawFigure(ctx, ASTRONAUT, { x: x0 + i * gap + 50, y: base - 185, s: 0.24, mirror: true, lw: 2, alpha: 1, color: C.border, pupilR: 6 });
      if (lit > 0) drawFigure(ctx, ASTRONAUT, { x: x0 + i * gap + 50, y: base - 185, s: 0.24, mirror: true, lw: 2.2, alpha: lit, color: col, pupilR: 6 });
    }
    // the reading, already written when it appears
    var ra = E.out(prog(t, T.cLit - 0.25, T.cLit + 0.05));
    lectura(ctx, { x: 960 - drift * 0.5, y: 430, value: '70', unit: '%', size: 210, align: 'center', label: 'of astronauts on long missions show some sign of SANS', labelSize: 30, origin: 'origen-reference', note: '', alpha: ra });
    text(ctx, 'Source: NASA evidence report on SANS · published data', 960 - drift * 0.5, 560, { size: 20, weight: 400, color: C.muted, align: 'center', alpha: ra });
    ctx.restore();
  }

  // ------------------------------------------------------------------ scene D: the ship and the Earth
  var EARTH_D = [330, 600], SHIP_D = [1560, 590];
  function linkLayer(ctx, t, tl, a, o) {
    o = o || {};
    var T = tl.T;
    earth(ctx, EARTH_D[0], EARTH_D[1], 10, a);
    ship(ctx, SHIP_D[0], SHIP_D[1], 1.05, a);
    // the dashed link: not firm, slow
    var lk = o.link == null ? E.inOut(prog(t, T.link, T.link + 0.5)) : o.link;
    if (lk > 0) {
      var x1 = SHIP_D[0] - 170, x2 = EARTH_D[0] + 30;
      line(ctx, x1, SHIP_D[1] + 2, lerp(x1, x2, lk), lerp(SHIP_D[1] + 2, EARTH_D[1], lk), C.strong, 1.6, a, [10, 9]);
    }
    halo(ctx, EARTH_D[0] - 120, EARTH_D[1] + 40, 240, 90, a);
    text(ctx, 'EARTH', EARTH_D[0], EARTH_D[1] + 76, { size: 20, weight: 600, color: C.text2, track: 0.12, align: 'center', alpha: a });
    halo(ctx, SHIP_D[0] - 170, SHIP_D[1] + 120, 340, 70, a);
    text(ctx, 'SIM-CREW-C · DAY 126', SHIP_D[0], SHIP_D[1] + 160, { size: 20, weight: 600, color: C.text2, track: 0.12, align: 'center', alpha: a });
  }

  function sceneD(ctx, t, tl) {
    var T = tl.T;
    if (t < T.dIn - 0.1 || t > T.eIn + 0.45) return;
    var a = E.out(prog(t, T.dIn, T.dIn + 0.4));
    // flight into the ship's window at the end
    // the window comes to the centre first, then the camera goes through it
    var kl = prog(t, T.dOut, T.eIn + 0.15);
    var wx = SHIP_D[0] + SHIP_WINDOW[0] * 1.05, wy = SHIP_D[1] + SHIP_WINDOW[1] * 1.05;
    var z = Math.pow(30, E.in(kl));
    ctx.save();
    ctx.globalAlpha *= a * (1 - prog(t, T.eIn - 0.08, T.eIn + 0.12));
    ctx.translate(lerp(wx, 960, E.out(kl)), lerp(wy, 540, E.out(kl))); ctx.scale(z, z); ctx.translate(-wx, -wy);
    linkLayer(ctx, t, tl, 1);
    // the specialist on the Earth
    var sa = span(t, T.specialist, T.dOut + 0.2, 0.2);
    if (sa > 0) {
      ctx.save(); ctx.globalAlpha *= sa;
      line(ctx, EARTH_D[0], EARTH_D[1] - 18, EARTH_D[0], EARTH_D[1] - 74, C.text, 1.5, 0.9);
      halo(ctx, EARTH_D[0] - 160, EARTH_D[1] - 140, 320, 66, 1);
      icon(ctx, 'stethoscope', C.text, EARTH_D[0] - 132, EARTH_D[1] - 124, 30, 1);
      text(ctx, 'THE SPECIALIST', EARTH_D[0] - 90, EARTH_D[1] - 98, { size: 24, weight: 600, track: 0.12 });
      ctx.restore();
    }
    // a single ring when the voice says "on Earth"
    var ring = prog(t, T.earthRing, T.earthRing + 0.9);
    if (ring > 0 && ring < 1) {
      ctx.save(); ctx.strokeStyle = C.earth; ctx.globalAlpha *= (1 - ring) * 0.8; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(EARTH_D[0], EARTH_D[1], 14 + ring * 60, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // a pulse travelling the link, slowly
    var pu = prog(t, T.link + 0.35, T.dOut + 0.1);
    if (pu > 0 && pu < 1) {
      var px = lerp(SHIP_D[0] - 170, EARTH_D[0] + 30, pu), py = lerp(SHIP_D[1] + 2, EARTH_D[1], pu);
      ctx.save(); ctx.fillStyle = C.text; ctx.globalAlpha *= span(pu, 0, 1, 0.1); ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    var ra = Math.min(E.out(prog(t, T.link, T.link + 0.2)), 1 - prog(t, T.dOut - 0.25, T.dOut - 0.05));
    lectura(ctx, { x: 960, y: 420, value: '40', unit: 'min', size: 170, align: 'center', kicker: 'UP TO', label: 'for a signal to reach Earth and come back, at Mars distance', labelSize: 26, origin: 'origen-reference', alpha: ra });
  }

  // ------------------------------------------------------------------ scene E: the capture, then the result screen
  function box(name) { return A.boxes[name]; }
  var OFF = null;
  function offscreen() {
    if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; }
    return OFF;
  }
  /** Parts of the result screen, in CSS px of the 1920 x 1080 view. */
  var PARTS = {
    franja: [0, 0, 1920, 84], izq: [0, 84, 338, 996], der: [1582, 84, 338, 996],
    centro: [338, 84, 1244, 900], nav: [338, 984, 1244, 96],
  };
  function drawScreenPart(ctx, part, dx, dy, alpha) {
    if (alpha <= 0) return;
    var p = PARTS[part], im = A.img.screen, k = im.width / 1920;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.drawImage(im, p[0] * k, p[1] * k, p[2] * k, p[3] * k, p[0] + dx, p[1] + dy, p[2], p[3]);
    ctx.restore();
  }
  function lensCircle() { var b = box('lente-od'); return [b.x + b.w / 2, b.y + b.h / 2, b.w / 2]; }

  /** The fundus disc with the 48 radial scans, as the capture screen draws them. */
  function captureDisc(ctx, t, tl, cx, cy, r, alpha) {
    var T = tl.T, d = A.data, op = d.images.OD.opening;
    var crop = 950, bx = Math.round(op.centerPx[0] - crop / 2), by = Math.round(op.centerPx[1] - crop / 2);
    ctx.save(); ctx.globalAlpha *= alpha;
    // glow and disc
    ctx.save(); ctx.shadowColor = 'rgba(255,255,255,0.18)'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(A.img.fundus, cx - r, cy - r, r * 2, r * 2);
    var v = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    // scans: done ones thin, the one being taken thick
    var sweep = prog(t, T.sweepA, T.sweepB), scans = d.images.OD.scans, n = scans.length;
    var cur = Math.min(n - 1, Math.floor(sweep * n));
    ctx.lineCap = 'round';
    for (var i = 0; i < n && sweep > 0; i++) {
      if (i > cur) break;
      var s = scans[i];
      var a1 = [(s.fromPx[0] - bx) / crop, (s.fromPx[1] - by) / crop], a2 = [(s.toPx[0] - bx) / crop, (s.toPx[1] - by) / crop];
      ctx.strokeStyle = C.text;
      ctx.globalAlpha = alpha * (i === cur && sweep < 1 ? 1 : 0.55);
      ctx.lineWidth = i === cur && sweep < 1 ? 3.2 : 1.1;
      ctx.beginPath(); ctx.moveTo(cx - r + a1[0] * 2 * r, cy - r + a1[1] * 2 * r); ctx.lineTo(cx - r + a2[0] * 2 * r, cy - r + a2[1] * 2 * r); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function sceneE(ctx, t, tl) {
    var T = tl.T;
    if (t < T.eIn || t > T.cuts[0] + 0.02) return;
    var L = lensCircle();
    // the disc: born big in the centre, then settles into its place on the screen
    var settle = E.inOut(prog(t, T.settle, T.screen + 0.25));
    var born = E.out(prog(t, T.eIn, T.eIn + 0.3));
    var cx = lerp(960, L[0], settle), cy = lerp(520, L[1], settle), r = lerp(lerp(40, 330, born), L[2], settle);
    var view = E.smooth(prog(t, T.screen + 0.3, T.cuts[0])) * 0.025;
    ctx.save();
    ctx.translate(960, 540); ctx.scale(1 + view, 1 + view); ctx.translate(-960, -540);
    // the result screen builds around the disc
    var sa = E.out(prog(t, T.screen, T.screen + 0.3));
    drawScreenPart(ctx, 'franja', 0, 0, E.out(prog(t, T.eIn + 0.1, T.eIn + 0.4)));
    drawScreenPart(ctx, 'izq', -40 * (1 - sa), 0, sa);
    drawScreenPart(ctx, 'der', 40 * (1 - sa), 0, sa);
    drawScreenPart(ctx, 'centro', 0, 0, E.out(prog(t, T.screen + 0.08, T.screen + 0.4)));
    drawScreenPart(ctx, 'nav', 0, 20 * (1 - sa), E.out(prog(t, T.screen + 0.15, T.screen + 0.45)));
    var da = 1 - prog(t, T.screen + 0.12, T.screen + 0.4);
    if (da > 0) captureDisc(ctx, t, tl, cx, cy, r, da * born);
    // capture readout under the disc, while it is big
    var ca = E.out(prog(t, T.eIn + 0.15, T.eIn + 0.35)) * (1 - prog(t, T.settle - 0.05, T.settle + 0.15));
    if (ca > 0) {
      var sweep = prog(t, T.sweepA, T.sweepB), nScans = Math.max(1, Math.round(sweep * 48));
      lectura(ctx, { x: 960, y: 960, value: String(nScans), unit: 'of 48', size: 84, align: 'center', label: sweep < 1 ? 'Taking scans' : 'Measuring', labelSize: 24, alpha: ca, minLine: 260 });
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ scene F: four cuts
  // Each cut frames a piece of the result screen (CSS px of the 1920 x 1080 view). The pieces
  // were captured at 4x, so no cut zooms more than 4x.
  // context: how much of the rest of the screen shows, dimmed; pad: CSS px of the piece kept around its frame.
  var CUTS = [
    { word: 'WHAT CHANGED', icon: 'eye', piece: 'pieza-ocular-od', pieceBox: 'ocular-od', frame: [600, 92, 310, 460], context: 0.3, pad: 34 },
    { word: 'HOW MUCH', icon: 'ruler', piece: 'pieza-ocular-od', pieceBox: 'ocular-od', frame: [648, 590, 212, 146], context: 0.16, pad: 14 },
    { word: 'HOW SURE', icon: 'target', piece: 'pieza-seguro', pieceBox: 'seguro', frame: [1610, 100, 284, 250], context: 0.24, pad: 34 },
    { word: 'WHAT TO DO NEXT', icon: 'list-checks', piece: 'pieza-pasos', pieceBox: 'pasos', frame: [28, 424, 280, 150], context: 0, pad: 12 },
  ];
  var CUT_AT = [1010, 600], CUT_MAX = [1500, 800];
  function sceneF(ctx, t, tl) {
    var T = tl.T;
    if (t < T.cuts[0] || t >= T.cutsEnd) return;
    var i = T.cuts.length - 1;
    while (i > 0 && t < T.cuts[i]) i--;
    var cut = CUTS[i], start = T.cuts[i], end = i + 1 < T.cuts.length ? T.cuts[i + 1] : T.cutsEnd;
    var f = cut.frame;
    var z = Math.min(4, CUT_MAX[0] / f[2], CUT_MAX[1] / f[3]) * (1 + 0.035 * E.smooth(prog(t, start, end)));
    var cx = f[0] + f[2] / 2, cy = f[1] + f[3] / 2;
    var e = CUT_AT[0] - cx * z, fy = CUT_AT[1] - cy * z;
    // context: the rest of the screen (without its top strip), dimmed and fading away from the piece
    if (cut.context > 0) {
      var oc = offscreen(), o = oc.getContext('2d'), k = A.img.screen.width / 1920;
      o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H);
      o.setTransform(z, 0, 0, z, e, fy);
      o.drawImage(A.img.screen, 0, 84 * k, 1920 * k, 996 * k, 0, 84, 1920, 996);
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = 'destination-in';
      var g = o.createRadialGradient(CUT_AT[0], CUT_AT[1], 260, CUT_AT[0], CUT_AT[1], 980);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = g; o.fillRect(0, 0, W, H);
      o.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.globalAlpha = cut.context; ctx.drawImage(oc, 0, 0); ctx.restore();
    }
    // the piece, sharp, cut to its frame and on its own veil: no star behind its text
    var b = box(cut.pieceBox), pad = cut.pad;
    var r0 = [Math.max(b.x, f[0] - pad), Math.max(b.y, f[1] - pad)];
    var r1 = [Math.min(b.x + b.w, f[0] + f[2] + pad), Math.min(b.y + b.h, f[1] + f[3] + pad)];
    halo(ctx, e + r0[0] * z - 30, fy + r0[1] * z - 30, (r1[0] - r0[0]) * z + 60, (r1[1] - r0[1]) * z + 60, 1);
    ctx.save();
    ctx.setTransform(z, 0, 0, z, e, fy);
    ctx.beginPath(); ctx.rect(r0[0], r0[1], r1[0] - r0[0], r1[1] - r0[1]); ctx.clip();
    ctx.drawImage(A.img[cut.piece], b.x, b.y, b.w, b.h);
    ctx.restore();
    // its word, at the top left
    control(ctx, cut.icon, cut.word, 132, 132, { r: 40, size: 34, alpha: 1 });
  }

  // ------------------------------------------------------------------ scene G: the report reaches the flight surgeon
  var DOC = { x: 1300, y: 250, s: 0.78 };
  var MONITOR = { x: 236, y: 210, w: 880, h: 495 };
  var DESK = 965;
  var TALK = [1296, 926];

  function surgeonScene(ctx, t, tl, alpha) {
    var T = tl.T;
    ctx.save(); ctx.globalAlpha *= alpha;
    // the monitor, with the report on it, on one stand
    var mx = MONITOR.x + MONITOR.w / 2;
    ctx.fillStyle = C.bg; ctx.fillRect(MONITOR.x, MONITOR.y, MONITOR.w, MONITOR.h);
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(MONITOR.x - 14, MONITOR.y - 14, MONITOR.w + 28, MONITOR.h + 28, 8); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(mx - 22, MONITOR.y + MONITOR.h + 14, 44, DESK - 26 - (MONITOR.y + MONITOR.h + 14)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx - 130, DESK - 12); ctx.lineTo(mx + 130, DESK - 12); ctx.moveTo(mx - 110, DESK - 26); ctx.lineTo(mx + 110, DESK - 26); ctx.stroke();
    var on = E.out(prog(t, T.onMonitor, T.onMonitor + 0.35));
    if (on > 0) {
      ctx.save(); ctx.globalAlpha *= on;
      ctx.drawImage(A.img.screen, MONITOR.x, MONITOR.y, MONITOR.w, MONITOR.h);
      ctx.restore();
    }
    // the flight surgeon, behind the desk; her hand goes to the talk control
    var press = E.inOut(prog(t, T.press, T.press + 0.3));
    var nod = Math.sin(prog(t, T.onMonitor + 0.3, T.onMonitor + 1.1) * Math.PI) * 0.012;
    ctx.save(); ctx.translate(DOC.x + 200, DOC.y + 300); ctx.rotate(-nod); ctx.translate(-(DOC.x + 200), -(DOC.y + 300));
    drawFigure(ctx, SURGEON, { x: DOC.x, y: DOC.y + Math.sin(t * 1.4) * 1.5, s: DOC.s, mirror: false, lw: 2.6, blink: span(t, T.onMonitor + 0.9, T.onMonitor + 1.05, 0.03) > 0.3 ? 1 : 0 });
    ctx.restore();
    // desk: black in front of her, with its edge
    var g = ctx.createLinearGradient(80, 0, 1840, 0);
    g.addColorStop(0, 'rgba(163,163,163,0)'); g.addColorStop(0.1, 'rgba(163,163,163,0.7)'); g.addColorStop(0.9, 'rgba(163,163,163,0.7)'); g.addColorStop(1, 'rgba(163,163,163,0)');
    ctx.fillStyle = C.bg; ctx.fillRect(80, DESK, 1760, H - DESK + 10);
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(80, DESK); ctx.lineTo(1840, DESK); ctx.stroke();
    // the talk control on the desk (its word to the left), then her arm over it
    control(ctx, 'circle-dot', 'TALK', TALK[0], TALK[1], { r: 24, size: 20, wordLeft: true, filled: E.out(prog(t, T.press + 0.22, T.press + 0.36)), alpha: 1 });
    arm(ctx, press);
    // who she is
    var la = E.out(prog(t, T.docIn + 0.25, T.docIn + 0.55));
    ctx.save(); ctx.globalAlpha *= la;
    line(ctx, 1492, 236, 1508, 170, C.text, 1.5, 0.9);
    halo(ctx, 1480, 76, 400, 110, 1);
    icon(ctx, 'stethoscope', C.text, 1500, 96, 32, 1);
    text(ctx, 'FLIGHT SURGEON', 1546, 122, { size: 26, weight: 600, track: 0.12 });
    text(ctx, 'on Earth', 1546, 156, { size: 22, weight: 500, color: C.text2 });
    ctx.restore();
    ctx.restore();
  }

  /** Her arm, in the coat sleeve: the forearm rests on the desk; the hand slides to the talk control. */
  function arm(ctx, k) {
    var s = DOC.s;
    var sh = [DOC.x + 470 * s, DOC.y + 640 * s];                   // shoulder joint
    var elbow = [sh[0] - 10 - 30 * k, DESK - 34];                   // elbow on the desk
    var hand = [lerp(1392, TALK[0] + 16, k), lerp(DESK - 40, TALK[1] - 6, k)]; // fingertips
    var wrist = [hand[0] + 64, hand[1] - 2];
    var paths = [
      // upper arm, both edges, into the elbow
      smoothPath([[sh[0] - 40, sh[1] + 10], [sh[0] - 46, sh[1] + 90], [elbow[0] - 34, elbow[1] - 30]], false),
      smoothPath([[sh[0] + 44, sh[1] + 16], [sh[0] + 40, sh[1] + 100], [elbow[0] + 40, elbow[1] + 4], [elbow[0] + 10, elbow[1] + 26]], false),
      // forearm along the desk
      smoothPath([[elbow[0] - 34, elbow[1] - 30], [lerp(elbow[0], wrist[0], 0.5), elbow[1] - 24], [wrist[0] + 6, wrist[1] - 20]], false),
      smoothPath([[elbow[0] + 10, elbow[1] + 26], [lerp(elbow[0], wrist[0], 0.5), elbow[1] + 22], [wrist[0] + 6, wrist[1] + 16]], false),
      // the hand
      smoothPath([[wrist[0], wrist[1] - 18], [hand[0] + 30, hand[1] - 20], [hand[0] + 4, hand[1] - 10], [hand[0], hand[1] + 2], [hand[0] + 10, hand[1] + 14], [hand[0] + 38, hand[1] + 18], [wrist[0], wrist[1] + 14]], false),
    ];
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // fill black first, so the desk line does not show through the arm
    var body = new Path2D();
    body.moveTo(elbow[0] - 34, elbow[1] - 30); body.lineTo(wrist[0] + 6, wrist[1] - 20); body.lineTo(hand[0], hand[1]);
    body.lineTo(wrist[0] + 6, wrist[1] + 16); body.lineTo(elbow[0] + 10, elbow[1] + 26); body.closePath();
    ctx.fillStyle = C.bg; ctx.fill(body);
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.6;
    paths.forEach(function (p) { ctx.stroke(p); });
    // the coat cuff and two fingers
    ctx.globalAlpha *= 0.7; ctx.lineWidth = 1.8;
    ctx.stroke(smoothPath([[wrist[0] + 18, wrist[1] - 20], [wrist[0] + 22, wrist[1]], [wrist[0] + 18, wrist[1] + 16]], false));
    ctx.stroke(smoothPath([[hand[0] + 8, hand[1] - 2], [hand[0] + 30, hand[1] - 4]], false));
    ctx.stroke(smoothPath([[hand[0] + 10, hand[1] + 7], [hand[0] + 32, hand[1] + 7]], false));
    ctx.restore();
  }

  function sceneG(ctx, t, tl) {
    var T = tl.T;
    if (t < T.reportA || t > T.gOut + 0.4) return;
    var gOut = 1 - E.inOut(prog(t, T.gOut - 0.1, T.gOut + 0.3));
    // 1. the screen shrinks into a report card and travels the link to the Earth
    var travel = E.inOut(prog(t, T.travelA, T.travelB));
    var la = E.out(prog(t, T.reportA + 0.05, T.travelA + 0.15)) * (1 - prog(t, T.travelB + 0.12, T.travelB + 0.36));
    if (la > 0) {
      ctx.save();
      var zIn = E.in(prog(t, T.travelB - 0.05, T.travelB + 0.36));
      var z = Math.pow(14, zIn);
      ctx.translate(lerp(EARTH_D[0], 960, zIn), lerp(EARTH_D[1], 540, zIn)); ctx.scale(z, z); ctx.translate(-EARTH_D[0], -EARTH_D[1]);
      ctx.globalAlpha *= la;
      linkLayer(ctx, t, tl, 1, { link: 1 });
      ctx.restore();
    }
    var shrink = E.inOut(prog(t, T.reportA, T.travelA + 0.1));
    var cw = lerp(1920, 300, shrink), chh = cw * 9 / 16;
    var start = [960, 540], ship0 = [SHIP_D[0] - 60, SHIP_D[1] - 150], earth0 = [EARTH_D[0] + 40, EARTH_D[1] - 150];
    var pos = travel > 0 ? [lerp(ship0[0], earth0[0], travel), lerp(ship0[1], earth0[1], travel) - Math.sin(travel * Math.PI) * 60] : [lerp(start[0], ship0[0], shrink), lerp(start[1], ship0[1], shrink)];
    var cardA = 1 - prog(t, T.travelB, T.travelB + 0.2);
    if (cardA > 0) {
      ctx.save(); ctx.globalAlpha *= cardA;
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(pos[0] - cw / 2, pos[1] - chh / 2, cw, chh);
      ctx.drawImage(A.img.screen, pos[0] - cw / 2, pos[1] - chh / 2, cw, chh);
      if (shrink > 0.6) {
        var ca = prog(shrink, 0.6, 1);
        corners(ctx, pos[0] - cw / 2 - 8, pos[1] - chh / 2 - 8, cw + 16, chh + 16, 14, ca);
        icon(ctx, 'file-text', C.text, pos[0] - cw / 2, pos[1] - chh / 2 - 46, 26, ca);
        text(ctx, 'FULL REPORT', pos[0] - cw / 2 + 36, pos[1] - chh / 2 - 26, { size: 20, weight: 600, track: 0.12, alpha: ca });
      }
      ctx.restore();
    }
    // 2. the flight surgeon at her console
    var da = E.out(prog(t, T.docIn - 0.05, T.docIn + 0.3)) * gOut;
    if (da > 0) {
      var push = 1.04 - 0.04 * E.smooth(prog(t, T.docIn, T.gOut));
      ctx.save(); ctx.translate(960, 540); ctx.scale(push, push); ctx.translate(-960, -540);
      surgeonScene(ctx, t, tl, da);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ scene H: the brand
  function sceneH(ctx, t, tl) {
    var T = tl.T;
    if (t < T.hIn) return;
    var a = E.out(prog(t, T.hIn, T.hIn + 0.3));
    var iso = A.iso, s = 1.7, ox = 960 - 120 * s, oy = 420 - 80 * s;
    halo(ctx, 560, 230, 800, 640, a);
    ctx.save(); ctx.globalAlpha *= a;
    // the mark traces itself: each scan line grows from its middle
    var k = E.out(prog(t, T.isoA, T.isoA + 0.7));
    ctx.strokeStyle = C.text; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
    iso.lines.forEach(function (l, i) {
      var kk = E.out(prog(k, i * 0.02, 0.7 + i * 0.02));
      if (kk <= 0) return;
      var mx = (l[0] + l[2]) / 2, half = (l[2] - l[0]) / 2 * kk;
      var cx = 120, dir = mx < cx ? -1 : 1;
      // lines split by the pupil grow from their inner end, the others from their middle
      var x1, x2;
      if (l[0] > 100 || l[2] < 140) { x1 = dir < 0 ? l[2] - (l[2] - l[0]) * kk : l[0]; x2 = dir < 0 ? l[2] : l[0] + (l[2] - l[0]) * kk; }
      else { x1 = mx - half; x2 = mx + half; }
      ctx.beginPath(); ctx.moveTo(ox + x1 * s, oy + l[1] * s); ctx.lineTo(ox + x2 * s, oy + l[3] * s); ctx.stroke();
    });
    var pa = E.out(prog(t, T.isoA + 0.45, T.isoA + 0.7));
    ctx.fillStyle = C.text; ctx.globalAlpha *= pa;
    ctx.beginPath(); ctx.arc(ox + iso.pupil[0] * s, oy + iso.pupil[1] * s, iso.pupil[2] * s * (0.6 + 0.4 * pa), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the name (from packages/core/src/product.ts, through the engine's JSON), the line, the small print
    var na = E.out(prog(t, T.nameIn, T.nameIn + 0.35));
    text(ctx, A.data.product.name.toUpperCase(), 960 + 0.21 * 52, 640, { size: 52, weight: 400, track: 0.42, align: 'center', alpha: a * na });
    var ta = E.out(prog(t, T.tagIn, T.tagIn + 0.3));
    text(ctx, 'See what you can’t feel.', 960, 728, { size: 44, weight: 400, align: 'center', alpha: a * ta });
    var sa = E.out(prog(t, T.smallIn, T.smallIn + 0.3));
    halo(ctx, 560, 940, 800, 110, sa);
    text(ctx, A.data.product.notice, 960, 980, { size: 22, weight: 500, color: C.text2, align: 'center', alpha: a * sa });
    text(ctx, 'NASA Space Apps Challenge 2026', 960, 1016, { size: 20, weight: 400, color: C.muted, align: 'center', alpha: a * sa });
  }

  // ------------------------------------------------------------------ frame
  function drawFrame(ctx, tl, t, opts) {
    if (!A.ready) return;
    var T = tl.T;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    campo(ctx, t, tl, 1);
    sceneA(ctx, t, tl);
    sceneB(ctx, t, tl);
    sceneC(ctx, t, tl);
    sceneD(ctx, t, tl);
    sceneE(ctx, t, tl);
    sceneF(ctx, t, tl);
    sceneG(ctx, t, tl);
    sceneH(ctx, t, tl);
    // The simulated-data mark, except while the result screen shows its own strip and on the brand card.
    var fa = t >= T.eIn && t < T.cuts[0] ? 1 - prog(t, T.eIn + 0.05, T.eIn + 0.25) : 1;
    if (t >= T.reportA && t < T.travelA) fa = prog(t, T.reportA + 0.2, T.travelA);   // the screen, still big, shows its own
    fa *= 1 - prog(t, T.hIn - 0.1, T.hIn + 0.2);
    fichaSimulado(ctx, 960, 42, fa);
    ctx.restore();
  }

  window.LYNCEUS_DEMO = { W: W, H: H, DEFAULTS: DEFAULTS, buildTimeline: buildTimeline, drawFrame: drawFrame, loadAssets: loadAssets };
})();
