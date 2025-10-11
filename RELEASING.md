# 🚀 XRglass Releasing Guide

This project uses **[standard-version](https://github.com/conventional-changelog/standard-version)** and **GitHub Actions** to fully automate versioning, changelog creation, tagging, and GitHub Releases.

---

## 🔄 Normal release flow

1. Ensure your latest commits on `main` follow **Conventional Commit** format:
   - `feat(component): add XRPL trustline scanner`
   - `fix(api): handle timeout on edge runtime`
   - `chore(ci): update dependencies`
   - `feat!: breaking change description` → triggers **major** bump.

2. Trigger a release manually:
   - Go to: **GitHub → Actions → Release (standard-version)**  
   - Click **Run workflow** → choose bump type (`auto`, `patch`, `minor`, or `major`)
   - The workflow:
     - Bumps `package.json` + `package-lock.json`
     - Generates or updates `CHANGELOG.md`
     - Creates a new git tag (`vX.Y.Z`)
     - Pushes to `main`
     - Publishes a **GitHub Release**

3. **Vercel** automatically redeploys from `main`.

---

## 🧩 Configuration details

- Workflow file: `.github/workflows/release.yml`
- Versioning tool: `standard-version`
- Permissions: **Settings → Actions → General → Read and write permissions**
- Git identity: preconfigured as `github-actions[bot]`

---

## 🛑 Skipped releases

If there are no new commits with Conventional Commit messages, the workflow will skip instead of failing.

