<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Pinterest Pin Generator Microservice

This is a Node.js microservice for generating Pinterest-style pins with image composition capabilities. The service combines two images in Pinterest pin format with customizable text overlays.

## Key Technologies
- **Express.js**: REST API framework
- **Sharp**: High-performance image processing
- **Canvas**: Text rendering and overlay creation
- **Axios**: HTTP client for image downloads

## Core Features
- Combine two Midjourney images in Pinterest pin format (600x900px)
- Customizable text overlay with fonts, colors, and styling
- REST API endpoints for easy React integration
- Image processing with automatic resizing and cropping

## Development Guidelines
- Use async/await for all asynchronous operations
- Validate all inputs in API endpoints
- Handle errors gracefully with proper HTTP status codes
- Optimize image processing for performance
- Follow RESTful API conventions

## Image Processing Notes
- Pinterest pin dimensions: 600x900 pixels
- Top image: 40% of height
- Text overlay: 20% of height (middle)
- Bottom image: 40% of height
- Use Sharp for image manipulation and Canvas for text rendering
