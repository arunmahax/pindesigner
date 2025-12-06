# 🚀 React Integration Guide

This guide shows you how to integrate the Pinterest Pin Generator microservice with your React application.

## 📐 Layout Structure

The microservice creates Pinterest pins with this layout:
- **Top Image**: 50% of the height (450px)
- **Bottom Image**: 50% of the height (450px)  
- **Text Overlay**: Positioned in the center as a **foreground layer** over both images
- **Transparency**: The text background is semi-transparent, allowing you to see the images beneath

This creates a more visually appealing pin where the text appears to float over the images rather than separating them.

## Quick Start

### 1. Install Dependencies in Your React App

```bash
npm install axios
```

### 2. Import and Use the Component

```jsx
import PinterestPinGenerator from './components/PinterestPinGenerator';

function App() {
  return (
    <div className="App">
      <PinterestPinGenerator />
    </div>
  );
}
```

### 3. API Endpoints

The microservice provides these endpoints:

- **POST** `/api/create-pin` - Generate a Pinterest pin
- **GET** `/api/health` - Health check
- **GET** `/api/fonts` - Available fonts
- **GET** `/api/docs` - API documentation

### 4. Example API Call

```javascript
import axios from 'axios';

const generatePin = async (pinData) => {
  try {
    const response = await axios.post('http://localhost:3001/api/create-pin', {
      topImageUrl: 'https://example.com/top-image.jpg',
      bottomImageUrl: 'https://example.com/bottom-image.jpg',
      recipeTitle: 'Delicious Recipe',
      textOptions: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        textColor: '#ffffff',
        fontSize: 42,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        strokeColor: '#000000',
        strokeWidth: 2
      }
    }, {
      responseType: 'blob' // Important for image data
    });
    
    // Create downloadable URL
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
    
  } catch (error) {
    console.error('Error generating pin:', error);
    throw error;
  }
};
```

## Configuration Options

### Text Options
- `backgroundColor`: CSS color with transparency (e.g., 'rgba(0, 0, 0, 0.8)')
- `textColor`: Text color (e.g., '#ffffff')
- `fontSize`: Font size in pixels (20-60)
- `fontFamily`: Font family ('Arial', 'Helvetica', 'Georgia', etc.)
- `fontWeight`: Font weight ('normal', 'bold')
- `strokeColor`: Text outline color
- `strokeWidth`: Text outline width

### Image Requirements
- **Format**: JPG, PNG, WebP
- **Size**: Any size (will be automatically resized)
- **Access**: Must be publicly accessible URLs

## Error Handling

```javascript
try {
  const pin = await generatePin(pinData);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
    console.error('Invalid input:', error.response.data.error);
  } else if (error.response?.status === 500) {
    // Handle server errors
    console.error('Server error:', error.response.data.error);
  } else {
    // Handle network errors
    console.error('Network error:', error.message);
  }
}
```

## Production Deployment

### Environment Variables
Create a `.env.production` file:

```bash
REACT_APP_PIN_API_URL=https://your-microservice-domain.com/api
```

### Update API Calls
```javascript
const API_BASE = process.env.REACT_APP_PIN_API_URL || 'http://localhost:3001/api';

const response = await axios.post(`${API_BASE}/create-pin`, pinData);
```

## Performance Tips

1. **Image Optimization**: Use optimized images from your CDN
2. **Caching**: Implement caching for frequently generated pins
3. **Loading States**: Show loading indicators during generation
4. **Error Boundaries**: Wrap components in error boundaries

## Security Considerations

1. **CORS**: Configure CORS properly for production
2. **Rate Limiting**: Implement rate limiting on the microservice
3. **Input Validation**: Always validate user inputs
4. **Image Sources**: Validate image URLs to prevent abuse

## Testing

Test your integration:

1. Start the microservice: `npm run dev`
2. Test in browser: `http://localhost:3001`
3. Run API tests: `node test-api.js`

## Support

For issues or questions:
- Check the README.md for troubleshooting
- Review server logs for detailed error messages
- Test with the included HTML interface first
