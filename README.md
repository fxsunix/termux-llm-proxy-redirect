# LLM Redirector
---
<p>Redirect your calls through a middleman running locally on your <b>android</b> device, stripping unnecessary headers and ability to change sampler settings on your own.</p>

<p>An userscript version specifically for janitorai.com will come out later eventually.</p>

## Tutorial
---
1. Install Termux from their official site https://termux.dev/en/
2. When opened, type/copy this command and wait for the packages to download
```bash
pkg update && pkg install git nodejs
```
3. Copy and paste the command into the terminal:
```bash
git clone https://github.com/fxsunix/termux-llm-proxy-redirect/
cd ./src/
```
4. To change the provider, reasoning effort and sampler settings run `nano ./config.json` </br>
Provider links should just be their plain urls like: `https://composite.lucidity.sh, https://openrouter.ai, https://nanogpt.com`  </br>
If you don't know to use nano, check out this 2 minute video https://www.youtube.com/watch?v=EI9hszHrfq4
6. After you are done with your config, run the server using `node ./main.njs`, to exit the server just press `CTRL + C`
7. In your frontend (assuming janitorai) ensure you replace the "Proxy URL" with `http://localhost:8787/v1/chat/completions`. Remember, **there's a difference between HTTPS and HTTP.** </hr>
8. Enjoy cheaper and faster roleplaying!
<img alt="image" src="https://github.com/user-attachments/assets/dd47f9b6-aaca-4685-bf11-0ff81e4583f6" />

## Troubleshooting
---
1. "Unable to connect" Some browsers will block any kind of local port scanning, some will ask for a popup first.
2. "Model can't function without reasoning or something" Swap a model or set reasoning_effort to "minimal". 

### config.json Quick Guide  
```
{
  "provider_url": "https://composite.lucidity.sh",
  "reasoning_effort": "none",
  "overwrite_samplers": false,
  "sampler_settings": { ... }
}
```
  
### Main Options
  
- `provider_url`: The upstream OpenAI-Compatible API backend
- `reasoning_effort`: Controls thinking tokens. Set to "none" to force reasoning off, or "low" / "medium" if a model requires it.
- `overwrite_samplers`:
  - ``false`` (default): Only applies your values if the provider didn't send them.
  - ``true``: Forcefully overrides providers sample settings with your configured values.
  
### Sampler Settings
- Leave any option as null to ignore it and let JanitorAI / the provider handle it. Replace `null` with a number to use it.
- Since most of the samplers are already available on the frontend, here's a guide for just min_p:
- `min_p (0.0 – 1.0):` Dynamic cutoff based on top token confidence. 0.05 is great for cutting out gibberish.
