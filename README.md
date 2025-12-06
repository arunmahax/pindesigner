# Pinterest Pin Generator Microservice

A powerful Node.js microservice that creates Pinterest-style pins by combining two images with customizable text overlays. Perfect for food bloggers, recipe creators, and content creators who want to generate engaging Pinterest pins automatically.

## Features

- 🖼️ **Image Composition**: Combines two images in Pinterest pin format (600x900px)
- 📐 **50/50 Layout**: Top image (50%) and bottom image (50%) for balanced composition
- 🎨 **Foreground Text Overlay**: Transparent text layer positioned over images, not between them
- 🎯 **Perfect Centering**: Text automatically centered vertically over both images
- 🚀 **Easy Integration**: RESTful API designed for seamless React app integration
- ⚡ **High Performance**: Uses Sharp for fast image processing
- � **Pinterest Optimized**: Perfect dimensions and layout for Pinterest pins
- 🔧 **Flexible Styling**: Support for text stroke, custom fonts, colors, and transparency levels

## Quick Start

### Installation

```bash
# Clone or download the project
cd pinterest-pin-generator

# Install dependencies
npm install

# Start the development server
npm run dev
```

The service will be available at `http://localhost:3001`

### Basic Usage

Send a POST request to `/api/create-pin` with the following payload:

```json
{
  "topImageUrl": "https://your-top-image-url.jpg",
  "bottomImageUrl": "https://your-bottom-image-url.jpg",
  "recipeTitle": "Delicious Homemade Pizza",
  "showTextOverlay": true,
  "showTextBackground": true,
  "textOptions": {
    "backgroundColor": "rgba(0, 0, 0, 0.7)",
    "textColor": "#ffffff",
    "fontSize": 60,
    "fontFamily": "Arial",
    "fontWeight": "bold",
    "strokeColor": "#ff0000",
    "strokeWidth": 4
  }
}
```

### Usage Examples

**1. Traditional text with background:**
```json
{
  "topImageUrl": "https://example.com/food1.jpg",
  "bottomImageUrl": "https://example.com/food2.jpg", 
  "recipeTitle": "Amazing Recipe",
  "showTextOverlay": true,
  "showTextBackground": true,
  "textOptions": {
    "backgroundColor": "rgba(0, 0, 0, 0.8)",
    "textColor": "#ffffff"
  }
}
```

**2. Modern text overlay (no background):**
```json
{
  "topImageUrl": "https://example.com/food1.jpg",
  "bottomImageUrl": "https://example.com/food2.jpg",
  "recipeTitle": "Modern Recipe Design", 
  "showTextOverlay": true,
  "showTextBackground": false,
  "textOptions": {
    "textColor": "#ffffff",
    "strokeColor": "#000000",
    "strokeWidth": 4
  }
}
```

**3. Image-only pin (no text):**
```json
{
  "topImageUrl": "https://example.com/food1.jpg",
  "bottomImageUrl": "https://example.com/food2.jpg",
  "showTextOverlay": false
}
```

**4. Large font with colorful stroke (no background):**
```json
{
  "topImageUrl": "https://example.com/food1.jpg",
  "bottomImageUrl": "https://example.com/food2.jpg",
  "recipeTitle": "BOLD RECIPE",
  "showTextOverlay": true,
  "showTextBackground": false,
  "textOptions": {
    "fontSize": 120,
    "textColor": "#ffff00",
    "strokeColor": "#ff0000",
    "strokeWidth": 6
  }
}
```

## API Endpoints

### POST `/api/create-pin`
Create a Pinterest-style pin with two images and text overlay.

**Request Body:**
- `topImageUrl` (string, required): URL of the top image
- `bottomImageUrl` (string, required): URL of the bottom image  
- `recipeTitle` (string, optional): Text to display in the overlay (required if showTextOverlay is true)
- `showTextOverlay` (boolean, optional): Whether to show text overlay (default: true)
- `showTextBackground` (boolean, optional): Whether to show text background layer (default: true)
- `textOptions` (object, optional): Text styling options

**Text Options:**
- `backgroundColor`: Background color of text overlay (default: "rgba(0, 0, 0, 0.7)")
- `textColor`: Color of the text (default: "#ffffff")
- `fontSize`: Font size in pixels (default: 36, max: 120)
- `fontFamily`: Font family (default: "Arial")
- `fontWeight`: Font weight (default: "bold")
- `strokeColor`: Text stroke color (default: "#000000") - now customizable!
- `strokeWidth`: Text stroke width in pixels (default: 2, max: 10)

**Text Overlay Control:**
- Set `showTextOverlay: false` to create pins with just combined images (no text)
- Set `showTextBackground: false` to display text directly over images without background layer
- When `showTextBackground: false`, use `strokeColor` and `strokeWidth` for text readability

**Response:** PNG image file

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "service": "Pinterest Pin Generator",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/fonts`
Get list of available fonts.

**Response:**
```json
{
  "fonts": ["Arial", "Helvetica", "Times New Roman", "Georgia", ...]
}
```

### GET `/api/docs`
Get complete API documentation.

## React Integration

Here's how to integrate the service with your React app:

```jsx
const generatePin = async (topImageUrl, bottomImageUrl, recipeTitle, options = {}) => {
  const {
    showTextOverlay = true,
    showTextBackground = true,
    textOptions = {}
  } = options;

  const response = await fetch('http://localhost:3001/api/create-pin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topImageUrl,
      bottomImageUrl,
      recipeTitle,
      showTextOverlay,
      showTextBackground,
      textOptions
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate pin');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// Examples:
// Traditional with background
const pinUrl1 = await generatePin(img1, img2, "Recipe Title", {
  showTextBackground: true,
  textOptions: { backgroundColor: "rgba(0,0,0,0.8)" }
});

// Modern without background  
const pinUrl2 = await generatePin(img1, img2, "Recipe Title", {
  showTextBackground: false,
  textOptions: { strokeWidth: 4 }
});

// Image only
const pinUrl3 = await generatePin(img1, img2, "", {
  showTextOverlay: false
});
```

See `client-example.jsx` for a complete React component example.

## Development

### Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with auto-reload
- `npm test`: Run API tests

### Testing

Run the included test suite:

```bash
npm test
```

This will test all endpoints and generate a sample pin as `test-pin.png`.

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001
```

## Image Processing Details

- **Pinterest Pin Dimensions**: 600x900 pixels (2:3 aspect ratio)
- **Layout**:
  - Top image: 40% of total height
  - Text overlay: 20% of total height (center)
  - Bottom image: 40% of total height
- **Image Processing**: Automatic cropping and resizing to fit dimensions
- **Text Rendering**: High-quality Canvas-based text with anti-aliasing

## Dependencies

- **express**: Web framework
- **sharp**: High-performance image processing
- **canvas**: Text rendering and graphics
- **axios**: HTTP client for image downloads
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Performance Tips

1. Use appropriately sized source images (recommended: at least 600px width)
2. Optimize image URLs for faster downloads
3. Consider implementing image caching for frequently used images
4. Use the service behind a reverse proxy for production

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Canvas installation issues**: Make sure you have the required system dependencies for node-canvas
2. **Image download failures**: Ensure image URLs are accessible and properly formatted
3. **Memory issues**: For high-volume usage, consider implementing image size limits

### System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository or contact the development team.
