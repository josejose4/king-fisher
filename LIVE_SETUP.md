# King Fisher — Live Setup Guide

## What you need
- A [WillyWeather API key](https://www.willyweather.com.au/info/api.html)
- [Node.js v22+](https://nodejs.org) (LTS)
- A free [Cloudflare account](https://cloudflare.com)

---

## 1. Install Node v22 via nvm

WillyWeather needs Node 22+. The cleanest way is nvm — it avoids permission errors and lets you run multiple Node versions.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Close and reopen your terminal, then:

```bash
nvm install 22
nvm use 22
node -v   # should say v22.x.x
```

---

## 2. Install Wrangler

```bash
npm i -g wrangler
```

---

## 3. Deploy the proxy worker

The app can't call WillyWeather directly from the browser (CORS + key security). The proxy sits in between, holds your secret key, and forwards requests.

```bash
wrangler deploy js/king-fisher.js --name kf-proxy --compatibility-date 2024-01-01
```

This will open a browser to log into Cloudflare. Once deployed your proxy URL will be:

```
https://kf-proxy.YOUR-SUBDOMAIN.workers.dev
```

---

## 4. Add your WillyWeather key as a secret

**Important:** run the command exactly as below — `WW_KEY` is the secret *name*, not your actual key. Paste the key only when prompted.

```bash
wrangler secret put WW_KEY --name kf-proxy
# Enter a secret value: [paste key here — it won't show on screen]
```

Never put your actual key in the command itself or it'll end up in your shell history.

---

## 5. Find your WillyWeather location ID

WillyWeather uses numeric IDs, not place names. To find Bondi Beach (or any location), call the search endpoint in your browser:

```
https://api.willyweather.com.au/v2/YOURKEY/search.json?query=Bondi+Beach&limit=5
```

Bondi Beach ID: **4988**

---

## 6. Configure the app

1. Open the app → click **⚙ Mission Config**
2. Switch to **LIVE (PROXY)**
3. Paste your proxy URL into **Proxy Base URL**
4. Select **Custom ID…** from the Location dropdown and enter `4988`
5. Click **Apply & Refresh**

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `404` | Wrong location ID | Use the search endpoint above to find the correct ID |
| `Live fetch failed` | Proxy URL wrong or key not set | Double-check the URL and re-run `wrangler secret put WW_KEY` |
| Falls back to demo | Any of the above | Check the error banner — it says exactly what failed |
