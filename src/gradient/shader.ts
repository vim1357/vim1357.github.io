export const MAX_COLORS = 6
export const MAX_BLOBS = 4

/** Fullscreen triangle from gl_VertexID — no vertex buffers needed. */
export const VERT = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

/**
 * The whole gradient is one analytic field, so it is resolution-independent:
 * the same uniforms render the preview, a 4x export, or one tile of it.
 *
 * Space: `p` is centred, y-down, and the SHORT side of the frame spans -0.5..0.5.
 * Colours arrive as OKLab and are blended there — that is what keeps the
 * transitions clean instead of muddy — then converted to sRGB at the end.
 */
export const FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

out vec4 outColor;

uniform vec2 uRes;    // design size in px (the 1x size)
uniform vec4 uTile;   // xy: tile offset in output px, z: output px per design px, w: tile height
uniform int uForm;    // 0 blobs, 1 ribbon, 2 folds, 3 mesh
uniform int uN;
uniform vec3 uCol[${MAX_COLORS}];
uniform int uBlobN;
uniform vec4 uBlob[${MAX_BLOBS}];   // xy: centre, z: radius, w: angle the head points at
uniform vec4 uBlobB[${MAX_BLOBS}];  // x: stretch, y: softness, z: how much crisper the head is
uniform ivec2 uBlobC[${MAX_BLOBS}]; // palette index at the head, at the tail
uniform vec2 uCenter;
uniform vec2 uOff;    // seeded offset into the warp noise
uniform float uPhase; // seeded ribbon phase
uniform float uScale, uSoft, uWarp, uDetail, uAngle, uTaper, uAmp, uFreq, uFocus;
uniform float uDepth, uStretch;
uniform float uCount; // folds across the frame
uniform float uSpan;  // how far the frame reaches along the angle
uniform float uGrain, uGrainSize;
uniform int uGrainOct;

const float TAU = 6.28318530718;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Gradient noise, roughly -0.7..0.7.
float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i) * 2.0 - 1.0, f);
  float b = dot(hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Value noise for the grain, rescaled so its contrast is the same wherever the
// sample falls between lattice points. Plain interpolation is flattest in the
// middle of a cell, which made a coarser grain fade instead of getting bigger.
float gcell(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  vec4 h = vec4(hash12(i), hash12(i + vec2(1.0, 0.0)), hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)));
  return dot(w, h - 0.5) / sqrt(dot(w, w));
}

// v expressed in a frame rotated by a: x along (cos a, sin a), y across it.
vec2 toFrame(vec2 v, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * v.x + s * v.y, -s * v.x + c * v.y);
}

float ease(float f) {
  return mix(f, f * f * (3.0 - 2.0 * f), 0.5);
}

// Whole palette spread evenly over t = 0..1.
vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uN - 1);
  int i = int(min(floor(x), float(uN - 2)));
  return mix(uCol[i], uCol[i + 1], ease(x - float(i)));
}

// Mesh gradient: a slow field over the frame says how far along the palette
// each point is. The palette is ordered, so neighbouring colours always sit
// next to each other and the colour changes in both directions at once, with
// no contour anywhere. The field is read in a frame stretched along the angle,
// which pulls the patches into long strokes, and it leans across the frame so
// the picture has a dark side and a light side rather than even spots.
vec3 mesh(vec2 x) {
  vec2 s = toFrame(x, uAngle);
  float lean = 0.7 * (cos(uPhase) * s.y + sin(uPhase) * s.x / uStretch);
  s.x /= uStretch;
  s *= 0.9 / uScale;
  float n = gnoise(s + uOff.yx * 1.7) + 0.45 * gnoise(s * 2.1 - uOff);
  return ramp(smoothstep(0.05, 0.95, 0.5 + 0.8 * n + lean));
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

// Grain lives on the design-pixel lattice. The base octave is exactly what the
// 1x preview shows, so an export viewed at the same size looks the same; each
// doubling of resolution adds a finer octave on top, so zoomed in it stays
// crisp instead of turning into blurry upscaled noise.
float grain(vec2 outPx) {
  vec2 g = (outPx - 0.5) / (uTile.z * uGrainSize);
  float n = 0.0, f = 1.0;
  for (int o = 0; o < uGrainOct; o++) {
    vec2 q = g * f + vec2(37.0, 91.0) * float(o);
    n += (o == 0 ? 1.0 : 0.6) * (gcell(q) + gcell(q + vec2(113.0, 57.0)));
    f *= 2.0;
  }
  return n;
}

void main() {
  vec2 outPx = vec2(gl_FragCoord.x, uTile.w - gl_FragCoord.y) + uTile.xy;
  float m = min(uRes.x, uRes.y);
  vec2 p = (outPx / uTile.z - 0.5 * uRes) / m;
  float aa = 1.0 / (m * uTile.z); // one output pixel, in p units

  vec2 n = p * uDetail + uOff;
  vec2 warp = vec2(gnoise(n), gnoise(n + vec2(31.7, -17.3)))
            + 0.5 * vec2(gnoise(n * 2.03 + 11.1), gnoise(n * 2.03 - 23.5));
  vec2 pw = p + uWarp * 0.55 * warp;
  vec2 q = pw - uCenter;

  // Focus: a slow field that pulls parts of the frame out of focus, so one and
  // the same edge runs from crisp to dissolved. 1 = as set, 0 = sharp, 2 = twice as soft.
  float fo = clamp(0.5 + 1.3 * gnoise(p * 0.75 + uOff.yx + 7.3), 0.0, 1.0);
  float blur = mix(1.0, 2.0 * fo, uFocus);
  float soft = clamp(uSoft * blur, 0.0, 1.0);
  // Out-of-focus light also spreads wider.
  float spread = mix(1.0, 0.6 + 0.8 * fo, uFocus);

  vec3 col = uCol[0];

  if (uForm == 0) {
    // Shapes: super-gaussians composited in order, each with a head and a tail.
    // The exponent goes from a diffuse glow (1.5) to a hard disc (90) as
    // softness drops, and the head can be crisper than the tail — the shape is
    // cut clean on one side and dissolves on the other. The fill runs from one
    // palette colour at the head to another at the tail.
    for (int i = 0; i < uBlobN; i++) {
      vec2 d = toFrame(pw - uBlob[i].xy, uBlob[i].w);
      d.x /= uBlobB[i].x;
      d /= uBlob[i].z * uScale;
      float r = length(d);
      // Cosine of the angle to the head, flattened near the centre where it has no direction.
      float head = d.x / sqrt(r * r + 0.08);
      float s = clamp(uBlobB[i].y * blur * (1.0 - uBlobB[i].z * smoothstep(-0.5, 0.8, head)), 0.0, 1.0);
      float k = 1.5 * pow(60.0, pow(1.0 - s, 1.8));
      float a = exp(-0.6931 * exp(min(k * log(max(r, 1e-5)), 60.0)));
      vec3 fill = mix(uCol[uBlobC[i].x], uCol[uBlobC[i].y], smoothstep(-0.9, 1.1, -d.x));
      col = mix(col, fill, a);
    }
  } else if (uForm == 1) {
    // Ribbon: a band of light along one flowing curve; with no bend it is a
    // straight beam. The palette peaks on the curve and falls back to the
    // background on both sides. The far side always takes the full width;
    // softness is how much of it the near side gets, down to a clean cut.
    vec2 r = toFrame(q, uAngle);
    float k = uFreq * TAU;
    float a1 = r.x * k + uPhase, a2 = r.x * k * 0.47 - uPhase * 1.7;
    float y = uAmp * 0.55 * (0.65 * sin(a1) + 0.35 * sin(a2));
    float dy = uAmp * 0.55 * k * (0.65 * cos(a1) + 0.35 * 0.47 * cos(a2));
    // Distance to the curve rather than the height above it, so the band keeps its width on slopes.
    float d = (r.y - y) / sqrt(1.0 + dy * dy);
    // It opens up along its length, from a narrow end to a wide one, and the
    // light thins out as it spreads.
    float fan = exp(1.1 * uTaper * clamp(2.0 * r.x / uSpan, -1.3, 1.3));
    float len = uScale * 0.45 * spread * fan;
    // Never a vector-hard line: it would be the only sharp thing in a grainy frame.
    float near = max(len * soft, max(0.012, 2.0 * aa));
    float t = d / (d > 0.0 ? len : near);
    col = ramp(exp(-2.2 * t * t) * min(1.0, pow(fan, -0.35)));
  } else if (uForm == 3) {
    // Mesh with folds: a smooth field of colour, crumpled like cloth. A slow
    // noise cuts the frame into sheets; each sheet shows its own stretch of
    // the field, so the colour jumps where one overlaps the next. The upper
    // sheet gets a lit lip, the lower one a shadow under it — that is the
    // volume. Where the envelope drops to zero both sides show the same
    // colour and the fold simply ends.
    // The folds run longer than the colour patches: creases sweep across the frame.
    vec2 us = toFrame(q, uAngle);
    us.x /= uStretch * 1.5;
    float n = gnoise(us * uFreq + uOff) + 0.25 * gnoise(us * uFreq * 2.3 - uOff.yx);
    float env = smoothstep(-0.45, 0.25, gnoise(us * 0.7 + uOff + 41.0));
    float strength = env * uDepth * smoothstep(0.0, 0.15, uAmp);
    float t = n * uAmp * 3.0 + 0.5;
    float idx = floor(t), f = t - idx;
    float e = clamp(max(0.6 * soft, fwidth(t) * max(1.5, 0.012 / aa)), 0.0, 1.0);
    float drop = smoothstep(1.0 - e, 1.0, f); // 0 inside a sheet, 1 where the next one takes over
    vec2 across = vec2(-sin(uAngle), cos(uAngle));
    vec2 o0 = hash22(vec2(idx, 9.1) + uOff) - 0.5;
    vec2 o1 = hash22(vec2(idx + 1.0, 9.1) + uOff) - 0.5;
    vec2 look = q + strength * 0.7 * (across * (f - drop - 0.5) + mix(o0, o1, drop));
    col = mesh(look);
    float shade = strength * mix(exp(-f * 3.0) - pow(smoothstep(0.3, 1.0, f), 2.0), 1.0, drop);
    col.x = max(col.x + (shade > 0.0 ? 0.09 : 0.18) * shade, 0.0);
    col.yz *= 1.0 + 0.3 * min(shade, 0.0);
  } else {
    // Folds: a set number of them across the frame, whatever its shape or the
    // angle. Each starts at a crease near the top of the palette and decays
    // toward the background until the next one covers it. Every fold has its own
    // width, bend and brightness, so they do not read as one stripe repeated.
    vec2 r = toFrame(q, uAngle); // x across the folds, y along the creases
    float period = uSpan / uCount;
    float k = uFreq * TAU;
    float e = max(mix(0.012, 0.7 * period, soft * soft), 2.0 * aa);
    float first = floor(r.x / period) - 2.0;
    for (int j = 0; j < 4; j++) {
      float fi = first + float(j);
      vec2 h = hash22(vec2(fi, 3.1) + uOff), g = hash22(vec2(fi, 7.7) + uOff.yx);
      float a1 = r.y * k + TAU * h.x, a2 = r.y * k * 0.47 + TAU * h.y;
      float bend = uAmp * 0.8 * period;
      float crease = (fi + 0.4 * (g.x - 0.5)) * period + bend * (0.65 * sin(a1) + 0.35 * sin(a2));
      float slope = bend * k * (0.65 * cos(a1) + 0.35 * 0.47 * cos(a2));
      float s = r.x - crease;
      // A bright lip right at the crease over a slower fall-off: reads as a lit edge, not a flat band.
      // Measured from where the crease has fully faded in, so a soft crease does not dim it.
      float u = max(s - e, 0.0) / period;
      vec3 fold = ramp((0.8 + 0.2 * g.y) * (0.5 * exp(-7.0 * u) + 0.5 * exp(-1.4 * u)));
      col = mix(col, fold, smoothstep(0.0, e, s / sqrt(1.0 + slope * slope)));
    }
  }

  vec3 rgb = linearToSrgb(oklabToLinear(col));
  // Film-like: strongest in the midtones, held back in deep shadows and highlights,
  // where half of it would only clip.
  float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  rgb += grain(outPx) * uGrain * 0.2 * (0.45 + 2.2 * luma * (1.0 - luma));
  // Sub-LSB dither so a grain-free export still does not band.
  rgb += (hash12(outPx + 0.37) - 0.5) / 255.0;
  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`
