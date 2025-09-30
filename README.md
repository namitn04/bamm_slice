# bamm_slice

This tool turns a 3D model (`.stl`) into a stack of black-and-white PNG images (layers) that the **CELLINK LumenX Gen-3** printer can use.  
I’ve included two files so you can test it right away:

- `Test.stl` — a sample 3D model  
- `lumenx_gen3.json` — the printer settings/profile for LumenX Gen-3

---

## 0) Download this project (no Git needed)

1. On the GitHub page, click the green **Code** button → **Download ZIP**.  
2. Double-click the ZIP to unzip it.  
3. You now have a folder (probably called `bamm_slice-main`). We’ll use that.

> Tip: Put this folder somewhere easy, like your **Desktop**.

---

## 1) Make sure you have Python 3

1. Open **Terminal**  
   - Press `command + space`, type **Terminal**, hit **Enter**.
2. In Terminal, type:
   ```bash
   python3 --version
   ````

* If you see something like `Python 3.10.9`, you’re good.
* If you get an error, ask someone or ChatGPT to help install Python 3 (it’s quick).

---

## 2) Open Terminal **in** the project folder

Do this the easy way:

1. In **Finder**, open the `bamm_slice-main` folder (the one you unzipped).
2. In Terminal, type `cd ` (type `c` + `d` + **space** but don’t press Enter yet).
3. Drag the `bamm_slice-main` folder from Finder into the Terminal window (this pastes its full path).
4. Press **Enter**.

Your Terminal line should now end with `…/bamm_slice-main$`

---

## 3) Install the required packages (one copy-paste line)

In Terminal, paste this and press **Enter**:

```bash
python3 -m pip install trimesh pillow numpy shapely scipy networkx rtree
```

* If that doesn’t work, try:

  ```bash
  pip install trimesh pillow numpy shapely scipy networkx rtree
  ```
* If you see a lot of text — that’s normal. Wait until it finishes.

---

## 4) Run the test (just copy and paste)

Navigate to the `slicer` folder in the `bamm_slice-main` folder:

```bash
cd slicer
```

Then run:

```bash
python3 repair_and_slice.py \
  --stl Test.stl \
  --profile lumenx_gen3.json \
  --layer-mm 0.1 \
  --aa 1 \
  --out ./Test_Output
```

**What this does:**

* Uses the included `Test.stl` model
* Uses the included `lumenx_gen3.json` printer profile
* Slices the model into **0.1 mm** (100 µm) layers
* Saves PNG images into a new folder called **`Test_Output`**

> The output folder (`./Test_Output`) will be created automatically if it doesn’t exist.

---

## 5) Check that it worked

* In Finder, open the **`Test_Output`** folder that was just created.
* You should see a bunch of files named like `layer_0001.png`, `layer_0002.png`, etc.
* Open a few — the white areas are “exposed” (printed), and black is empty.

---

## 6) Use your own STL next time

When you’re ready to slice a different model:

1. Put your `.stl` file into this same folder (or note where it lives).
2. Run the command again, changing the file names:

**If everything is in the same folder (easy):**

```bash
python3 repair_and_slice.py \
  --stl MyModel.stl \
  --profile lumenx_gen3.json \
  --layer-mm 0.1 \
  --aa 1 \
  --out ./MyModel_Output
```

**If your files are elsewhere (full/absolute paths):**

* On a Mac, you can **drag a file from Finder into Terminal** to paste its full path.

```bash
python3 /Users/yourname/Desktop/bamm_slice-main/repair_and_slice.py \
  --stl /Users/yourname/Desktop/Models/MyModel.stl \
  --profile /Users/yourname/Desktop/bamm_slice-main/lumenx_gen3.json \
  --layer-mm 0.1 \
  --aa 1 \
  --out /Users/yourname/Desktop/MyModel_Output
```

---

## What the options mean (plain English)

* `--stl` — your input 3D model (`.stl` file)
* `--profile` — printer settings; use `lumenx_gen3.json` for LumenX Gen-3
* `--layer-mm` — thickness of each layer. Common values:

  * `0.05` (50 µm, finer, more layers)
  * `0.1` (100 µm, default for quick tests)
* `--aa` — “anti-aliasing” (smooth edges). Leave at `1` unless you know you want `2`.
* `--out` — where to save the PNG layers (a folder you name)

**Quick help at any time:**

```bash
python3 repair_and_slice.py -h
```

---

## Common problems (and quick fixes)

**Q: “command not found: python3”**
A: Python 3 isn’t installed or not in PATH. Install Python 3, then try again.

**Q: “No module named …” or “module not found”**
A: Re-run the install step:

```bash
python3 -m pip install trimesh pillow numpy shapely scipy networkx rtree
```

**Q: “No such file or directory: Test.stl / lumenx_gen3.json”**
A: You’re not in the right folder or not referencing the right file path.

* Either `cd` into the correct folder (see Step 2), **or** use full paths by dragging files into Terminal.

**Q: The output folder is empty / not many layers**
A: Your `--layer-mm` might be too big, or your model is extremely thin. Try `--layer-mm 0.05`.

**Q: The model looks off-center in slices**
A: The script auto-centers each layer for you; if something looks odd, check that your model fits the build area (see below).

---

## Safety fit: does your model fit the printer?

The included LumenX Gen-3 profile uses a build area of **68 mm × 38 mm × 100 mm** and a pixel pitch of **0.035 mm** (35 µm).
If your model is larger than that XY area, scale it down in your CAD before slicing.


