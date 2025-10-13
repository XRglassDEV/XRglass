@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM ─────────────────────────────────────────────────────────────
REM XRglass: one-click deploy to GitHub (push) + Vercel (prod)
REM Usage (optional message):  double-click OR  deploy.bat "your message"
REM Prereqs (once): Git installed; Node/npm installed; "npm i -g vercel" and "vercel login"
REM ─────────────────────────────────────────────────────────────

cd /d "%~dp0"

REM 0) sanity checks
if not exist ".git" (
  echo [X] This folder is not a Git repository: %cd%
  echo     Make sure you cloned XRglass here.
  pause
  exit /b 1
)
if not exist "package.json" (
  echo [X] No package.json found in %cd%  (are you in the project root?)
  pause
  exit /b 1
)

REM 1) show current branch
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
echo [i] Current Git branch: %BRANCH%

REM 2) install vercel CLI if missing (first run only)
where vercel >nul 2>&1
if errorlevel 1 (
  echo [i] Installing Vercel CLI globally (first time only)...
  call npm i -g vercel
  if errorlevel 1 (
    echo [X] Failed to install Vercel CLI. Install Node/npm and rerun.
    pause
    exit /b 1
  )
)

REM 3) ensure you're logged in to Vercel (first run only)
vercel whoami >nul 2>&1
if errorlevel 1 (
  echo [i] You are not logged in to Vercel. A login window will open once.
  vercel login
  vercel whoami >nul 2>&1
  if errorlevel 1 (
    echo [X] Vercel login failed. Try "vercel login" in a terminal and rerun.
    pause
    exit /b 1
  )
)

REM 4) pull latest (fast-forward) to avoid diverging history
echo [i] Pulling latest from origin/%BRANCH% (fast-forward)...
git pull --ff-only

REM 5) stage & commit if there are changes
set MSG=%~1
if "%MSG%"=="" (
  set MSG=deploy: XRglass %DATE% %TIME%
)

git diff-index --quiet HEAD --
if errorlevel 1 (
  echo [i] Changes detected. Committing...
  git add -A
  git commit -m "%MSG%"
) else (
  echo [i] No local changes to commit.
)

REM 6) push
echo [i] Pushing to origin/%BRANCH% ...
git push origin %BRANCH%
if errorlevel 1 (
  echo [X] Push failed. Fix Git credentials/permissions and try again.
  pause
  exit /b 1
)

REM 7) trigger production deploy on Vercel
echo [i] Deploying to Vercel Production...
REM If your project is already linked, this will just build & deploy.
REM Add --token %VERCEL_TOKEN% if you prefer non-interactive auth.
vercel --prod --yes
if errorlevel 1 (
  echo [X] Vercel deploy failed. Ensure the project is linked here.
  echo     You can link it once via:  vercel link
  pause
  exit /b 1
)

echo.
echo ✅ Done! Pushed to GitHub and deployed to Vercel (Production).
echo    If Vercel printed a URL above, that is your live deployment.
echo.
pause
endlocal
