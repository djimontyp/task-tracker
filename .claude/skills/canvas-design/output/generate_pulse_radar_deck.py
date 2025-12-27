"""
Pulse Radar - Product Pitch Deck
Ітерація 3: Фінальне полірування — refined details, better spacing, premium feel
"""

import math
from pathlib import Path

from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Register fonts (with Cyrillic support)
FONTS_DIR = Path(__file__).parent.parent / "canvas-fonts"
pdfmetrics.registerFont(TTFont("GeistMono", FONTS_DIR / "GeistMono-Regular.ttf"))
pdfmetrics.registerFont(TTFont("GeistMono-Bold", FONTS_DIR / "GeistMono-Bold.ttf"))
# Cyrillic-supporting fonts
pdfmetrics.registerFont(TTFont("NotoSans", FONTS_DIR / "NotoSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-Bold", FONTS_DIR / "NotoSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Jura", FONTS_DIR / "Jura-Medium.ttf"))
pdfmetrics.registerFont(TTFont("Jura-Light", FONTS_DIR / "Jura-Light.ttf"))

# Premium color palette
BG_DARK = Color(0.045, 0.052, 0.070, 1)
BG_CARD = Color(0.085, 0.095, 0.120, 1)
PRIMARY = Color(0.30, 0.50, 0.90, 1)
PRIMARY_LIGHT = Color(0.45, 0.65, 0.95, 1)
ACCENT = Color(0.95, 0.50, 0.15, 1)
SUCCESS = Color(0.22, 0.70, 0.45, 1)
WARNING = Color(0.95, 0.70, 0.20, 1)
ERROR = Color(0.85, 0.30, 0.30, 1)
PURPLE = Color(0.55, 0.42, 0.85, 1)
MUTED = Color(0.40, 0.43, 0.50, 1)
TEXT = Color(0.95, 0.96, 0.97, 1)
TEXT_SECONDARY = Color(0.60, 0.63, 0.68, 1)
TEXT_MUTED = Color(0.45, 0.48, 0.55, 1)
BORDER = Color(0.16, 0.18, 0.23, 1)
BORDER_LIGHT = Color(0.22, 0.25, 0.30, 1)

PAGE_SIZE = landscape(A4)
W, H = PAGE_SIZE


def draw_background(c, variant="default"):
    """Draw premium gradient background - original smooth style."""
    c.setFillColor(BG_DARK)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    # Ambient glow - simple linear with many small steps
    if variant == "default":
        cx, cy = W * 0.72, H * 0.65
        for i in range(20, 0, -1):
            alpha = 0.006 * i
            c.setFillColor(Color(0.30, 0.50, 0.90, alpha))
            c.circle(cx, cy, 60 + i * 35, stroke=0, fill=1)
    elif variant == "accent":
        cx, cy = W * 0.25, H * 0.35
        for i in range(15, 0, -1):
            alpha = 0.005 * i
            c.setFillColor(Color(0.95, 0.50, 0.15, alpha))
            c.circle(cx, cy, 50 + i * 30, stroke=0, fill=1)


def draw_noise_texture(c, opacity=0.012):
    """Draw subtle noise texture for depth."""
    import random
    random.seed(42)
    for _ in range(800):
        x = random.uniform(0, W)
        y = random.uniform(0, H)
        a = random.uniform(0.005, opacity)
        c.setFillColor(Color(1, 1, 1, a))
        c.circle(x, y, 0.4, stroke=0, fill=1)


def draw_grid_dots(c, opacity=0.025):
    """Draw refined dot grid."""
    c.setFillColor(Color(1, 1, 1, opacity))
    for x in range(35, int(W), 25):
        for y in range(35, int(H), 25):
            c.circle(x, y, 0.4, stroke=0, fill=1)


def draw_footer(c, page_num, total_pages):
    """Draw refined footer."""
    # Gradient line
    for i in range(100):
        x = 40 + i * (W - 80) / 100
        alpha = 0.15 * math.sin(i * math.pi / 100)
        c.setStrokeColor(Color(0.30, 0.50, 0.90, alpha))
        c.setLineWidth(0.5)
        c.line(x, 42, x + (W - 80) / 100, 42)

    c.setFont("GeistMono", 7)
    c.setFillColor(TEXT_MUTED)
    c.drawString(40, 22, "PULSE RADAR")

    c.setFillColor(Color(0.30, 0.50, 0.90, 0.6))
    c.drawString(115, 22, "·")

    c.setFillColor(TEXT_MUTED)
    c.drawString(125, 22, "AI Knowledge System")

    c.drawRightString(W - 40, 22, f"{page_num}")
    c.setFillColor(Color(0.30, 0.50, 0.90, 0.4))
    c.drawRightString(W - 52, 22, "/")
    c.setFillColor(TEXT_MUTED)
    c.drawRightString(W - 60, 22, f"{total_pages}")


def draw_card(c, x, y, w, h, highlight_color=None, glow=False):
    """Draw premium card with refined shadows."""
    # Multi-layer shadow
    for i in range(4, 0, -1):
        offset = i * 1.5
        alpha = 0.08 * (5 - i) / 4
        c.setFillColor(Color(0, 0, 0, alpha))
        c.roundRect(x + offset, y - offset, w, h, 12, stroke=0, fill=1)

    # Glow effect
    if glow and highlight_color:
        c.setFillColor(Color(highlight_color.red, highlight_color.green, highlight_color.blue, 0.08))
        c.roundRect(x - 8, y - 8, w + 16, h + 16, 16, stroke=0, fill=1)

    # Card body with subtle gradient
    c.setFillColor(BG_CARD)
    c.roundRect(x, y, w, h, 12, stroke=0, fill=1)

    # Inner highlight (top edge)
    c.setStrokeColor(Color(1, 1, 1, 0.04))
    c.setLineWidth(0.5)
    c.line(x + 12, y + h - 0.5, x + w - 12, y + h - 0.5)

    # Border
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 12, stroke=1, fill=0)

    # Accent line
    if highlight_color:
        c.setFillColor(highlight_color)
        c.roundRect(x, y + h - 3, w, 3, 1, stroke=0, fill=1)


def draw_icon_glow(c, x, y, r, color, intensity=1.0):
    """Draw icon with premium glow effect."""
    # Outer glow
    for i in range(5, 0, -1):
        alpha = 0.06 * i * intensity
        c.setFillColor(Color(color.red, color.green, color.blue, alpha))
        c.circle(x, y, r + i * 5, stroke=0, fill=1)

    # Main circle
    c.setFillColor(color)
    c.circle(x, y, r, stroke=0, fill=1)

    # Inner highlights
    c.setFillColor(Color(1, 1, 1, 0.30))
    c.circle(x - r * 0.28, y + r * 0.28, r * 0.38, stroke=0, fill=1)

    c.setFillColor(Color(1, 1, 1, 0.12))
    c.circle(x + r * 0.15, y - r * 0.15, r * 0.25, stroke=0, fill=1)


def draw_metric(c, x, y, value, label, color=PRIMARY, size="large"):
    """Draw metric with refined typography."""
    font_size = 56 if size == "large" else 44
    label_offset = 32 if size == "large" else 26

    c.setFont("NotoSans-Bold", font_size)
    c.setFillColor(color)
    c.drawCentredString(x, y, str(value))

    c.setFont("NotoSans", 11)
    c.setFillColor(TEXT_SECONDARY)
    c.drawCentredString(x, y - label_offset, label)


def draw_progress_bar(c, x, y, w, h, progress, color):
    """Draw animated-looking progress bar."""
    # Background
    c.setFillColor(Color(0.12, 0.14, 0.18, 1))
    c.roundRect(x, y, w, h, h/2, stroke=0, fill=1)

    # Fill with gradient effect
    fill_w = w * progress
    if fill_w > h:
        # Base fill
        c.setFillColor(color)
        c.roundRect(x, y, fill_w, h, h/2, stroke=0, fill=1)

        # Highlight strip
        c.setFillColor(Color(1, 1, 1, 0.15))
        c.roundRect(x + 2, y + h - 3, fill_w - 4, 2, 1, stroke=0, fill=1)


def draw_badge(c, x, y, text, color, variant="default"):
    """Draw refined badge."""
    text_w = c.stringWidth(text, "GeistMono", 7) + 14
    h = 18

    if variant == "outline":
        c.setStrokeColor(Color(color.red, color.green, color.blue, 0.5))
        c.setLineWidth(0.5)
        c.roundRect(x, y - 5, text_w, h, 4, stroke=1, fill=0)
    else:
        c.setFillColor(Color(color.red, color.green, color.blue, 0.15))
        c.roundRect(x, y - 5, text_w, h, 4, stroke=0, fill=1)

    c.setFont("GeistMono", 7)
    c.setFillColor(color)
    c.drawString(x + 7, y + 1, text)


def draw_section_header(c, x, y, title, badge_text=None, badge_color=None):
    """Draw consistent section header."""
    c.setFont("NotoSans-Bold", 40)
    c.setFillColor(TEXT)
    c.drawString(x, y, title)

    if badge_text and badge_color:
        title_w = c.stringWidth(title, "NotoSans-Bold", 40)
        draw_badge(c, x + title_w + 20, y + 5, badge_text, badge_color)


# ============================================================================
# PAGE 1: TITLE
# ============================================================================
def page_title(c):
    draw_background(c)
    draw_noise_texture(c, 0.015)
    draw_grid_dots(c, 0.02)

    cx = W / 2
    cy = H / 2 + 55

    # Animated radar visualization
    # Outer rings with varying opacity
    for i in range(6):
        r = 32 + i * 24
        alpha = 0.22 - i * 0.032
        c.setStrokeColor(Color(0.30, 0.50, 0.90, alpha))
        c.setLineWidth(2.2 - i * 0.3)
        c.circle(cx, cy, r, stroke=1, fill=0)

    # Radar sweep
    c.setFillColor(Color(0.30, 0.50, 0.90, 0.06))
    path = c.beginPath()
    path.moveTo(cx, cy)
    for angle in range(0, 50, 1):
        rad = math.radians(angle + 40)
        path.lineTo(cx + 145 * math.cos(rad), cy + 145 * math.sin(rad))
    path.close()
    c.drawPath(path, fill=1, stroke=0)

    # Scan line
    scan_angle = math.radians(65)
    c.setStrokeColor(Color(0.45, 0.65, 0.95, 0.6))
    c.setLineWidth(1.5)
    c.line(cx, cy, cx + 150 * math.cos(scan_angle), cy + 150 * math.sin(scan_angle))

    # Detection blips
    blips = [(70, 55), (95, 25), (120, 70), (50, 80)]
    for dist, angle_deg in blips:
        rad = math.radians(angle_deg + 40)
        bx = cx + dist * math.cos(rad)
        by = cy + dist * math.sin(rad)
        draw_icon_glow(c, bx, by, 4, PRIMARY_LIGHT, intensity=0.5)

    # Center pulse
    draw_icon_glow(c, cx, cy, 16, PRIMARY, intensity=1.2)

    # Title
    c.setFont("NotoSans-Bold", 66)
    c.setFillColor(TEXT)
    c.drawCentredString(cx, cy - 115, "PULSE RADAR")

    # Tagline
    c.setFont("NotoSans", 19)
    c.setFillColor(TEXT_SECONDARY)
    c.drawCentredString(cx, cy - 152, "AI-система збору знань з командної комунікації")

    # Value proposition
    c.setFont("GeistMono", 12)
    c.setFillColor(PRIMARY_LIGHT)
    c.drawCentredString(cx, cy - 195, "500+ повідомлень  →  5-10 структурованих інсайтів")

    # Tech stack badges
    badges = [("Telegram", MUTED), ("AI/LLM", PRIMARY), ("Real-time", SUCCESS)]
    badge_start = cx - 135
    for i, (text, color) in enumerate(badges):
        draw_badge(c, badge_start + i * 95, 75, text, color, "outline")

    draw_footer(c, 1, 8)


# ============================================================================
# PAGE 2: PROBLEM
# ============================================================================
def page_problem(c):
    draw_background(c, "accent")
    draw_noise_texture(c, 0.012)
    draw_grid_dots(c, 0.018)

    draw_section_header(c, 50, H - 72, "Проблема", "БІЛЬ КОМАНД", ERROR)

    c.setFont("NotoSans", 15)
    c.setFillColor(TEXT_SECONDARY)
    c.drawString(50, H - 108, "Команди тонуть в інформаційному шумі щодня")

    # Stats cards
    card_y = H - 300
    card_h = 155
    card_w = 235
    gap = 22
    start_x = 45

    cards_data = [
        ("500+", "повідомлень / день", ERROR, 1.0),
        ("80%", "це шум", WARNING, 0.8),
        ("30+", "хвилин втрачено", MUTED, 0.5),
    ]

    for i, (value, label, color, progress) in enumerate(cards_data):
        x = start_x + i * (card_w + gap)
        draw_card(c, x, card_y, card_w, card_h, color, glow=True)
        draw_metric(c, x + card_w/2, card_y + 105, value, label, color, "large")
        draw_progress_bar(c, x + 25, card_y + 22, card_w - 50, 8, progress, color)

    # Pain points
    pain_y = 128
    c.setFont("NotoSans-Bold", 14)
    c.setFillColor(TEXT)
    c.drawString(50, pain_y + 55, "Ключові болі:")

    pains = [
        ("Втрата інформації", "Важливі рішення губляться в потоці", ERROR),
        ("Неможливість пошуку", "Не знайти що обговорювали раніше", WARNING),
        ("Відсутність структури", "Знання розкидані по каналах", MUTED),
    ]

    for i, (title, desc, color) in enumerate(pains):
        x = 50 + i * 265
        y = pain_y
        draw_icon_glow(c, x + 10, y + 8, 7, color, intensity=0.6)
        c.setFont("NotoSans-Bold", 12)
        c.setFillColor(TEXT)
        c.drawString(x + 28, y + 4, title)
        c.setFont("NotoSans", 10)
        c.setFillColor(TEXT_SECONDARY)
        c.drawString(x + 28, y - 16, desc)

    draw_footer(c, 2, 8)


# ============================================================================
# PAGE 3: SOLUTION
# ============================================================================
def page_solution(c):
    draw_background(c)
    draw_noise_texture(c, 0.012)
    draw_grid_dots(c, 0.018)

    draw_section_header(c, 50, H - 72, "Рішення", "AI-POWERED", SUCCESS)

    c.setFont("NotoSans", 15)
    c.setFillColor(TEXT_SECONDARY)
    c.drawString(50, H - 108, "Автоматична екстракція та організація командних знань")

    # Flow diagram
    flow_y = H / 2 + 35
    box_w = 125
    box_h = 95
    gap = 32
    start_x = 68

    steps = [
        ("Telegram", "500+ msg", MUTED),
        ("Фільтр", "Сигнал / Шум", PRIMARY),
        ("AI Аналіз", "Екстракція", ACCENT),
        ("Структура", "Топіки & Атоми", PURPLE),
        ("Dashboard", "5-10 інсайтів", SUCCESS),
    ]

    for i, (title, subtitle, color) in enumerate(steps):
        x = start_x + i * (box_w + gap)

        # Connection
        if i > 0:
            line_start = x - gap + 8
            line_end = x - 8
            # Gradient line
            for j in range(int(gap - 16)):
                px = line_start + j
                alpha = 0.3 + 0.2 * math.sin(j * math.pi / (gap - 16))
                c.setStrokeColor(Color(color.red, color.green, color.blue, alpha))
                c.setLineWidth(1.8)
                c.line(px, flow_y, px + 1, flow_y)
            # Arrow
            c.setFillColor(color)
            path = c.beginPath()
            path.moveTo(line_end, flow_y)
            path.lineTo(line_end - 8, flow_y + 5)
            path.lineTo(line_end - 8, flow_y - 5)
            path.close()
            c.drawPath(path, fill=1, stroke=0)

        # Box glow
        c.setFillColor(Color(color.red, color.green, color.blue, 0.06))
        c.roundRect(x - 6, flow_y - box_h/2 - 6, box_w + 12, box_h + 12, 14, stroke=0, fill=1)

        # Box
        c.setFillColor(BG_CARD)
        c.roundRect(x, flow_y - box_h/2, box_w, box_h, 10, stroke=0, fill=1)
        c.setStrokeColor(color)
        c.setLineWidth(1.5)
        c.roundRect(x, flow_y - box_h/2, box_w, box_h, 10, stroke=1, fill=0)

        # Step number
        draw_icon_glow(c, x + 20, flow_y + box_h/2 - 20, 13, color, intensity=0.4)
        c.setFont("GeistMono-Bold", 11)
        c.setFillColor(TEXT)
        c.drawCentredString(x + 20, flow_y + box_h/2 - 24, str(i + 1))

        # Title & subtitle
        c.setFont("NotoSans-Bold", 13)
        c.setFillColor(TEXT)
        c.drawCentredString(x + box_w/2, flow_y + 10, title)

        c.setFont("GeistMono", 9)
        c.setFillColor(TEXT_SECONDARY)
        c.drawCentredString(x + box_w/2, flow_y - 12, subtitle)

    # Result card
    result_y = 82
    draw_card(c, 90, result_y - 28, W - 180, 65, SUCCESS, glow=True)

    c.setFont("NotoSans-Bold", 17)
    c.setFillColor(SUCCESS)
    c.drawCentredString(W/2, result_y + 12, "Результат: 30 хв → 5 хв щоденного review")

    c.setFont("NotoSans", 11)
    c.setFillColor(TEXT_SECONDARY)
    c.drawCentredString(W/2, result_y - 10, "Фокус на трендах та інсайтах, не на окремих повідомленнях")

    draw_footer(c, 3, 8)


# ============================================================================
# PAGE 4: KNOWLEDGE ATOMS
# ============================================================================
def page_atoms(c):
    draw_background(c)
    draw_noise_texture(c, 0.012)
    draw_grid_dots(c, 0.018)

    draw_section_header(c, 50, H - 72, "Атоми Знань", "CORE CONCEPT", PURPLE)

    c.setFont("NotoSans", 15)
    c.setFillColor(TEXT_SECONDARY)
    c.drawString(50, H - 108, "Структуровані одиниці знань, витягнуті з повідомлень")

    # Atom types
    atoms = [
        ("TASK", "Завдання", "Дії та призначення команді", ACCENT),
        ("IDEA", "Ідея", "Пропозиції та креативні рішення", PRIMARY),
        ("DECISION", "Рішення", "Узгоджені результати команди", SUCCESS),
        ("INSIGHT", "Інсайт", "Цінні спостереження та висновки", PURPLE),
        ("QUESTION", "Питання", "Відкриті запити що потребують відповіді", WARNING),
        ("PROBLEM", "Проблема", "Блокери та проблеми що виникли", ERROR),
    ]

    card_w = 240
    card_h = 108
    gap_x = 20
    gap_y = 22
    start_x = 45
    start_y = H - 175

    for i, (code, name, desc, color) in enumerate(atoms):
        col = i % 3
        row = i // 3
        x = start_x + col * (card_w + gap_x)
        y = start_y - row * (card_h + gap_y)

        draw_card(c, x, y - card_h, card_w, card_h)

        # Color accent
        c.setFillColor(color)
        c.roundRect(x + 1, y - card_h + 1, 5, card_h - 2, 2, stroke=0, fill=1)

        # Icon
        draw_icon_glow(c, x + 38, y - 40, 18, color, intensity=0.8)

        # Code badge
        draw_badge(c, x + 65, y - 45, code, color)

        # Name
        c.setFont("NotoSans-Bold", 14)
        c.setFillColor(TEXT)
        c.drawString(x + 135, y - 48, name)

        # Description
        c.setFont("NotoSans", 10)
        c.setFillColor(TEXT_SECONDARY)
        c.drawString(x + 18, y - 82, desc)

    # Workflow
    workflow_y = 72
    c.setFont("GeistMono", 10)
    c.setFillColor(TEXT_MUTED)
    c.drawCentredString(W/2, workflow_y, "DRAFT   →   PENDING_REVIEW   →   APPROVED / REJECTED")

    states = [(MUTED, W/2 - 175), (WARNING, W/2 - 25), (SUCCESS, W/2 + 140)]
    for color, x in states:
        draw_icon_glow(c, x, workflow_y + 3, 5, color, intensity=0.4)

    draw_footer(c, 4, 8)


# ============================================================================
# PAGE 5: DASHBOARD
# ============================================================================
def page_dashboard(c):
    draw_background(c)
    draw_noise_texture(c, 0.010)

    draw_section_header(c, 50, H - 72, "Dashboard", "REAL-TIME", PRIMARY)

    c.setFont("NotoSans", 15)
    c.setFillColor(TEXT_SECONDARY)
    c.drawString(50, H - 108, "Все що потрібно — на одному екрані")

    # Dashboard mockup
    dash_x = 35
    dash_y = 65
    dash_w = W - 70
    dash_h = H - 200

    # Container shadow
    c.setFillColor(Color(0, 0, 0, 0.25))
    c.roundRect(dash_x + 4, dash_y - 4, dash_w, dash_h, 14, stroke=0, fill=1)

    # Container
    c.setFillColor(Color(0.06, 0.07, 0.09, 1))
    c.roundRect(dash_x, dash_y, dash_w, dash_h, 14, stroke=0, fill=1)
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.roundRect(dash_x, dash_y, dash_w, dash_h, 14, stroke=1, fill=0)

    # Sidebar
    sidebar_w = 175
    c.setFillColor(Color(0.04, 0.045, 0.06, 1))
    c.roundRect(dash_x + 5, dash_y + 5, sidebar_w, dash_h - 10, 10, stroke=0, fill=1)

    # Logo
    c.setFont("NotoSans-Bold", 15)
    c.setFillColor(PRIMARY)
    c.drawString(dash_x + 18, dash_y + dash_h - 38, "PULSE")
    c.setFillColor(TEXT)
    c.drawString(dash_x + 70, dash_y + dash_h - 38, "RADAR")

    # Nav
    nav_items = [
        ("Dashboard", PRIMARY, True),
        ("Повідомлення", TEXT_MUTED, False),
        ("Топіки", TEXT_MUTED, False),
        ("Атоми", TEXT_MUTED, False),
        ("Пошук", TEXT_MUTED, False),
        ("Налаштування", TEXT_MUTED, False),
    ]

    for i, (item, color, active) in enumerate(nav_items):
        y = dash_y + dash_h - 78 - i * 34
        if active:
            c.setFillColor(Color(0.30, 0.50, 0.90, 0.12))
            c.roundRect(dash_x + 10, y - 9, sidebar_w - 14, 30, 6, stroke=0, fill=1)
            c.setStrokeColor(PRIMARY)
            c.setLineWidth(2)
            c.line(dash_x + 10, y - 9 + 15, dash_x + 10, y - 9 + 15)
        c.setFont("NotoSans", 11)
        c.setFillColor(color)
        c.drawString(dash_x + 22, y, item)

    # Content area
    content_x = dash_x + sidebar_w + 18
    content_w = dash_w - sidebar_w - 38
    content_top = dash_y + dash_h - 18

    # Stats
    stat_w = (content_w - 48) / 4
    stat_h = 72
    stats = [
        ("128", "Повідомлень", PRIMARY),
        ("24", "Сигналів", SUCCESS),
        ("8", "Нових атомів", ACCENT),
        ("3", "Активних топіків", PURPLE),
    ]

    for i, (val, label, color) in enumerate(stats):
        x = content_x + i * (stat_w + 16)
        y = content_top - stat_h - 12

        c.setFillColor(Color(0.08, 0.09, 0.12, 1))
        c.roundRect(x, y, stat_w, stat_h, 8, stroke=0, fill=1)

        c.setFont("NotoSans-Bold", 28)
        c.setFillColor(color)
        c.drawString(x + 14, y + stat_h - 32, val)

        c.setFont("GeistMono", 8)
        c.setFillColor(TEXT_SECONDARY)
        c.drawString(x + 14, y + 10, label)

        c.setFillColor(color)
        c.roundRect(x, y + stat_h - 3, stat_w, 3, 1, stroke=0, fill=1)

    # Activity
    activity_y = content_top - stat_h - 58
    c.setFont("NotoSans-Bold", 13)
    c.setFillColor(TEXT)
    c.drawString(content_x, activity_y, "Остання активність")

    activities = [
        ("Нове DECISION в топіку 'Mobile App'", SUCCESS, "2 хв"),
        ("3 TASK атоми очікують review", ACCENT, "5 хв"),
        ("Пошук: 'API integration' — 12 результатів", PRIMARY, "8 хв"),
        ("Telegram: 45 повідомлень оброблено", MUTED, "12 хв"),
    ]

    for i, (text, color, time) in enumerate(activities):
        y = activity_y - 36 - i * 34

        c.setFillColor(Color(0.08, 0.09, 0.12, 1))
        c.roundRect(content_x, y - 11, content_w, 30, 5, stroke=0, fill=1)

        draw_icon_glow(c, content_x + 18, y + 3, 6, color, intensity=0.4)

        c.setFont("NotoSans", 10)
        c.setFillColor(TEXT_SECONDARY)
        c.drawString(content_x + 35, y - 1, text)

        c.setFont("GeistMono", 8)
        c.setFillColor(TEXT_MUTED)
        c.drawRightString(content_x + content_w - 14, y - 1, time)

    draw_footer(c, 5, 8)


# ============================================================================
# PAGE 6: HOW IT WORKS
# ============================================================================
def page_how_it_works(c):
    draw_background(c)
    draw_noise_texture(c, 0.012)
    draw_grid_dots(c, 0.018)

    draw_section_header(c, 50, H - 72, "Як це працює", "4 РІВНІ", PRIMARY)

    c.setFont("NotoSans", 15)
    c.setFillColor(TEXT_SECONDARY)
    c.drawString(50, H - 108, "Чотири рівні обробки інформації")

    # Pyramid layers
    layers = [
        ("Рівень 4: Dashboard", "Тренди та проблеми", "Тут працює людина", PRIMARY),
        ("Рівень 3: Атоми", "Структуровані витяги", "5% drill-down", SUCCESS),
        ("Рівень 2: Сигнали", "Відфільтровані повідомлення", "Тільки важливе", ACCENT),
        ("Рівень 1: Raw", "Всі повідомлення", "500+ msg/день", MUTED),
    ]

    layer_h = 68
    layer_start_y = H - 158
    max_w = 680

    for i, (name, subtitle, note, color) in enumerate(layers):
        y = layer_start_y - i * (layer_h + 16)
        w = max_w * (0.52 + (3 - i) * 0.16)
        x = (W - w) / 2

        # Glow
        c.setFillColor(Color(color.red, color.green, color.blue, 0.05))
        c.roundRect(x - 6, y - layer_h - 6, w + 12, layer_h + 12, 14, stroke=0, fill=1)

        # Layer
        c.setFillColor(BG_CARD)
        c.roundRect(x, y - layer_h, w, layer_h, 11, stroke=0, fill=1)
        c.setStrokeColor(color)
        c.setLineWidth(1.5)
        c.roundRect(x, y - layer_h, w, layer_h, 11, stroke=1, fill=0)

        # Level number
        draw_icon_glow(c, x + 32, y - layer_h/2, 16, color, intensity=0.6)
        c.setFont("NotoSans-Bold", 15)
        c.setFillColor(TEXT)
        c.drawCentredString(x + 32, y - layer_h/2 - 5, str(4 - i))

        # Text
        c.setFont("NotoSans-Bold", 14)
        c.setFillColor(TEXT)
        c.drawString(x + 58, y - layer_h/2 + 6, name)

        c.setFont("NotoSans", 11)
        c.setFillColor(TEXT_SECONDARY)
        c.drawString(x + 58, y - layer_h/2 - 18, subtitle)

        c.setFont("GeistMono", 10)
        c.setFillColor(color)
        c.drawRightString(x + w - 22, y - layer_h/2 - 4, note)

        # Arrow
        if i < len(layers) - 1:
            arrow_y = y - layer_h - 9
            c.setFillColor(Color(0.35, 0.38, 0.45, 0.6))
            path = c.beginPath()
            path.moveTo(W/2 - 10, arrow_y)
            path.lineTo(W/2 + 10, arrow_y)
            path.lineTo(W/2, arrow_y - 9)
            path.close()
            c.drawPath(path, fill=1, stroke=0)

    draw_footer(c, 6, 8)


# ============================================================================
# PAGE 7: VALUE
# ============================================================================
def page_value(c):
    draw_background(c)
    draw_noise_texture(c, 0.012)
    draw_grid_dots(c, 0.018)

    draw_section_header(c, 50, H - 72, "Цінність", "ROI", SUCCESS)

    c.setFont("NotoSans", 15)
    c.setFillColor(TEXT_SECONDARY)
    c.drawString(50, H - 108, "Що отримує ваша команда з Pulse Radar")

    # Value metrics
    metrics = [
        ("50×", "Менше інформації", "500 msg → 10 atoms", PRIMARY),
        ("6×", "Швидший review", "30 хв → 5 хв", SUCCESS),
        ("100%", "Searchable історія", "Нічого не губиться", ACCENT),
        ("85%+", "Точність AI", "Human-in-the-loop", PURPLE),
    ]

    card_w = 180
    card_h = 165
    gap = 18
    total_w = len(metrics) * card_w + (len(metrics) - 1) * gap
    start_x = (W - total_w) / 2
    card_y = H - 320

    for i, (value, title, subtitle, color) in enumerate(metrics):
        x = start_x + i * (card_w + gap)
        draw_card(c, x, card_y, card_w, card_h, color, glow=True)

        c.setFont("NotoSans-Bold", 42)
        c.setFillColor(color)
        c.drawCentredString(x + card_w/2, card_y + card_h - 52, value)

        c.setFont("NotoSans-Bold", 12)
        c.setFillColor(TEXT)
        c.drawCentredString(x + card_w/2, card_y + card_h - 88, title)

        c.setFont("GeistMono", 9)
        c.setFillColor(TEXT_SECONDARY)
        c.drawCentredString(x + card_w/2, card_y + card_h - 108, subtitle)

    # Benefits
    benefits_y = 138
    c.setFont("NotoSans-Bold", 15)
    c.setFillColor(TEXT)
    c.drawString(50, benefits_y + 45, "Переваги для команди:")

    benefits = [
        ("Ніколи не пропустите важливі рішення", SUCCESS),
        ("Миттєвий пошук будь-якого обговорення", PRIMARY),
        ("Структурована база знань команди", ACCENT),
        ("AI пропонує — людина затверджує", PURPLE),
    ]

    for i, (benefit, color) in enumerate(benefits):
        x = 50 + (i % 2) * 405
        y = benefits_y - (i // 2) * 38
        draw_icon_glow(c, x + 10, y + 4, 7, color, intensity=0.5)
        c.setFont("NotoSans", 12)
        c.setFillColor(TEXT)
        c.drawString(x + 28, y, benefit)

    draw_footer(c, 7, 8)


# ============================================================================
# PAGE 8: CTA
# ============================================================================
def page_cta(c):
    draw_background(c)
    draw_noise_texture(c, 0.018)
    draw_grid_dots(c, 0.025)

    cx = W / 2
    cy = H / 2 + 25

    # Decorative rings
    for i in range(5):
        r = 185 + i * 40
        alpha = 0.045 - i * 0.008
        c.setStrokeColor(Color(0.30, 0.50, 0.90, alpha))
        c.setLineWidth(1.2)
        c.circle(cx, cy, r, stroke=1, fill=0)

    # Main message
    c.setFont("NotoSans-Bold", 46)
    c.setFillColor(TEXT)
    c.drawCentredString(cx, cy + 95, "Готові трансформувати")
    c.drawCentredString(cx, cy + 42, "командну комунікацію?")

    # CTA button
    btn_w = 340
    btn_h = 58
    btn_x = cx - btn_w/2
    btn_y = cy - 58

    # Button glow
    for i in range(4, 0, -1):
        alpha = 0.08 * i
        c.setFillColor(Color(0.30, 0.50, 0.90, alpha))
        c.roundRect(btn_x - i * 4, btn_y - i * 4, btn_w + i * 8, btn_h + i * 8, 14 + i, stroke=0, fill=1)

    c.setFillColor(PRIMARY)
    c.roundRect(btn_x, btn_y, btn_w, btn_h, 12, stroke=0, fill=1)

    # Button highlight
    c.setFillColor(Color(1, 1, 1, 0.12))
    c.roundRect(btn_x + 4, btn_y + btn_h - 8, btn_w - 8, 4, 2, stroke=0, fill=1)

    c.setFont("NotoSans-Bold", 17)
    c.setFillColor(TEXT)
    c.drawCentredString(cx, btn_y + 20, "Почати з Pulse Radar  →")

    # Stats
    c.setFont("GeistMono", 12)
    c.setFillColor(TEXT_SECONDARY)
    c.drawCentredString(cx, cy - 112, "40 користувачів  ·  5-10 команд  ·  Telegram інтеграція")

    # Tech
    c.setFont("GeistMono", 9)
    c.setFillColor(TEXT_MUTED)
    c.drawCentredString(cx, 72, "FastAPI  ·  React  ·  PostgreSQL  ·  pgvector  ·  AI/LLM  ·  WebSocket")

    draw_footer(c, 8, 8)


# ============================================================================
# MAIN
# ============================================================================
def create_pitch_deck():
    output_path = Path(__file__).parent / "pulse-radar-deck.pdf"

    c = canvas.Canvas(str(output_path), pagesize=PAGE_SIZE)

    pages = [
        page_title,
        page_problem,
        page_solution,
        page_atoms,
        page_dashboard,
        page_how_it_works,
        page_value,
        page_cta,
    ]

    for i, page_func in enumerate(pages):
        page_func(c)
        if i < len(pages) - 1:
            c.showPage()

    c.save()
    print(f"✅ Ітерація 3 (фінальна): {output_path}")
    print(f"   Сторінок: {len(pages)}")
    print(f"   Мова: Українська")
    print(f"   Якість: Premium polish")
    return output_path


if __name__ == "__main__":
    create_pitch_deck()
