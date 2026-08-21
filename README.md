# Lumière Studio — photography studio website

A six-page, fully static website for an editorial photography studio. Dark editorial art
direction, real photography throughout, no build step, no framework, no dependencies.

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000     # then visit http://localhost:8000
```

## Pages

| File | What's on it |
|---|---|
| `index.html` | Hero slideshow (4 cinematic frames), studio intro, five disciplines, six featured commissions, stats, testimonials, CTA |
| `portfolio.html` | 27 projects with discipline filters, click-to-enlarge lightbox |
| `services.html` | Five services with imagery, inclusions and starting prices, plus the four-step process |
| `gallery.html` | 38-frame editorial masonry gallery, filterable, lightbox |
| `about.html` | Studio story, stats, four team members, method, testimonials |
| `contact.html` | Validating enquiry form, studio details, FAQs |

## Structure

```
├── index.html  portfolio.html  services.html
├── gallery.html  about.html  contact.html
├── robots.txt  sitemap.xml  CREDITS.md
└── assets/
    ├── css/main.css        design system + all page styles
    ├── css/fonts.css       self-hosted @font-face rules
    ├── fonts/              Cormorant Garamond + Inter (latin woff2)
    ├── js/main.js          slideshow, reveals, filters, lightbox, menu, form
    ├── favicon.svg
    └── images/
        ├── hero/  weddings/  fashion/  portraits/
        ├── commercial/  events/  about/  gallery/
```

## Photography

84 photographs, all from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license) (free for commercial use, no attribution
required — `CREDITS.md` lists every source URL anyway).

Each photo was cropped to the aspect ratio its layout slot needs and encoded as **WebP at
three widths**, referenced through `srcset` + `sizes` so browsers download the smallest file
that fits. Every image below the fold is `loading="lazy"`, every image carries explicit
`width`/`height` (no layout shift), a descriptive `alt`, and a ~300-byte inline blurred
placeholder so nothing ever appears as an empty grey box.

### Swapping in your own photography

1. Drop your JPEGs into `_source/` (any size, any name).
2. Match each one to a slot name — the filenames in `assets/images/**` are the slot names,
   e.g. `hero-golden-hour-vows`, `cover-weddings`, `service-portrait`, `gallery-*`.
3. Export each at the three widths already present for that slot, same names, `.webp`.

Nothing in the HTML needs to change. If you prefer to regenerate the markup, the small
Python generator used to build these pages is straightforward to re-run — ask and it can be
included in the handover.

## Deployment

Static — drop the folder on Netlify, Vercel, Cloudflare Pages, GitHub Pages or any host.
Two things to do before going live:

- **Contact form.** `assets/js/main.js` currently validates and confirms in the browser only.
  Point the `<form>` at your endpoint (Formspree, Netlify Forms, your own handler) and remove
  the `preventDefault` block.
- **Domain.** Replace `https://www.lumierestudio.com/` in `sitemap.xml` and `robots.txt`, and
  update the studio address, phone and email in the footer and on `contact.html`.

## Browser support & accessibility

Tested at 1440px and 390px in Chromium: no broken images, no console errors, no horizontal
overflow on any page. Skip link, visible focus rings, `aria-current` on the active nav item,
labelled form fields, keyboard-operable lightbox (←/→/Esc), and full
`prefers-reduced-motion` support — the slideshow, Ken Burns pan, marquee, reveals and
count-ups all stand still for users who ask for that.
