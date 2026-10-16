"""
The Odysseyra mark: a drafting compass with a star inside, drawn only with circles and straight lines, in the sheet's
ink (#12294f) and gold (#b08d3e).

The compass (ring, four pointers whose widest point sits on the ring, four short ticks inside it on the diagonals) is
turned 22.5 degrees east; the rose at its centre (a gold four-point star over a smaller ink one on the diagonals) stays
upright, like the declination diagram in a map sheet's margin. The canvas is cropped square to the drawing.

Writes logo.svg (ink, on paper), logo-white.svg (on ink grounds) and favicon.svg (a square ink tile; no ticks or inner
rose, which are lost at 16px).
Usage: python3 src/assets/logo/make-logo.py public
"""
import math
import sys

C = 32  # centre of the 64-unit drawing grid
INK, GOLD, WHITE = '#12294f', '#b08d3e', '#ffffff'
TURN = 22.5  # the compass, east of the star

R = 24.5  # the ring
TIP, NORTH_TIP = 30.6, 31.8  # pointer tips: north reaches further
HALF, NORTH_HALF = 3.6, 4.4  # pointers' half width on the ring: north a little wider
TAIL = R - 4.5  # pointers' inner end
STAR, ROSE = 17.5, 13.5  # the gold star's and the ink diagonal star's tips (clear of the tails and the ticks)


def pt(r, deg):
    a = math.radians(deg - 90)  # 0 deg = north, clockwise
    return (round(C + r * math.cos(a), 3), round(C + r * math.sin(a), 3))


def points(pts):
    return ' '.join(f'{x},{y}' for x, y in pts)


def star(tip, inner, fill, rot=0):
    pts = []
    for i in range(4):
        pts += [pt(tip, rot + i * 90), pt(inner, rot + i * 90 + 45)]
    return f'<polygon points="{points(pts)}" fill="{fill}"/>'


def pointer(deg, tip, half, fill):
    """A kite: its widest point on the ring, the tip outside, a short tail inside."""
    w = math.degrees(math.atan2(half, R))
    rw = math.hypot(R, half)
    return f'<polygon points="{points([pt(tip, deg), pt(rw, deg + w), pt(TAIL, deg), pt(rw, deg - w)])}" fill="{fill}"/>'


def mark(fg, gold, small):
    w = 3.4 if small else 3
    inner = R - w / 2  # the ring's inner edge
    compass = [f'<circle cx="{C}" cy="{C}" r="{R}" fill="none" stroke="{fg}" stroke-width="{w}"/>']
    if not small:
        for d in (45, 135, 225, 315):  # short ticks inside the ring
            (x1, y1), (x2, y2) = pt(inner + 0.3, d), pt(inner - 2.5, d)
            compass.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{fg}" stroke-width="2.6"/>')
    compass += [pointer(d, TIP, HALF, fg) for d in (90, 180, 270)]
    compass.append(pointer(0, NORTH_TIP, NORTH_HALF, fg))
    parts = [f'<g transform="rotate({TURN} {C} {C})">{"".join(compass)}</g>']
    if not small:
        parts.append(star(ROSE, 3.2, fg, 45))
    parts.append(star(STAR, 4.4, gold))
    return ''.join(parts)


def half_extent():
    """Half the side of the smallest centred square holding the turned drawing, plus a hair."""
    tips = [pt(NORTH_TIP, TURN)] + [pt(TIP, TURN + d) for d in (90, 180, 270)]
    far = max(max(abs(x - C), abs(y - C)) for x, y in tips)
    return max(far, R + 1.5) + 0.6


def svg(body, bg=None, scale=1.0):
    h = half_extent()
    o, size = round(C - h, 3), round(2 * h, 3)
    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{o} {o} {size} {size}">'
    if bg:  # on a tile the drawing keeps a margin from the tile's edge
        return f'{head}<rect x="{o}" y="{o}" width="{size}" height="{size}" fill="{bg}"/><g transform="translate({C} {C}) scale({scale}) translate(-{C} -{C})">{body}</g></svg>\n'
    return f'{head}{body}</svg>\n'


out = sys.argv[1] if len(sys.argv) > 1 else 'public'
open(f'{out}/logo.svg', 'w').write(svg(mark(INK, GOLD, False)))
open(f'{out}/logo-white.svg', 'w').write(svg(mark(WHITE, GOLD, False)))
open(f'{out}/favicon.svg', 'w').write(svg(mark(WHITE, GOLD, True), bg=INK, scale=0.88))
