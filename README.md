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
If you don't know to use nano, check out this 2 minute video https://www.youtube.com/watch?v=EI9hszHrfq4
5. After you are done with your config, run the server using `node ./main.njs`, to exit the server just press `CTRL + C`
6. In your frontend (assuming janitorai) ensure you replace the "Proxy URL" with `http://localhost:8787/v1/chat/completions`. Remember, there's a difference between HTTPS and HTTP.<img width="320" height="508" alt="image" src="https://github.com/user-attachments/assets/dd47f9b6-aaca-4685-bf11-0ff81e4583f6" />
