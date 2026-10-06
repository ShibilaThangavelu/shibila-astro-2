# Shibila Thangavelu, portfolio

Astro site with GSAP and ScrollTrigger. The page is static HTML at build time, with small scripts for the interactive parts.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serve the built site
```

## Where things live

- `src/pages/index.astro` assembles the page from section components.
- `src/components/` one file per section: Nav, Hero, Glance (recruiter summary), Demo, Work, Numbers, Marquee, Stack, Record, Practice, Contact, Palette.
- `src/styles/global.css` all styling, with light and dark tokens at the top.
- `src/scripts/interactions.js` theme toggle, AWS service map, pipeline demo, stack inspector, flip cards, command palette (Ctrl or Cmd K), recruiter mode, easter eggs.
- `src/scripts/motion.js` GSAP entrance timeline, scroll choreography, marquee, magnetic buttons.
- `src/scripts/gsap-global.js` loads GSAP from npm and exposes it to the other two scripts.

## Edit your content

Text lives in the component files. The project, stack and practice details that feed the service map, stack inspector and flip cards are plain arrays near the top of `src/scripts/interactions.js` (`NODES`, `USE`, `USED`, `PRAC`).

## Deploy to Vercel

1. Create a GitHub repository and push this folder.
2. In Vercel choose Add New, then Project, and import the repository.
3. Vercel detects Astro. Keep the defaults (build command `npm run build`, output `dist`) and deploy.

Every push to the main branch redeploys.
