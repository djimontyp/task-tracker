"""
Signal Cartography: Pulse Radar Vision
A visual philosophy document expressing the essence of extracting signal from noise.

Second pass: Museum-quality refinements with meticulous attention to every detail.
"""

import math
from pathlib import Path

from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import A3
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Register fonts
FONTS_DIR = Path(__file__).parent.parent / "canvas-fonts"
pdfmetrics.registerFont(TTFont("GeistMono", FONTS_DIR / "GeistMono-Regular.ttf"))
pdfmetrics.registerFont(TTFont("GeistMono-Bold", FONTS_DIR / "GeistMono-Bold.ttf"))
pdfmetrics.registerFont(TTFont("WorkSans", FONTS_DIR / "WorkSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("WorkSans-Bold", FONTS_DIR / "WorkSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Jura-Light", FONTS_DIR / "Jura-Light.ttf"))
pdfmetrics.registerFont(TTFont("Jura-Medium", FONTS_DIR / "Jura-Medium.ttf"))
pdfmetrics.registerFont(TTFont("Italiana", FONTS_DIR / "Italiana-Regular.ttf"))

# Color palette - Signal Cartography (refined)
VOID = Color(0.025, 0.035, 0.08, 1)  # Deep background
DEEP_NAVY = Color(0.04, 0.06, 0.12, 1)
RADAR_BLUE = Color(0.12, 0.32, 0.52, 1)
SIGNAL_CYAN = Color(0.18, 0.62, 0.72, 1)
PULSE_AMBER = Color(0.92, 0.62, 0.12, 1)
NOISE_GRAY = Color(0.28, 0.30, 0.33, 0.25)
GHOST_WHITE = Color(0.90, 0.92, 0.94, 1)
SOFT_WHITE = Color(0.85, 0.87, 0.90, 0.85)
ATOM_GOLD = Color(0.82, 0.70, 0.38, 1)
GRID_LINE = Color(0.15, 0.25, 0.35, 0.08)


def draw_subtle_grid(c, width, height, spacing=40):
    """Draw an extremely subtle reference grid for scientific feel."""
    c.setStrokeColor(GRID_LINE)
    c.setLineWidth(0.25)

    for x in range(0, int(width), spacing):
        c.line(x, 0, x, height)
    for y in range(0, int(height), spacing):
        c.line(0, y, width, y)


def draw_radar_rings(c, cx, cy, max_radius, num_rings=12):
    """Draw concentric radar rings with precise calibration."""
    for i in range(num_rings):
        radius = max_radius * (i + 1) / num_rings
        # Graduated opacity - inner rings more visible
        alpha = 0.04 + (0.12 * ((num_rings - i) / num_rings))
        c.setStrokeColor(Color(0.18, 0.48, 0.62, alpha))
        c.setLineWidth(0.4 if i % 3 == 0 else 0.2)
        c.circle(cx, cy, radius, stroke=1, fill=0)

        # Ring labels at cardinal positions (every 3rd ring)
        if i % 3 == 0 and i > 0:
            c.setFont("GeistMono", 5)
            c.setFillColor(Color(0.4, 0.5, 0.55, 0.4))
            c.drawString(cx + radius + 4, cy - 2, f"{int(radius)}")


def draw_signal_rays(c, cx, cy, length, num_rays=36):
    """Draw radiating signal detection lines with variable intensity."""
    # Primary rays (strong signals)
    strong_angles = [0, 45, 90, 135, 180, 225, 270, 315]

    for i in range(num_rays):
        angle_deg = (360 * i) / num_rays
        angle = math.radians(angle_deg)

        # Determine intensity
        is_strong = int(angle_deg) in strong_angles
        intensity = 0.25 if is_strong else 0.08 + 0.1 * abs(math.sin(angle * 4))
        line_width = 0.6 if is_strong else 0.25

        c.setStrokeColor(Color(0.18, 0.48, 0.62, intensity))
        c.setLineWidth(line_width)

        inner_start = 25 if is_strong else 35
        x1 = cx + inner_start * math.cos(angle)
        y1 = cy + inner_start * math.sin(angle)
        x2 = cx + length * math.cos(angle)
        y2 = cy + length * math.sin(angle)
        c.line(x1, y1, x2, y2)

        # Degree markers on strong rays
        if is_strong:
            marker_x = cx + (length + 12) * math.cos(angle)
            marker_y = cy + (length + 12) * math.sin(angle) - 2
            c.setFont("GeistMono", 5)
            c.setFillColor(Color(0.4, 0.5, 0.55, 0.35))
            c.drawCentredString(marker_x, marker_y, f"{int(angle_deg)}°")


def draw_noise_field(c, width, height, count=400):
    """Draw scattered noise particles representing unfiltered data."""
    import random
    random.seed(42)

    # Concentrated noise on the left side (source)
    for _ in range(count):
        # Bias towards left side
        x = random.gauss(width * 0.15, width * 0.12)
        y = random.gauss(height * 0.58, height * 0.15)

        # Keep within bounds
        x = max(30, min(width * 0.35, x))
        y = max(150, min(height - 150, y))

        size = random.uniform(0.3, 1.8)
        alpha = random.uniform(0.08, 0.25)

        c.setFillColor(Color(0.35, 0.40, 0.45, alpha))
        c.circle(x, y, size, stroke=0, fill=1)


def draw_knowledge_atom(c, x, y, atom_type, importance, index):
    """Draw a single knowledge atom with glow effect."""
    colors = {
        "TASK": PULSE_AMBER,
        "IDEA": SIGNAL_CYAN,
        "DECISION": ATOM_GOLD,
        "INSIGHT": Color(0.55, 0.72, 0.48, 0.95),
        "QUESTION": Color(0.65, 0.48, 0.68, 0.95),
        "PROBLEM": Color(0.82, 0.38, 0.38, 0.95),
    }
    color = colors.get(atom_type, SIGNAL_CYAN)

    # Size based on importance
    size = 3.5 + importance * 5.5

    # Outer glow (multiple layers)
    for glow in range(4, 0, -1):
        glow_alpha = 0.03 * glow
        c.setFillColor(Color(color.red, color.green, color.blue, glow_alpha))
        c.circle(x, y, size + glow * 3, stroke=0, fill=1)

    # Main atom body
    c.setFillColor(color)
    c.circle(x, y, size, stroke=0, fill=1)

    # Inner highlight (specular)
    c.setFillColor(Color(1, 1, 1, 0.35))
    c.circle(x - size * 0.25, y + size * 0.25, size * 0.35, stroke=0, fill=1)


def draw_signal_cluster(c, cx, cy, atoms, base_radius=130):
    """Draw interconnected cluster of knowledge atoms."""
    import random
    random.seed(123)

    positions = []
    for i, atom in enumerate(atoms):
        angle = (2 * math.pi * i) / len(atoms) + random.uniform(-0.15, 0.15)
        dist = base_radius * (0.55 + random.uniform(0, 0.45))

        x = cx + dist * math.cos(angle)
        y = cy + dist * math.sin(angle)
        positions.append((x, y, atom))

    # Draw connection lines first (behind atoms)
    c.setLineCap(1)  # Round cap
    for i, (x1, y1, atom1) in enumerate(positions):
        for j, (x2, y2, atom2) in enumerate(positions[i + 1:], i + 1):
            # Only connect nearby atoms
            dist = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            if dist < 100:
                alpha = 0.08 * (1 - dist / 100)
                c.setStrokeColor(Color(0.5, 0.6, 0.65, alpha))
                c.setLineWidth(0.5)
                c.line(x1, y1, x2, y2)

        # Connection to center
        c.setStrokeColor(Color(0.3, 0.5, 0.6, 0.12))
        c.setLineWidth(0.4)
        c.line(cx, cy, x1, y1)

    # Draw atoms
    for i, (x, y, atom) in enumerate(positions):
        draw_knowledge_atom(c, x, y, atom["type"], atom["importance"], i)


def draw_flow_indicator(c, x1, y1, x2, y2, label="", progress=0.5):
    """Draw elegant flow arrow with animation dots."""
    c.setStrokeColor(Color(0.92, 0.62, 0.12, 0.5))
    c.setLineWidth(1.2)

    # Dashed main line
    c.setDash([8, 4])
    c.line(x1, y1, x2, y2)
    c.setDash([])

    # Arrow head
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 10
    c.line(x2, y2,
           x2 - arrow_len * math.cos(angle - 0.35),
           y2 - arrow_len * math.sin(angle - 0.35))
    c.line(x2, y2,
           x2 - arrow_len * math.cos(angle + 0.35),
           y2 - arrow_len * math.sin(angle + 0.35))

    # Progress dots along the line
    num_dots = 5
    for i in range(num_dots):
        t = (i + progress) / num_dots
        if 0.1 <= t <= 0.9:
            px = x1 + (x2 - x1) * t
            py = y1 + (y2 - y1) * t
            alpha = 0.3 + 0.4 * math.sin(t * math.pi)
            c.setFillColor(Color(0.92, 0.62, 0.12, alpha))
            c.circle(px, py, 2, stroke=0, fill=1)

    # Label
    if label:
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2 - 12
        c.setFont("GeistMono", 7)
        c.setFillColor(SOFT_WHITE)
        c.drawCentredString(mid_x, mid_y, label)


def draw_metric_card(c, x, y, value, label, unit="", accent_color=SIGNAL_CYAN):
    """Draw a refined metric display."""
    # Subtle background
    c.setFillColor(Color(0.06, 0.08, 0.12, 0.6))
    c.roundRect(x - 10, y - 30, 120, 75, 4, stroke=0, fill=1)

    # Value
    c.setFont("Jura-Medium", 32)
    c.setFillColor(accent_color)
    c.drawString(x, y + 15, str(value))

    # Unit
    if unit:
        value_width = c.stringWidth(str(value), "Jura-Medium", 32)
        c.setFont("GeistMono", 9)
        c.setFillColor(Color(0.55, 0.6, 0.65, 0.8))
        c.drawString(x + value_width + 6, y + 20, unit)

    # Label
    c.setFont("GeistMono", 7)
    c.setFillColor(SOFT_WHITE)
    c.drawString(x, y - 8, label.upper())

    # Accent line
    c.setStrokeColor(accent_color)
    c.setLineWidth(1.5)
    c.line(x - 10, y + 45, x + 30, y + 45)


def draw_legend_item(c, x, y, color, label, size=4):
    """Draw a legend item with refined styling."""
    # Glow
    c.setFillColor(Color(color.red, color.green, color.blue, 0.15))
    c.circle(x, y, size + 3, stroke=0, fill=1)

    # Main dot
    c.setFillColor(color)
    c.circle(x, y, size, stroke=0, fill=1)

    # Label
    c.setFont("GeistMono", 6.5)
    c.setFillColor(SOFT_WHITE)
    c.drawString(x + 10, y - 2, label)


def draw_corner_marks(c, width, height, margin, size=18):
    """Draw precision corner marks."""
    c.setStrokeColor(SIGNAL_CYAN)
    c.setLineWidth(0.8)

    corners = [
        (margin, height - margin, 1, -1),
        (width - margin, height - margin, -1, -1),
        (margin, margin, 1, 1),
        (width - margin, margin, -1, 1),
    ]

    for cx, cy, h_dir, v_dir in corners:
        c.line(cx, cy, cx + size * h_dir, cy)
        c.line(cx, cy, cx, cy + size * v_dir)

        # Small registration dot
        c.setFillColor(SIGNAL_CYAN)
        c.circle(cx, cy, 1.5, stroke=0, fill=1)


def create_pulse_radar_vision():
    """Generate the complete vision document - museum quality."""
    output_path = Path(__file__).parent / "pulse-radar-vision.pdf"
    width, height = A3

    c = canvas.Canvas(str(output_path), pagesize=A3)

    # === BACKGROUND LAYERS ===
    # Base void
    c.setFillColor(VOID)
    c.rect(0, 0, width, height, stroke=0, fill=1)

    # Subtle gradient overlay (darker at edges)
    for i in range(20):
        alpha = 0.015 * (20 - i)
        c.setFillColor(Color(0, 0, 0, alpha))
        inset = i * 25
        c.rect(inset, inset, width - 2 * inset, height - 2 * inset, stroke=0, fill=1)

    # Reference grid
    draw_subtle_grid(c, width, height, spacing=50)

    # === NOISE FIELD (left side) ===
    draw_noise_field(c, width, height, count=500)

    # === MAIN RADAR VISUALIZATION ===
    radar_cx = width * 0.52
    radar_cy = height * 0.56
    radar_radius = 260

    # Radar sweep background glow
    for i in range(8, 0, -1):
        alpha = 0.015 * i
        c.setFillColor(Color(0.12, 0.35, 0.48, alpha))
        c.circle(radar_cx, radar_cy, radar_radius + i * 15, stroke=0, fill=1)

    # Radar rings
    draw_radar_rings(c, radar_cx, radar_cy, radar_radius, num_rings=12)

    # Signal rays
    draw_signal_rays(c, radar_cx, radar_cy, radar_radius, num_rays=48)

    # === KNOWLEDGE ATOMS ===
    atoms = [
        {"type": "DECISION", "importance": 1.0},
        {"type": "TASK", "importance": 0.9},
        {"type": "INSIGHT", "importance": 0.85},
        {"type": "IDEA", "importance": 0.8},
        {"type": "TASK", "importance": 0.75},
        {"type": "PROBLEM", "importance": 0.7},
        {"type": "QUESTION", "importance": 0.65},
        {"type": "IDEA", "importance": 0.6},
    ]
    draw_signal_cluster(c, radar_cx, radar_cy, atoms, base_radius=110)

    # === CENTRAL PULSE ===
    # Multi-layer glow
    for i in range(8, 0, -1):
        alpha = 0.08 * i
        c.setFillColor(Color(0.18, 0.62, 0.72, alpha))
        c.circle(radar_cx, radar_cy, 5 + i * 3.5, stroke=0, fill=1)

    # Core
    c.setFillColor(GHOST_WHITE)
    c.circle(radar_cx, radar_cy, 5, stroke=0, fill=1)

    # Pulse ring
    c.setStrokeColor(Color(0.18, 0.62, 0.72, 0.4))
    c.setLineWidth(1)
    c.circle(radar_cx, radar_cy, 18, stroke=1, fill=0)

    # === HEADER ===
    c.setFont("Italiana", 72)
    c.setFillColor(GHOST_WHITE)
    c.drawCentredString(width / 2, height - 85, "PULSE RADAR")

    c.setFont("GeistMono", 10)
    c.setFillColor(Color(0.55, 0.6, 0.65, 0.9))
    c.drawCentredString(width / 2, height - 115, "SIGNAL CARTOGRAPHY  ·  AI KNOWLEDGE EXTRACTION")

    # Subtle line under header
    c.setStrokeColor(Color(0.3, 0.5, 0.6, 0.25))
    c.setLineWidth(0.5)
    c.line(width / 2 - 180, height - 130, width / 2 + 180, height - 130)

    # === VISION STATEMENT ===
    c.setFont("WorkSans", 13)
    c.setFillColor(Color(0.72, 0.75, 0.80, 0.9))
    c.drawCentredString(width / 2, height - 155,
                        "Transforming communication chaos into structured, searchable knowledge")

    # === TRANSFORMATION INDICATORS ===
    # Left label (chaos)
    chaos_x = 95
    chaos_y = height * 0.56

    c.setFont("GeistMono", 8)
    c.setFillColor(NOISE_GRAY)
    c.drawCentredString(chaos_x, chaos_y + 85, "INPUT")
    c.setFont("Jura-Medium", 28)
    c.setFillColor(Color(0.5, 0.55, 0.58, 0.8))
    c.drawCentredString(chaos_x, chaos_y + 55, "500+")
    c.setFont("GeistMono", 7)
    c.setFillColor(Color(0.45, 0.5, 0.55, 0.7))
    c.drawCentredString(chaos_x, chaos_y + 38, "MESSAGES / DAY")

    # Right label (structure)
    struct_x = width - 95
    c.setFont("GeistMono", 8)
    c.setFillColor(ATOM_GOLD)
    c.drawCentredString(struct_x, chaos_y + 85, "OUTPUT")
    c.setFont("Jura-Medium", 28)
    c.setFillColor(ATOM_GOLD)
    c.drawCentredString(struct_x, chaos_y + 55, "5-10")
    c.setFont("GeistMono", 7)
    c.setFillColor(SOFT_WHITE)
    c.drawCentredString(struct_x, chaos_y + 38, "ACTIONABLE INSIGHTS")

    # Structured output visualization
    output_atoms = [
        (struct_x - 22, chaos_y + 5, PULSE_AMBER),
        (struct_x + 22, chaos_y + 5, SIGNAL_CYAN),
        (struct_x - 22, chaos_y - 22, ATOM_GOLD),
        (struct_x + 22, chaos_y - 22, Color(0.55, 0.72, 0.48, 0.95)),
        (struct_x, chaos_y - 8, GHOST_WHITE),
    ]
    for ox, oy, oc in output_atoms:
        c.setFillColor(Color(oc.red, oc.green, oc.blue, 0.15))
        c.circle(ox, oy, 8, stroke=0, fill=1)
        c.setFillColor(oc)
        c.circle(ox, oy, 4.5, stroke=0, fill=1)

    # Flow arrows
    draw_flow_indicator(c, 160, chaos_y, radar_cx - radar_radius - 25, radar_cy,
                        "FILTER · SCORE", 0.3)
    draw_flow_indicator(c, radar_cx + radar_radius + 25, radar_cy, width - 160, chaos_y,
                        "EXTRACT · STRUCTURE", 0.7)

    # === METRICS PANEL ===
    panel_y = 165
    panel_start_x = 100

    # Panel background
    c.setFillColor(Color(0.04, 0.05, 0.08, 0.7))
    c.roundRect(60, panel_y - 45, width - 120, 95, 6, stroke=0, fill=1)
    c.setStrokeColor(Color(0.2, 0.35, 0.45, 0.2))
    c.setLineWidth(0.5)
    c.roundRect(60, panel_y - 45, width - 120, 95, 6, stroke=1, fill=0)

    draw_metric_card(c, panel_start_x, panel_y, "80", "Noise Filtered", "%", SIGNAL_CYAN)
    draw_metric_card(c, panel_start_x + 160, panel_y, "6×", "Faster Review", "", PULSE_AMBER)
    draw_metric_card(c, panel_start_x + 320, panel_y, "6", "Atom Types", "", ATOM_GOLD)
    draw_metric_card(c, panel_start_x + 480, panel_y, "∞", "Searchable", "", GHOST_WHITE)

    # === ATOM TYPE LEGEND ===
    legend_y = 68
    legend_x = 100

    c.setFont("GeistMono", 7)
    c.setFillColor(Color(0.45, 0.5, 0.55, 0.7))
    c.drawString(legend_x, legend_y + 18, "ATOM TYPES")

    legend_items = [
        (PULSE_AMBER, "TASK"),
        (SIGNAL_CYAN, "IDEA"),
        (ATOM_GOLD, "DECISION"),
        (Color(0.55, 0.72, 0.48, 0.95), "INSIGHT"),
        (Color(0.65, 0.48, 0.68, 0.95), "QUESTION"),
        (Color(0.82, 0.38, 0.38, 0.95), "PROBLEM"),
    ]

    for i, (color, label) in enumerate(legend_items):
        draw_legend_item(c, legend_x + i * 100, legend_y, color, label, size=3.5)

    # === TECHNICAL REFERENCE ===
    c.setFont("GeistMono", 5.5)
    c.setFillColor(Color(0.35, 0.4, 0.45, 0.5))
    c.drawString(width - 180, 28, "SIGNAL CARTOGRAPHY v1.0  ·  2025")
    c.drawString(80, 28, "AI-POWERED KNOWLEDGE EXTRACTION SYSTEM")

    # === BORDER FRAME ===
    margin = 35
    c.setStrokeColor(Color(0.18, 0.32, 0.42, 0.25))
    c.setLineWidth(0.4)
    c.rect(margin, margin, width - 2 * margin, height - 2 * margin, stroke=1, fill=0)

    # Corner marks
    draw_corner_marks(c, width, height, margin, size=20)

    # === FINALIZE ===
    c.save()
    print(f"✅ Created: {output_path}")
    return output_path


if __name__ == "__main__":
    create_pulse_radar_vision()
