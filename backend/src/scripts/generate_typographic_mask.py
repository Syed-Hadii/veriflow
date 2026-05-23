import sys
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter


def generate_text_stream(passport_no, given_name, personal_no):
    p_no = str(passport_no or "").strip()
    name = str(given_name or "").upper().replace(" ", "")
    per_no = str(personal_no or "").strip()

    parts = [p_no, name, per_no]
    parts = [p for p in parts if p]

    if not parts:
        return "TRUMP|"

    return "|".join(parts) + "|"


def load_font(size):
    candidates = [
        "arialbd.ttf",
        "arial.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]

    for font_path in candidates:
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            continue

    return ImageFont.load_default()


def create_edge_feather_mask(width, height, feather=36):
    """
    Square shape maintain karta hai.
    Sirf 4 borders ko softly fade karta hai.
    Koi radial / rounded vignette use nahi hoti.
    """
    alpha = np.full((height, width), 255, dtype=np.float32)

    # Left
    for x in range(feather):
        alpha[:, x] = np.minimum(alpha[:, x], 255 * (x / feather))

    # Right
    for x in range(feather):
        alpha[:, width - 1 - x] = np.minimum(alpha[:, width - 1 - x], 255 * (x / feather))

    # Top
    for y in range(feather):
        alpha[y, :] = np.minimum(alpha[y, :], 255 * (y / feather))

    # Bottom
    for y in range(feather):
        alpha[height - 1 - y, :] = np.minimum(alpha[height - 1 - y, :], 255 * (y / feather))

    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(radius=1.2))


def create_typographic_mask(front_path, passport_no, given_name, personal_no, output_path):
    # Base image load
    base_img = Image.open(front_path).convert("L")
    width, height = base_img.size
    gray = np.array(base_img)

    # Face clarity improve
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # Slight smoothing taake noisy texture kam ho
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    raw_pattern = generate_text_stream(passport_no, given_name, personal_no)

    # Readability tuning
    line_spacing = 24
    base_char_step = 13

    # Transparent output
    out = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(out)

    # Font cache
    font_cache = {sz: load_font(sz) for sz in range(12, 34)}
    default_font = font_cache[18]

    center_x = width / 2
    center_y = height / 2

    for row_idx, y in enumerate(range(-24, height + 30, line_spacing)):
        line_str = raw_pattern * int((width // max(len(raw_pattern), 1)) + 14)

        # Vertical sync break
        char_idx = (row_idx * 5) % len(line_str)
        x = -20

        while x < width + 20:
            if char_idx >= len(line_str):
                char_idx = 0

            char = line_str[char_idx]

            # Sweeping horizontal waves
            wave_horizontal = math.sin((x / width) * math.pi * 1.45) * 20

            dx = x - center_x
            dy = y - center_y
            distance = math.sqrt(dx**2 + dy**2)

            max_distance = math.sqrt(center_x**2 + center_y**2)
            bulge_factor = max(0, 1 - (distance / (max_distance * 0.90)))
            wave_radial = math.cos(distance * 0.010) * 12 * bulge_factor

            render_y = y + int(wave_horizontal + wave_radial)

            sample_x = min(width - 1, max(0, int(x)))
            sample_y = min(height - 1, max(0, int(render_y)))
            pixel_val = gray[sample_y, sample_x]

            # Bigger + clearer readable text
            # Darker face area = bigger/darker text
            if pixel_val < 60:
                f_size = 30
                alpha_val = 245
                step_x = base_char_step + 5
            elif pixel_val < 110:
                f_size = 25
                alpha_val = 220
                step_x = base_char_step + 3
            elif pixel_val < 165:
                f_size = 20
                alpha_val = 180
                step_x = base_char_step + 1
            else:
                f_size = 15
                alpha_val = 115
                step_x = base_char_step

            font = font_cache.get(f_size, default_font)

            # Slight soft teal security tint underlayer
            draw.text(
                (x + 0.8, render_y),
                char,
                fill=(0, 150, 145, max(40, alpha_val // 3)),
                font=font,
            )

            # Main readable dark text
            draw.text(
                (x, render_y),
                char,
                fill=(15, 15, 15, alpha_val),
                font=font,
            )

            x += step_x
            char_idx += 1

    # Square edge feather only
    edge_alpha = create_edge_feather_mask(width, height, feather=40)

    rgba = np.array(out)
    current_alpha = rgba[:, :, 3]
    edge_alpha_np = np.array(edge_alpha)

    # Existing alpha + edge alpha combine
    final_alpha = np.minimum(current_alpha, edge_alpha_np)
    rgba[:, :, 3] = final_alpha

    final_img = Image.fromarray(rgba, mode="RGBA")
    final_img.save(output_path)
    print("Success: Generated readable square-edge blended typographic mask.")


if __name__ == '__main__':
    if len(sys.argv) < 6:
        print("Usage: script.py <input_img> <passport> <name> <personal_id> <output_path>")
    else:
        create_typographic_mask(
            sys.argv[1],
            sys.argv[2],
            sys.argv[3],
            sys.argv[4],
            sys.argv[5]
        )