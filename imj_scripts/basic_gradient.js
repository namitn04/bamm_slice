// Fiji JavaScript (Rhino)
// Goal: Fill the original white circle with a clean L->R gradient (no missed edge pixels)
// Implementation: Build a centered square for the gradient domain, BUT ONLY recolor pixels that were originally white.
// Add a tiny notch on the lighter (+x) side, limited to the original white rim.

importClass(Packages.ij.IJ);
importClass(Packages.ij.process.ImageProcessor);

function clamp(v, lo, hi){ return v < lo ? lo : (v > hi ? hi : v); }

var imp = IJ.getImage();
var ip  = imp.getProcessor();
if (!ip.isGrayscale()) IJ.run(imp, "8-bit", "");

var W = imp.getWidth(), H = imp.getHeight();

// ---------- TUNABLE PARAMETERS ----------
var WHITE_THRESHOLD = 255;   // detection threshold for "originally white" pixels
var MAKE_SQUARE     = true;  // use a centered square to define gradient span (for symmetry)

// Gradient
var GRAY_MIN = 150;          // left edge gray
var GRAY_MAX = 255;          // right edge gray

// Optional blocky noise (0..4)
var NOISE_LEVEL = 0;

// Notch (tiny tick on +x side, only on pixels that were originally white and near the rim)
var NOTCH_ENABLE       = false;
var NOTCH_HALF_ANGLE_D = 2;     // very narrow wedge
var NOTCH_DEPTH_FRAC   = 0.08;  // shallow (relative to estimated radius)
// ---------------------------------------

// --- 1) Detect "original white" mask & bounding box ---
var minX = W, minY = H, maxX = -1, maxY = -1;
var whiteMask = new java.util.HashSet(); // store linear indices for quick membership
for (var y = 0; y < H; y++) {
  for (var x = 0; x < W; x++) {
    if (ip.get(x, y) >= WHITE_THRESHOLD) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      whiteMask.add(y * W + x);
    }
  }
}
if (maxX < 0 || maxY < 0) {
  IJ.error("No white region detected at threshold ≥ " + WHITE_THRESHOLD + ". Lower WHITE_THRESHOLD.");
  throw("No white region found.");
}

// Center and raw bbox
var bboxW = maxX - minX + 1;
var bboxH = maxY - minY + 1;
var cx    = (minX + maxX) / 2.0;
var cy    = (minY + maxY) / 2.0;

// --- 2) Build gradient domain as a centered square (for symmetry) ---
var side = MAKE_SQUARE ? Math.max(bboxW, bboxH) : Math.max(bboxW, bboxH);
side = Math.min(side, W, H); // don't exceed image
var left = Math.round(cx - side / 2.0);
var top  = Math.round(cy - side / 2.0);
if (left < 0) left = 0;
if (top  < 0) top  = 0;
if (left + side > W) left = W - side;
if (top  + side > H) top  = H - side;
var right  = left + side - 1;
var bottom = top  + side - 1;

// --- 3) (Optional) Noise helpers ---
var BLOCK_BY_LEVEL = [1, 2, 4, 8, 12];
var AMPL_BY_LEVEL  = [0, 6, 12, 18, 24];
var noiseBlock = BLOCK_BY_LEVEL[clamp(NOISE_LEVEL, 0, 4)];
var noiseAmpl  = AMPL_BY_LEVEL[clamp(NOISE_LEVEL, 0, 4)];
function hash01(ix, iy) {
  var n = (ix|0) * 374761393 + (iy|0) * 668265263;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = (n ^ (n >>> 16));
  return (n >>> 0) / 4294967295.0;
}

// --- 4) Recolor ONLY originally-white pixels inside the square with L->R gradient ---
for (var y2 = top; y2 <= bottom; y2++) {
  var by = Math.floor(y2 / noiseBlock);
  for (var x2 = left; x2 <= right; x2++) {
    if (!whiteMask.contains(y2 * W + x2)) continue; // only recolor original white
    var t = (x2 - left) / (side - 1); // 0..1 across the square width
    var val = Math.round(GRAY_MIN + t * (GRAY_MAX - GRAY_MIN));
    if (noiseAmpl > 0) {
      var bx = Math.floor(x2 / noiseBlock);
      var r  = hash01(bx, by) * 2.0 - 1.0;
      val = Math.round(val + r * noiseAmpl);
    }
    ip.putPixel(x2, y2, clamp(val, 0, 255));
  }
}

// --- 5) Tiny notch on the lighter side (+x), restricted to original-white rim ---
if (NOTCH_ENABLE) {
  // Estimate radius from the tighter bbox dimension (circle-inscribed)
  var R_est = Math.min(bboxW, bboxH) / 2.0;
  var R2    = R_est * R_est;

  var halfAng = Math.PI * (NOTCH_HALF_ANGLE_D / 180.0);
  var rInner  = R_est * (1.0 - clamp(NOTCH_DEPTH_FRAC, 0, 1));
  var rInner2 = rInner * rInner;

  // Scan only a band around the circle-ish area
  var yMin = Math.max(0, Math.floor(cy - R_est));
  var yMax = Math.min(H - 1, Math.ceil (cy + R_est));
  var xMin = Math.max(0, Math.floor(cx - R_est));
  var xMax = Math.min(W - 1, Math.ceil (cx + R_est));

  for (var yy = yMin; yy <= yMax; yy++) {
    var dy = yy - cy;
    for (var xx = xMin; xx <= xMax; xx++) {
      var idx = yy * W + xx;
      if (!whiteMask.contains(idx)) continue; // only modify original white pixels
      var dx = xx - cx;
      var rr2 = dx*dx + dy*dy;
      if (rr2 <= R2 && rr2 >= rInner2) {
        var ang = Math.atan2(dy, dx); // 0 at +x
        if (Math.abs(ang) <= halfAng) {
          ip.putPixel(xx, yy, 0); // notch
        }
      }
    }
  }
}

imp.updateAndDraw();
