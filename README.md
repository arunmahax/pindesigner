# Pinterest Pin Generator

A high-performance Node.js microservice for generating Pinterest-style pins (9:16 aspect ratio) with customizable text overlays and tags.

## Features

- 🎨 Generate 1080x1920 pins (9:16 aspect ratio) perfect for Pinterest, Instagram Stories, Reels
- 📝 Customizable text overlays with multiple fonts
- 🏷️ Tag badges with rounded corners and custom styling
- ⚙️ Per-request style overrides for multiple account templates
- 🔤 Automatic title case conversion
- 🎯 14 font variants including Montserrat, Playfair Display, Bebas Neue, Yellowtail, and more

## Quick Start

### Installation

```bash
npm install
```

### Start Server

```bash
npm start
```

Server will run on `http://localhost:3001`

For development with auto-reload:
```bash
npm run dev
```

## API Endpoint

### POST `/api/create-pin`

Generate a Pinterest pin by combining two images with text overlay.

**Request Body:**

```json
{
  "topImageUrl": "https://example.com/image1.jpg",
  "bottomImageUrl": "https://example.com/image2.jpg",
  "recipeTitle": "delicious pasta recipe",
  "topTags": [],
  "styleOverrides": {
    "textOptions": {
      "fontSize": 80,
      "fontFamily": "Montserrat",
      "fontWeight": "800",
      "textColor": "#2E7D32",
      "backgroundColor": "rgba(200, 230, 201, 1)",
      "paddingTop": 48,
      "paddingBottom": 48,
      "paddingLeft": 80,
      "paddingRight": 80,
      "backgroundStrokeTopColor": "#2E7D32",
      "backgroundStrokeTopWidth": 8,
      "backgroundStrokeBottomColor": "#2E7D32",
      "backgroundStrokeBottomWidth": 8
    },
    "topTags": [
      {
        "text": "QUICK & EASY",
        "fontFamily": "Montserrat",
        "fontWeight": "700",
        "fontSize": 22,
        "textColor": "#FFFFFF",
        "backgroundColor": "#2E7D32",
        "paddingTop": 10,
        "paddingBottom": 10,
        "paddingLeft": 20,
        "paddingRight": 20,
        "borderRadius": 10,
        "position": { "x": 260, "y": 520 }
      }
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "imageUrl": "http://localhost:3001/uploads/pinterest-pins/Pin_Name_123456789.png",
  "imagePath": "uploads/pinterest-pins/Pin_Name_123456789.png"
}
```

## Configuration

Edit `config.json` to set default styling:

- Text overlay options (fontSize, colors, borders, padding)
- Default tags with positioning
- Pin dimensions (default: 1080x1920)

## Style Overrides

Send different `styleOverrides` in each request to create multiple templates for different Pinterest accounts. The overrides merge with config defaults.

See `style-overrides-example.json` for template examples.

## Available Fonts

- Montserrat (regular + bold)
- Playfair Display (regular + bold)
- Bebas Neue
- Yellowtail
- DM Serif Display
- Merriweather
- Lato (regular + bold)
- Open Sans (regular + bold)
- Roboto (regular + bold)

## Project Structure

```
├── server.js                      # Main Express server
├── config.json                    # Default styling configuration
├── style-overrides-example.json   # Example templates
├── fonts/                         # Custom font files
├── uploads/pinterest-pins/        # Generated pin images
└── package.json                   # Dependencies
```

## Dependencies

- **Express** - REST API framework
- **Sharp** - High-performance image processing
- **Canvas** - Text rendering with custom fonts
- **Axios** - HTTP client for downloading images

## License

ISC
