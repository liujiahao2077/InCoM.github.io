# AGENTS.md

## Project

InCoM — single-page static website for a robotics research paper. Shows abstract, simulation & real-world video comparison tables.

## Tech Stack

Pure HTML + CSS. No build step, no framework, no npm.

## Structure

```
index.html                  # The entire page (abstract + video tables)
public/assets/sim/          # Simulation experiment videos (ACT/, DSPv2/, InCoM/)
public/assets/real/          # Real-world experiment videos (ACT/, Pi0.5/, InCoM/)
```

## Deployment

Push to GitHub Pages. No build required — `index.html` is served directly.

## Editing Content

All content is in `index.html`. To change:
- Abstract text: search for `<!-- TODO: Replace with your paper abstract -->`
- Video table rows: each `<tr>` in the `<tbody>` sections
- Styles: `<style>` block in `<head>`