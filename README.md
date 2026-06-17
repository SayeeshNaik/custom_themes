# Custom Themes

A reusable theming engine for any Frappe v16+ site (works with ERPNext and custom apps). Customize the desk and website without touching core code: colors, typography, layout, navbar/sidebar, buttons, status colors, branding & login, icon replacement, dialogs, header/footer, dark mode, and animations.

## Install

```bash
bench --site <your-site> install-app custom_themes
bench build --app custom_themes
bench --site <your-site> migrate
bench --site <your-site> clear-cache
```

## Configure

Open **Custom Theme Settings** (search in the Awesome Bar). Each section has its own enable checkbox — only enabled sections apply, so you can mix and match safely.

Highlights:

- **Live Preview** — try unsaved changes on the current page; nothing applies for other users until you Save. Saving pushes the theme to every open tab in real time.
- **Icon overrides** — Tools → *Browse Frappe Icons*, click any icon, upload your SVG/PNG replacement directly in the dialog. Uploaded files are made public automatically so icons render for every user (including the login page).
- **Dialogs & Popups** — header colors, backdrop blur, entrance animation (Fade/Zoom/Slide).
- **Header & Footer** — website header/footer colors, sticky header, dismissible announcement bar, custom footer HTML.
- **Animations** — page transitions, hover lift, button press feedback, speed control. The OS "reduced motion" preference is always respected.
- **Export / Import** — Tools → Export Theme produces a JSON you can import on any other bench running this app.

## Architecture notes (for maintainers)

- `public/js/custom_themes.js` reads settings from `frappe.boot.custom_theme_settings` (desk) or the public API (website/guest), then sets `--ct-*` CSS variables and one body class per enabled section (`ct-colors`, `ct-typo`, …).
- `public/css/custom_themes.css` scopes every rule behind those section classes, and **every `var()` has a fallback** — a `var()` without a fallback silently invalidates the whole declaration when the property is missing, which makes styles "randomly" stop applying. Keep the fallbacks.
- Icon replacement patches `frappe.utils.icon()` once at load (no-op while no overrides exist), swaps already-rendered SVGs via DOM scan + MutationObserver, and keeps the original SVG markup on each replacement for instant restore when disabled.
- The settings controller force-converts private attachments to public files on save.
