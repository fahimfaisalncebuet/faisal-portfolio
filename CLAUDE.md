# Fahim Faisal portfolio: auto-publish workflow

This repo is Md. Fahim Faisal's personal website. It is live at
https://fahimfaisalncebuet.vercel.app/ and Vercel deploys automatically on every push to `main`.

**The owner wants hands-off publishing.** When he asks for any change to the website
(new role, new project, new photo/logo, text edit, design change, new section, removal),
do the whole job without asking him to touch files, GitHub or Vercel:

1. `git pull --rebase origin main` first: he sometimes edits on github.com.
2. Make the change in `index.html` (and add images under `assets/`).
3. Run `node scripts/check-site.mjs` and fix anything it reports.
4. `git add -A && git commit -m "<short description of the change>"` then `git push origin main`.
   Work directly on `main`. No branches or pull requests: pushing to `main` is what publishes the site.
5. Run `node scripts/check-site.mjs --live`. It waits for Vercel and confirms the live site
   serves the new version and every image loads. Only say "done/live" after this passes.
6. Reply with a short summary of what changed and the live URL.

If the live check fails, say so plainly with its output, and point him to vercel.com → project
→ Deployments. Never claim the site updated when the check did not pass.

Ask before acting only when the request is ambiguous about *content* (e.g. which dates, which wording),
or before deleting a whole section. Never invent achievements, quotes, testimonials or numbers.
Use only facts he gives or that are already on the site.

## Site structure

- Single static page: `index.html` (plain HTML + CSS + a little JS, no build step, no framework).
- Images live in `assets/` only, referenced as `assets/<name>`. File names: lowercase, hyphens, no spaces.
- Font: Inter (Google Fonts). Palette in `:root`: `--ink #202124`, `--cream #f9f8f2`, `--maroon #70000e`.
- Headline style: bold black line, then a light maroon line: `<h2 class="h2">Selected <span class="light">Work</span></h2>`.
- Sections (ids): hero, Get Started tiles, `#about` (+ stats panel), Featured-at logo strip,
  `#work` (project `.card`s), `#leadership` (`.role` rows, numbered 01, 02…), `#research` (`.quote` cards),
  education/skills, `#contact` (CTA), footer.

### Copy-paste patterns

Leadership role (keep numbering sequential, newest first):
```html
<div class="role"><span class="n">01</span><div><img class="org" src="assets/org-logo.png" alt="Org logo" /><h3>Organisation</h3><div class="when">Title · Mon YYYY – Present</div><p>One sentence.</p></div></div>
```
Logo `<img class="org">` is optional. Leave it out if there is no logo.

Project card:
```html
<article class="card reveal">
  <div class="thumb" style="background:linear-gradient(135deg,#0e7490,#1e3a8a)">Short Name</div>
  <span class="tag">Category</span>
  <h3>Project title</h3>
  <p>Two-line description.</p>
  <div class="meta"><span>Where</span><span>Year</span></div>
</article>
```

Featured-at logo: `<img src="assets/x.png" alt="X" class="logo-img" style="height:38px" />` inside `.featured .logos`.

## Images the owner sends

When he attaches an image in chat, copy it into `assets/` with a clear name, and use it.
For logos he only has as screenshots, crop with PowerShell + System.Drawing (Python is not installed).
Downloading a logo from an organisation's own website is fine when he asks for it.

## Rules that prevent past breakages

- Never paste page source from a claude.ai preview/artifact. It adds an outer wrapper (two `<!doctype>`).
  The checker catches this.
- Every `src="assets/..."` must exist in `assets/`. The checker catches this.
- Keep the page mobile-friendly: test layout changes at phone width when possible.
- Commit identity is already configured in this clone's git config. Don't change it.
