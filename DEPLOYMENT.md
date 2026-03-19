# Pinterest Pin Generator - Coolify Deployment Guide

## Quick Start

### 1. Push to Git Repository

First, push your code to a Git repository (GitHub, GitLab, or any Git provider that Coolify supports).

```bash
git init
git add .
git commit -m "Initial commit for Coolify deployment"
git remote add origin https://github.com/YOUR_USERNAME/pinterest-pin-generator.git
git push -u origin main
```

### 2. Create New Application in Coolify

1. Log into your Coolify dashboard
2. Go to **Projects** → Select or create a project
3. Click **+ New** → **Application**
4. Choose **Docker** as the build pack
5. Connect your Git repository

### 3. Configure Build Settings

In Coolify application settings:

- **Build Pack**: Docker
- **Dockerfile Location**: `Dockerfile` (root of repo)
- **Port**: `3001`

### 4. Set Environment Variables

Add these environment variables in Coolify:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key for smart titles |
| `NODE_ENV` | No | Set to `production` |

*Required for AI-powered title shortening and smart layout features

Get your Gemini API key: https://aistudio.google.com/app/apikey

### 5. Configure Domain (Optional)

In Coolify:
1. Go to **Domains** tab
2. Add your domain: `pinterest-api.yourdomain.com`
3. Enable HTTPS (recommended)

### 6. Deploy

Click **Deploy** and wait for the build to complete.

---

## API Endpoints

Once deployed, your service will be available at your configured domain or IP.

### Health Check
```
GET https://your-domain.com/api/health
```

### Create Pin
```
POST https://your-domain.com/api/create-pin
Content-Type: application/json

{
  "topImageUrl": "https://example.com/image1.jpg",
  "bottomImageUrl": "https://example.com/image2.jpg",
  "recipeTitle": "Crispy Garlic Butter Chicken",
  "smartLayout": true,
  "autoGenerateTags": true
}
```

### Get Available Fonts
```
GET https://your-domain.com/api/fonts
```

### API Documentation
```
GET https://your-domain.com/api/docs
```

---

## n8n Integration

### HTTP Request Node Configuration

1. Add an **HTTP Request** node in n8n
2. Configure:
   - **Method**: POST
   - **URL**: `https://your-domain.com/api/create-pin`
   - **Authentication**: None (or add API key if you implement it)
   - **Body Content Type**: JSON
   - **JSON Body**:

```json
{
  "topImageUrl": "{{ $json.topImage }}",
  "bottomImageUrl": "{{ $json.bottomImage }}",
  "recipeTitle": "{{ $json.title }}",
  "smartLayout": true,
  "autoGenerateTags": true,
  "textOptions": {
    "fontFamily": "Montserrat",
    "fontSize": 120,
    "textColor": "#FFFFFF",
    "backgroundColor": "rgba(0, 0, 0, 0.7)"
  }
}
```

### Example n8n Workflow

```
[Trigger] → [Get Images] → [HTTP Request to Pin Generator] → [Upload to Pinterest/Storage]
```

### Response Format

The API returns:
```json
{
  "success": true,
  "imageUrl": "https://your-domain.com/uploads/pinterest-pins/Crispy_Garlic_Butter_Chicken_1234567890.png",
  "filename": "Crispy_Garlic_Butter_Chicken_1234567890.png",
  "dimensions": { "width": 1000, "height": 2000 },
  "title": {
    "original": "Crispy Garlic Butter Chicken",
    "used": "Crispy Garlic Butter Chicken",
    "wasShortened": false
  },
  "smartLayout": {
    "enabled": true,
    "line1": "CRISPY",
    "line2": "GARLIC BUTTER",
    "line3": "CHICKEN"
  },
  "tags": {
    "generated": ["Easy Dinner", "High Protein"],
    "count": 2
  }
}
```

---

## Persistent Storage (Important!)

Generated pins are saved to `/app/uploads/pinterest-pins/`. For persistence across deployments:

### Option 1: Coolify Volumes

In Coolify application settings → **Storages**:
- **Container Path**: `/app/uploads`
- **Host Path**: `/data/pinterest-pins` (or your preferred path)

### Option 2: External Storage

For production, consider uploading generated images to:
- AWS S3
- Cloudflare R2
- DigitalOcean Spaces

---

## Troubleshooting

### Build Fails

If the build fails due to canvas dependencies:
1. Check Coolify logs for specific errors
2. Ensure you're using the provided Dockerfile (it includes all required system libraries)

### Memory Issues

The canvas library can be memory-intensive. If you experience issues:
1. Increase container memory in Coolify (recommended: 1GB+)
2. Set memory limits in Coolify: **Resources** → **Memory**

### CORS Issues with n8n

CORS is enabled by default for all origins. If you need to restrict it, modify `server.js`:

```javascript
app.use(cors({
  origin: ['https://your-n8n-instance.com']
}));
```

### Connection Timeout

For large images, increase timeout in n8n HTTP Request node:
- **Timeout**: 60000 (60 seconds)

---

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 0.5 cores | 1 core |
| Memory | 512 MB | 1 GB |
| Disk | 1 GB | 5 GB (for generated images) |

---

## Security Recommendations

1. **Use HTTPS** - Enable SSL in Coolify
2. **Add API Authentication** - Consider adding API key validation
3. **Rate Limiting** - Add express-rate-limit for production
4. **Input Validation** - The service validates URLs, but additional validation is recommended

---

## Quick Test

After deployment, test with curl:

```bash
curl -X POST https://your-domain.com/api/create-pin \
  -H "Content-Type: application/json" \
  -d '{
    "topImageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    "bottomImageUrl": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    "recipeTitle": "Delicious Healthy Bowl Recipe"
  }'
```
