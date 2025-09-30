# bamm_slice

A python script to slice and repair .stl files plus some fiji/imagej scripts to edit individual slices.

# Slicer

## Help message

-h, --help           show this help message and exit

--stl STL            Input STL file (REQUIRED)

--profile PROFILE    Printer profile JSON (REQUIRED)

--layer-mm LAYER_MM  Layer height (mm) (REQUIRED)

--aa AA              Supersample factor (OPTIONAL DEFAULT = 1)

--out OUT            Output folder (REQUIRED)

## Install dependencies

pip install trimesh pillow numpy shapely

## Example usage

python3 repair_and_slice.py --stl 13x3_24WellPlate_Slab.stl --profile lumenx_gen3.json --layer-mm 0.1 --aa 1 --out ./13x3_Slab


