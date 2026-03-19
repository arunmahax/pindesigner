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

### 4. Set Environment Variables (Optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Set to `production` |

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

### Create Pin (Smart 3-Line Layout)
```
POST https://your-domain.com/api/create-pin
Content-Type: application/json

{
  "topImageUrl": "https://example.com/image1.jpg",
  "bottomImageUrl": "https://example.com/image2.jpg",
  "recipeTitle": "Easy Queso Chicken Enchiladas Bake",
  "smartLayoutLines": {
    "line1": "EASY QUESO",
    "line2": "CHICKEN ENCHILADAS",
    "line3": "CHEESY BAKE"
  },
  "textOptions": {
    "fontFamily": "Geom",
    "lineHeight": 1.05,
    "strokeColor": "#040000",
    "strokeWidth": 8,
    "textColor": "#FFF3E0",
    "backgroundColor": "rgba(29, 233, 182, 0.55)",
    "backgroundStrokeTopColor": "#B2FF59",
    "backgroundStrokeTopWidth": 12,
    "backgroundStrokeBottomColor": "#B2FF59",
    "backgroundStrokeBottomWidth": 12
  },
  "smartLayoutOptions": {
    "line1FontSize": 80,
    "line2FontSize": 150,
    "line3FontSize": 90,
    "line1FontWeight": "700",
    "line2FontWeight": "900",
    "line3FontWeight": "700"
  }
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
  "smartLayoutLines": {
    "line1": "{{ $json.line1 }}",
    "line2": "{{ $json.line2 }}",
    "line3": "{{ $json.line3 }}"
  },
  "textOptions": {
    "fontFamily": "Geom",
    "strokeColor": "#040000",
    "strokeWidth": 8,
    "textColor": "#FFF3E0",
    "backgroundColor": "rgba(29, 233, 182, 0.55)",
    "backgroundStrokeTopColor": "#B2FF59",
    "backgroundStrokeTopWidth": 12,
    "backgroundStrokeBottomColor": "#B2FF59",
    "backgroundStrokeBottomWidth": 12
  },
  "smartLayoutOptions": {
    "line1FontSize": 80,
    "line2FontSize": 150,
    "line3FontSize": 90
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
  "imageUrl": "https://your-domain.com/uploads/pinterest-pins/Easy_Queso_Chicken_1234567890.png",
  "filename": "Easy_Queso_Chicken_1234567890.png",
  "dimensions": { "width": 1000, "height": 2000 },
  "title": {
    "original": "Easy Queso Chicken Enchiladas Bake",
    "used": "Easy Queso Chicken Enchiladas Bake"
  },
  "smartLayout": {
    "enabled": true,
    "line1": "EASY QUESO",
    "line2": "CHICKEN ENCHILADAS",
    "line3": "CHEESY BAKE"
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
    "recipeTitle": "Healthy Bowl Recipe",
    "smartLayoutLines": {
      "line1": "DELICIOUS",
      "line2": "HEALTHY BOWL",
      "line3": "RECIPE"
    }
  }'
```
