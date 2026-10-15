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
4. To change the provider, reasoning effort and sampler settings run `nano ./config.json`
Provider links should just be their plain urls like: `https://composite.lucidity.sh, https://openrouter.ai, https://nanogpt.com`
If you don't know to use nano, check out this 2 minute video https://www.youtube.com/watch?v=EI9hszHrfq4
6. After you are done with your config, run the server using `node ./main.njs`, to exit the server just press `CTRL + C`
7. In your frontend (assuming janitorai) ensure you replace the "Proxy URL" with `http://localhost:8787/v1/chat/completions`. Remember, **there's a difference between HTTPS and HTTP.** </hr>
8. Enjoy cheaper and faster roleplaying!
<img alt="image" src="https://github.com/user-attachments/assets/dd47f9b6-aaca-4685-bf11-0ff81e4583f6" />

## Troubleshooting
---
1. "Unable to connect" Some browsers will block any kind of local port scanning, some will ask for a popup first.
2. "Model can't function without reasoning or something" Swap a model or set reasoning_effort to "minimal". 
