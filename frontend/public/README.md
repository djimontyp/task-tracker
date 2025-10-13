# Public Assets - Favicon Documentation

This directory contains static assets served by Vite. All files here are copied to the root of `dist/` during build.

## Current Favicon Files

- **favicon.svg** - Modern scalable vector icon (primary, best quality)
- **favicon.ico** - Legacy 32x32 ICO for old browsers
- **apple-touch-icon.png** - 180x180 for iOS Safari/PWA
- **favicon-192.png** - 192x192 for Android Chrome
- **favicon-512.png** - 512x512 for PWA splash screens
- **manifest.json** - Web App Manifest for PWA support

## Design

The radar/pulse design represents:
- **Theme**: Task tracking and monitoring
- **Visual**: Concentric circles (radar) with task dots
- **Colors**: Blue gradient (#3b82f6 → #8b5cf6)
- **Metaphor**: "Pulse Radar" - real-time tracking

## Updating Favicons

### Option 1: Online Tools (Recommended)
1. Update `favicon.svg` with your design
2. Upload to https://realfavicongenerator.net/
3. Download generated package
4. Replace PNG/ICO files in this directory
5. Update `manifest.json` if colors changed

### Option 2: Command Line Tools
```bash
# Install ImageMagick or rsvg-convert
sudo apt install imagemagick librsvg2-bin

# Generate PNGs from SVG
rsvg-convert -w 192 -h 192 favicon.svg > favicon-192.png
rsvg-convert -w 512 -h 512 favicon.svg > favicon-512.png
rsvg-convert -w 180 -h 180 favicon.svg > apple-touch-icon.png

# Generate ICO (requires ImageMagick)
convert favicon.svg -define icon:auto-resize=32,16 favicon.ico
```

### Option 3: Node.js Script (Current)
The project includes generation scripts (were used once, then deleted):
- Simple programmatic PNG generation using pngjs
- No external tools required
- Generated files are already in this directory

## Docker Compose Watch

The `compose.yml` configuration syncs this directory:
```yaml
- action: sync
  path: ./frontend/public
  target: /app/public
```

Changes to files here will be immediately reflected in development mode:
```bash
just services-dev
```

## Browser Support

| Format | Browsers |
|--------|----------|
| **SVG** | Chrome 80+, Firefox 41+, Safari 9+, Edge 79+ |
| **ICO** | All browsers (fallback) |
| **PNG** | iOS Safari, Android Chrome, PWA |

Modern browsers prefer SVG (best quality), falling back to ICO if needed.

## Troubleshooting

### Favicon not updating in browser?
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Check Docker logs: `docker logs task-tracker-dashboard`
- Verify Nginx caching: `docker logs task-tracker-nginx`

### Files not syncing in Docker?
```bash
# Restart dashboard service
just rebuild dashboard

# Or full restart
just services-stop
just services-dev
```

### Wrong colors/design?
- Check `manifest.json` theme_color matches your design
- Update meta tag in `index.html` if needed
- Verify PNG files match SVG design

## PWA Configuration

The `manifest.json` enables "Add to Home Screen" on mobile:
- **name**: Full app name (shown on splash screen)
- **short_name**: Icon label on home screen
- **theme_color**: Browser UI color (#3b82f6)
- **background_color**: Splash screen background (#0f172a)

Update these values if branding changes.
