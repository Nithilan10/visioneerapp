# Testing Backend Routes

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   # OR for development:
   npm run dev
   ```

## Testing Locally

### Quick Test Script

Run the test script:
```bash
chmod +x test-routes.sh
./test-routes.sh
```

### Manual Testing with curl

1. **Test products endpoint:**
   ```bash
   curl http://localhost:3000/api/products
   ```

2. **Test GLB list endpoint:**
   ```bash
   curl http://localhost:3000/api/models/glb/models
   ```

3. **Test GLB download endpoint:**
   ```bash
   curl http://localhost:3000/api/models/glb/models/chair.glb
   ```

## Testing from Another Machine (Your Friend)

### Step 1: Find Your Computer's IP Address

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```
Look for IPv4 Address (usually starts with 192.168.x.x or 10.0.x.x)

### Step 2: Make Sure Server is Accessible

1. **Check if server is running:**
   ```bash
   # On your machine
   curl http://localhost:3000/api/products
   ```

2. **Test from your friend's machine:**
   ```bash
   # Replace YOUR_IP with your actual IP address
   curl http://YOUR_IP:3000/api/products
   ```

### Step 3: Firewall Configuration

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Make sure Node.js or Terminal is allowed to accept incoming connections

**Windows:**
1. Windows Defender Firewall → Allow an app
2. Add Node.js or allow port 3000

**Linux:**
```bash
sudo ufw allow 3000/tcp
```

### Step 4: Test GLB Routes from Friend's Machine

```bash
# List GLB files
curl http://YOUR_IP:3000/api/models/glb/models

# Get GLB file URL
curl http://YOUR_IP:3000/api/models/glb/models/chair.glb/url

# Download GLB file
curl -O http://YOUR_IP:3000/api/models/glb/models/chair.glb
```

## Common Issues

### "Connection refused"
- Server is not running
- Wrong IP address
- Firewall blocking port 3000

### "Cannot find module '@azure/storage-blob'"
- Run `npm install` to install dependencies

### "Failed to connect to MongoDB"
- Make sure MongoDB is running: `brew services start mongodb-community` (Mac)

### Routes return 404
- Make sure server is running
- Check the route path is correct
- Verify the server is listening on the correct port

## Testing with Unity Mobile App

In your Unity app, use:
```csharp
string serverIP = "YOUR_IP_ADDRESS"; // e.g., "192.168.1.100"
string url = $"http://{serverIP}:3000/api/models/glb/models/chair.glb";
```

Make sure both devices are on the same network!

