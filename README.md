# The VO Arcade — Console

A standalone client/referrer/invoice tracker for The VO Arcade that installs like a real app on your
laptop and phone, and can email you invoice reminders automatically through your own Gmail account.

---

## What you have

```
vo-arcade-app/
  index.html      the app
  app.js          all the app logic (React, no build step)
  manifest.json   makes it installable as an app
  sw.js           lets it work offline / installable
  icons/          app icons generated from your VO Arcade logo
  README.md       this file
```

## 1. Put it online (required for "install as app" to work)

Browsers only allow installable, offline-capable apps over **https**. The easiest free way:

1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**.
2. Drag the whole `vo-arcade-app` folder onto the page.
3. You'll get a live URL in about 10 seconds (something like `random-name-123.netlify.app`).
4. Optional: in Netlify's site settings you can rename the subdomain, or point your own domain at it later
   (e.g. `console.voarcade.com`) once your Wix domain situation is sorted.

No account is required for a single drop, though creating a free Netlify account lets you re-upload updates
to the same URL later. GitHub Pages or Vercel work just as well if you'd rather use one of those.

## 2. Install it as an app

**On your laptop (Chrome, Edge, or Brave):**
Open the Netlify URL → click the install icon (⊕ or a monitor-with-arrow icon) in the address bar → **Install**.
It now opens in its own window from your Start Menu / Applications folder, no browser tabs involved.

**On your phone (iPhone/Safari):**
Open the URL → **Share** → **Add to Home Screen**.

**On your phone (Android/Chrome):**
Open the URL → the browser will offer **Install app**, or use the **⋮** menu → **Install app**.

Either way you'll see the neon VO waveform icon on your home screen / dock, and it opens full-screen with
no browser bar — a proper app.

## 3. Connect Gmail for automatic reminders

Gmail requires every app to have its own free **OAuth Client ID** from Google — there's no way around this
step, but it only takes a few minutes and it's entirely under your own Google account.

1. Go to **[console.cloud.google.com](https://console.cloud.google.com/)** and create a new project
   (top-left project dropdown → **New Project** → name it e.g. "VO Arcade Console").
2. In the left menu: **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **APIs & Services → OAuth consent screen** → choose **External** → fill in the app name ("VO Arcade
   Console"), your email as support contact → save through the steps. Under **Test users**, add your own
   Gmail address (shaun@voarcade.com or whichever inbox you'll send from).
4. **APIs & Services → Credentials** → **Create Credentials → OAuth client ID** → Application type:
   **Web application**.
   - Under **Authorized JavaScript origins**, add your Netlify URL exactly, e.g. `https://your-site.netlify.app`
     (no trailing slash). If you later add a custom domain, add that origin too.
5. Click **Create** — copy the **Client ID** (ends in `.apps.googleusercontent.com`).
6. In the app, go to **Settings**, paste the Client ID, set your reminder email, and click **Connect Gmail**.
   The first time, Google will show a consent screen (because the app is unverified, it'll say "Google
   hasn't verified this app" — click **Advanced → Go to VO Arcade Console (unsafe)**; this is normal for
   an app only you use and never gets reviewed by Google unless you publish it publicly).

Once connected, click **Send test email** to confirm it works end to end.

## How the automation actually behaves

- Every invoice has a **reminder date**. Whenever the app is **open** — on your laptop, or a phone with it
  installed — and Gmail is connected, it checks for reminders due today or overdue and emails your
  reminder inbox automatically. No button-pressing needed.
- Each reminder only sends once per calendar day, so reopening the app repeatedly won't spam you.
- **Important honesty check:** this runs *inside the app*, so it can only send while the app is actually
  running somewhere (open on your laptop or phone). It cannot send emails while your laptop is fully shut
  and no device has the app open — no consumer app can do that without a server running permanently
  somewhere. In practice, if you leave it installed and open it once a day (or leave a tab open on a device
  that's usually on), it behaves as "fully automatic" for real-world purposes.
- If you'd like true closed-laptop automation later (emails firing even if nothing is open anywhere), that
  needs a small always-on backend — for example a scheduled cloud function checking a shared database. I'm
  happy to build that as a next step if this app-based version isn't automatic enough for how you work.

## Data & devices

Client, referrer, and invoice data is stored locally in the browser/app on each device (not synced between
your laptop and phone). If you want the same data everywhere, the next upgrade would be swapping local
storage for a small shared database (e.g. Google Sheets or Firebase) — worth doing once you're happy with
the workflow itself.

## Updating the app later

Whenever you want changes, drag an updated folder back onto Netlify Drop (or push to the same GitHub repo if
you're using GitHub Pages) — the same URL updates, and everyone with it installed gets the new version next
time they open it.
