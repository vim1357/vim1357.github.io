export const MAX_COLORS = 6
export const MAX_BLOBS = 8

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
uniform int uForm;    // 0 blobs, 1 beam, 2 wave, 3 folds, 4 conic
uniform int uN;
uniform vec3 uCol[${MAX_COLORS}];
uniform int uBlobN;
uniform vec4 uBlob[${MAX_BLOBS}];  // xy: centre, z: radius, w: angle
uniform vec2 uCenter;
uniform vec2 uOff;    // seeded offset into the warp noise
uniform float uPhase; // seeded wave phase
uniform float uScale, uSoft, uWarp, uDetail, uAngle, uCurve, uAmp, uFreq, uRays, uStretch;
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

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
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

// Palette over t = 0..1 where the first step (background -> first colour) takes
// only e of the length: a small e gives a hard leading edge with a long glow.
vec3 edgeRamp(float t, float e) {
  if (uN < 3 || t <= e) return mix(uCol[0], uCol[1], smoothstep(0.0, e, t));
  float x = clamp((t - e) / (1.0 - e), 0.0, 1.0) * float(uN - 2);
  int i = int(min(floor(x), float(uN - 3)));
  return mix(uCol[i + 1], uCol[i + 2], ease(x - float(i)));
}

// Repeating ramp: climbs through the palette, then drops back to the first
// colour over the last e of each period (the "crease").
vec3 saw(float x, float e) {
  float s = fract(x);
  e = clamp(e, 0.0, 0.5);
  return mix(ramp(s / (1.0 - e)), uCol[0], smoothstep(1.0 - e, 1.0, s));
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
    n += (o == 0 ? 1.0 : 0.6) * (vnoise(q) + vnoise(q + vec2(113.0, 57.0)) - 1.0);
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
  vec2 dir = vec2(cos(uAngle), sin(uAngle));

  vec3 col = uCol[0];

  if (uForm == 0) {
    // Blobs: super-gaussians composited in order. The exponent goes from a
    // diffuse glow (1.5) to an almost hard disc (40) as softness drops.
    float k = 1.5 * pow(26.7, pow(1.0 - uSoft, 1.8));
    int span = max(uN - 1, 1);
    for (int i = 0; i < uBlobN; i++) {
      vec2 d = toFrame(pw - uBlob[i].xy, uBlob[i].w);
      d.x /= uStretch;
      float r = length(d) / (uBlob[i].z * uScale);
      col = mix(col, uCol[1 + i % span], exp(-0.6931 * pow(r, k)));
    }
  } else if (uForm == 1) {
    // Beam: palette over the distance from an edge. Curvature bends the edge
    // into a circle — positive eclipses the background, negative makes an orb.
    float k = uCurve * abs(uCurve) * 4.0;
    float d = abs(k) < 0.02 ? dot(q, dir) : sign(k) * (length(q + dir / k) - 1.0 / abs(k));
    float e = mix(0.0, uN < 3 ? 1.0 : 1.0 / float(uN - 1), uSoft);
    col = edgeRamp(d / uScale, max(e, 1.5 * aa / uScale));
  } else if (uForm == 2) {
    // Waves: one layer per colour, stacked across the frame.
    vec2 r = toFrame(q, uAngle);
    float gap = uScale * 0.18;
    float sw = max(gap * 1.6 * uSoft * uSoft, 1.5 * aa);
    float layers = float(uN - 1);
    for (int i = 1; i < uN; i++) {
      float fi = float(i);
      float k = uFreq * TAU * (1.0 + 0.13 * fi);
      float wave = uAmp * 0.3 * (0.65 * sin(r.x * k + uPhase + fi * 2.399)
                               + 0.35 * sin(r.x * k * 0.47 - uPhase * 1.7 + fi * 4.1));
      float d = r.y - (fi - 0.5 * layers - 0.5) * gap - wave;
      col = mix(col, uCol[i], smoothstep(-0.5 * sw, 0.5 * sw, d));
    }
  } else if (uForm == 3) {
    float period = uScale * 0.8;
    float e = max(0.5 * uSoft * uSoft, 1.5 * aa / period);
    col = saw(dot(q, dir) / period + 0.5, e);
  } else {
    float e = max(0.5 * uSoft * uSoft, 1.5 * aa * uRays / (TAU * max(length(q), 1e-4)));
    col = saw((atan(q.y, q.x) - uAngle) / TAU * uRays, e);
  }

  vec3 rgb = linearToSrgb(oklabToLinear(col));
  rgb += grain(outPx) * uGrain * 0.22;
  // Sub-LSB dither so a grain-free export still does not band.
  rgb += (hash12(outPx + 0.37) - 0.5) / 255.0;
  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`
