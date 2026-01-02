# Nginx Configuration for LAN Access

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `localhost` | Server name(s) for nginx. Use space-separated values for multiple hosts. |

## Usage

### Local Development (default)
```bash
# Uses localhost only
docker compose up -d
```

### LAN Access (mobile/tablet testing)
```bash
# Get your LAN IP first
ipconfig getifaddr en0  # macOS
ip addr show | grep "inet 192"  # Linux

# Start with LAN access
HOST="localhost 192.168.x.x" docker compose up -d
```

### Add to .env file (persistent)
```bash
# .env
HOST=localhost 192.168.3.24
```

## Security

The nginx configuration includes a **default server block** that blocks requests with invalid `Host` headers:

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 444;  # Close connection without response
}
```

This prevents host header attacks. Only hosts listed in `HOST` environment variable are allowed.

## Testing

```bash
# Test legitimate access
curl http://localhost/api/v1/health
# Expected: 200 OK

curl http://192.168.x.x/api/v1/health
# Expected: 200 OK (if HOST includes this IP)

# Test security (should fail)
curl -H "Host: evil.com" http://192.168.x.x/
# Expected: Connection closed (empty reply)
```

## Files

- `nginx.conf.template` - Template with `${HOST}` variable
- `nginx.conf` - Generated at container startup via envsubst
