#!/usr/bin/env python3
"""
repair_and_slice.py

Auto-repair and slice an STL into centered black/white PNG layers
for CELLINK Lumen X Gen-3 VL-DLP with 35 µm pixels.

This uses per-slice 2D centering of polygons to guarantee the full
cross-section is centered in each image.

Dependencies:
    pip install trimesh pillow numpy shapely

Usage:
    python3 repair_and_slice.py \
        --stl input.stl \
        --profile lumenx_gen3.json \
        --layer-mm 0.05 \
        --aa 2 \
        --out ./layers
"""
import argparse, json, hashlib, math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
import trimesh
from trimesh.repair import fill_holes
from shapely.geometry import Polygon
from shapely.ops import unary_union


def load_profile(path: Path):
    prof = json.loads(path.read_text())
    bx, by, bz = prof['build_mm']
    # derive pixel grid from pitch or explicit
    if 'pixel_pitch_mm' in prof:
        pitch = float(prof['pixel_pitch_mm'])
        W = int(round(bx / pitch))
        H = int(round(by / pitch))
    else:
        W, H = prof['pixels']
    prof['pixels'] = [W, H]
    prof['__sx'] = W / bx
    prof['__sy'] = H / by
    prof['_W'], prof['_H'] = W, H
    prof['_hash'] = hashlib.sha1(
        json.dumps(prof, sort_keys=True).encode()
    ).hexdigest()[:8]
    return prof


def repair_mesh(path: Path) -> trimesh.Trimesh:
    mesh = trimesh.load(path)
    if not isinstance(mesh, trimesh.Trimesh):
        mesh = trimesh.util.concatenate(mesh.dump())
    mesh.remove_unreferenced_vertices()
    fill_holes(mesh)
    mesh.update_faces(mesh.nondegenerate_faces())
    return mesh


def slice_to_png(mesh: trimesh.Trimesh, prof: dict,
                 layer_mm: float, aa: int, out_dir: Path):
    bx, by, _ = prof['build_mm']
    W, H = prof['_W'], prof['_H']
    sx, sy = prof['__sx'], prof['__sy']

    # determine number of layers
    mn_z, mx_z = mesh.bounds[0][2], mesh.bounds[1][2]
    num_slices = math.ceil((mx_z - mn_z) / layer_mm)

    bg = 0    # black background
    fg = 255  # white part

    print(f"[INFO] Z-range: {mn_z:.3f} → {mx_z:.3f} mm → {num_slices} slices")
    out_dir.mkdir(parents=True, exist_ok=True)

    for i in range(num_slices):
        z = mn_z + layer_mm * (i + 0.5)
        section = mesh.section(plane_origin=[0,0,z], plane_normal=[0,0,1])
        if section is None:
            continue

        # flatten cross-section
        planar_obj, _ = section.to_2D()
        polys = planar_obj.polygons_full
        if not polys:
            continue

        # union all polygons to compute centroid
        combined = unary_union(polys)
        cx, cy = combined.centroid.x, combined.centroid.y
        # shift to build center
        dx = bx/2.0 - cx
        dy = by/2.0 - cy

        # create high-res image
        img = Image.new('L', (W*aa, H*aa), bg)
        draw = ImageDraw.Draw(img)

        for poly in polys:
            # apply shift and map to px
            ext_pts = [
                (
                    int((x+dx) * sx * aa),
                    int((by - (y+dy)) * sy * aa)
                )
                for x, y in poly.exterior.coords
            ]
            draw.polygon(ext_pts, fill=fg)
            for interior in poly.interiors:
                hole_pts = [
                    (
                        int((x+dx) * sx * aa),
                        int((by - (y+dy)) * sy * aa)
                    )
                    for x, y in interior.coords
                ]
                draw.polygon(hole_pts, fill=bg)

        # downsample for AA
        if aa > 1:
            img = img.resize((W, H), resample=Image.LANCZOS)

        # save
        img.save(out_dir / f"layer_{i+1:04d}.png")

    print(f"✅ Wrote {num_slices} layers to {out_dir}")


def main():
    p = argparse.ArgumentParser(
        description="Repair + slice and center each layer for Lumen X"
    )
    p.add_argument('--stl',      required=True, help="Input STL file")
    p.add_argument('--profile',  required=True, help="Printer profile JSON")
    p.add_argument('--layer-mm', type=float, required=True, help="Layer height (mm)")
    p.add_argument('--aa',       type=int,   default=1,    help="Supersample factor")
    p.add_argument('--out',      required=True, help="Output folder")
    args = p.parse_args()

    prof = load_profile(Path(args.profile))

    print("🔧 Repairing mesh…")
    mesh = repair_mesh(Path(args.stl))

    print("✂️  Slicing & centering each layer…")
    slice_to_png(
        mesh,
        prof,
        layer_mm=args.layer_mm,
        aa=args.aa,
        out_dir=Path(args.out)
    )

if __name__ == '__main__':
    main()
