# LLM Redirector

<p>Redirect your calls through a middleman running locally on your <b>android</b> device, stripping unnecessary headers and ability to change sampler settings on your own.</p>

<p>An userscript version specifically for janitorai.com will come out later eventually.</p>

# Tutorial
1. Install Termux from their official site (The Google Play Version could probably work but don't take my words for it) https://termux.dev/en/
2. When opened, type in 'pkg install git node' and wait for the packages to download
3. Copy and paste the command into the terminal:
```bash
git clone https://github.com/fxsunix/termux-llm-proxy-redirect/
cd ./src/
```
4. To change the provider, reasoning effort and sampler settings run `nano ./config.json`
