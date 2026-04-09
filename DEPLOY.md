# Deploying Hourly Blocks as a service

## 1. Build the frontend

```bash
cd /home/cristiano/src/hourly-blocks
npm run build
```

## 2. Install the systemd service

```bash
sudo cp /home/cristiano/src/hourly-blocks/hourly-blocks.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hourly-blocks.service
```

## 3. Check status

```bash
systemctl status hourly-blocks.service
journalctl -u hourly-blocks.service -f
```

## 4. Access from your tailnet

If Tailscale is running on the Pi, access the app from another device on the same tailnet at:

```text
http://<pi-tailnet-name>:3001
```

You can also find the Pi tailnet IP with:

```bash
tailscale ip -4
```

Then open:

```text
http://<tailnet-ip>:3001
```

## Optional: nicer Tailscale Serve URL

If you want, expose it via Tailscale Serve:

```bash
sudo tailscale serve --bg 3001
```

Then Tailscale will give you a nicer HTTPS URL on your tailnet.
