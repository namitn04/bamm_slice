# ImageJ Scripts

## basic_gradient.js

This script is for **ImageJ**. It fills a white region in your image with a **left-to-right grayscale gradient**.  
It only changes the white part (your object), leaving the background untouched.

---

## 1. What you need
- **ImageJ** (download from https://imagej.net/ij/)  
- The script file: `basic_gradient.js`

---

## 2. Running the script

1. Open ImageJ.  
2. Open your image (**File → Open...**).  
3. Go to **Plugins → Macros → Run...**  
4. Choose `basic_gradient.js`.  
5. The gradient will be applied instantly.

---

## 3. How it works
- It looks for **white pixels** in your image.  
- Fills those pixels with a **smooth gradient** (dark → light left to right).  
- Leaves all non-white pixels unchanged.  
- Optional settings can add a small “notch” or a bit of noise for texture.

---

## 4. Adjusting the settings
At the top of the script you’ll see lines like:

```javascript
var WHITE_THRESHOLD = 255;  // change if your "white" is not pure white
var GRAY_MIN = 150;         // darkest gray in the gradient
var GRAY_MAX = 255;         // brightest gray in the gradient
var NOISE_LEVEL = 0;        // 0 = off, 1–4 = more blocky noise
var NOTCH_ENABLE = false;   // true = add a notch at the bright side
