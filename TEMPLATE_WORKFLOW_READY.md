# ✅ Template-Based Workflow Implementation Complete

## What's Been Implemented

Your Pinterest Pin Generator now uses your Canva Brand Template (ID: `EAG6uZTrvZU`) with the following workflow:

1. **Upload Images** - Downloads and uploads your recipe images to Canva as assets
2. **Duplicate Template** - Creates a copy of your brand template preserving all styling
3. **Replace Content** - Finds and replaces text and images in the template
4. **Export & Download** - Exports the final pin and saves it locally

## Key Features

✅ **Preserves All Styling** - Fonts, colors, sizes, positions stay exactly as designed
✅ **Dynamic Content** - Replaces placeholder text and images with your recipe data
✅ **No Manual Merging** - Uses template directly, no need to merge images separately
✅ **Automatic Workflow** - Complete process from images to final pin in one API call

## Configuration

Your `.env` file now includes:
```
CANVA_BRAND_TEMPLATE_ID=EAG6uZTrvZU
CANVA_ACCESS_TOKEN=<your_token>
```

## How to Test

### Option 1: Browser Test (Recommended - bypasses Windows HTTP blocking)

1. Open `test-canva.html` in your browser (double-click the file)
2. Click "Generate Pinterest Pin with Canva"
3. Wait 30-60 seconds for the complete workflow to run
4. View the generated pin with your template styling

### Option 2: API Test with Postman/Thunder Client

```
POST http://localhost:3001/api/create-pin-with-canva
Content-Type: application/json

{
  "topImageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
  "bottomImageUrl": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  "recipeTitle": "CREAMY TOMATO PASTA"
}
```

Note: `accessToken` and `templateId` are optional in the request body - they'll use environment variables if not provided.

## New API Endpoint Signature

```javascript
POST /api/create-pin-with-canva

Request Body:
{
  topImageUrl: string,        // Required: URL to first recipe image
  bottomImageUrl: string,     // Required: URL to second recipe image  
  recipeTitle: string,        // Required: Recipe title for text overlay
  accessToken?: string,       // Optional: Falls back to CANVA_ACCESS_TOKEN
  templateId?: string         // Optional: Falls back to CANVA_BRAND_TEMPLATE_ID
}

Response:
{
  success: true,
  imageUrl: string,           // URL to generated pin
  filename: string,           // Filename of generated pin
  method: "Canva Connect API (Brand Template)"
}
```

## Workflow Details

### Step 1: Upload Assets
- Downloads both recipe images
- Saves them temporarily
- Uploads to Canva (returns asset IDs)

### Step 2: Duplicate Template  
- Clones your brand template (EAG6uZTrvZU)
- Creates a new design with all styling preserved

### Step 3: Analyze Structure
- Retrieves all elements from the duplicated design
- Identifies text elements (for title)
- Identifies image elements (for photos)

### Step 4: Replace Content
- Updates first text element with recipe title
- Updates image elements with uploaded food photos
- **Styling is preserved** - only content changes

### Step 5: Export
- Exports design as high-quality PNG
- Downloads to `uploads/pinterest-pins/` directory
- Returns URL for access

## Implementation Files

### `canvaService.js` - New Functions
- `duplicateDesign(templateId, accessToken, title)` - Clone template
- `getDesignElements(designId, accessToken)` - Get all elements
- `updateTextElement(designId, elementId, text, accessToken)` - Replace text
- `updateImageElement(designId, elementId, assetId, accessToken)` - Replace image
- `createPinterestPin(templateId, imagePaths, title, accessToken, outputPath)` - Complete workflow

### `server.js` - Updated Endpoint
- Modified `/api/create-pin-with-canva` to use template workflow
- No longer merges images manually
- Uses environment variables for token and template ID

## Next Steps

### Immediate
1. **Test the workflow** using `test-canva.html`
2. **Verify styling** - Check that your template design is preserved
3. **Check element replacement** - Ensure title and images are replaced correctly

### When Data Autofill API is Approved
Once Canva approves your Data Autofill API access, we can simplify this to a single API call:
```javascript
// Future simplified version with Data Autofill API
await canva.autofill(templateId, {
  "title": "CREAMY TOMATO PASTA",
  "image1": topAssetId,
  "image2": bottomAssetId
})
```

This will be much simpler and faster, but the current workflow gives you full control while waiting for approval.

## Template Structure Assumptions

The workflow makes these assumptions about your template (EAG6uZTrvZU):
- Has at least one **text element** (for recipe title)
- Has at least two **image elements** (for food photos)
- Elements are on the first page of the design

If your template structure is different, let me know and we can adjust the element finding logic!

## Troubleshooting

### "Template has no elements to modify"
- Your template might be empty or structured differently
- Check template in Canva to ensure it has text and image placeholders

### "Failed to duplicate design"
- Access token may be expired (refresh every 4 hours)
- Template ID might be incorrect
- Scopes might be missing (need: design:content:read, design:content:write)

### "Failed to update text/image element"
- Element IDs change when template is duplicated
- Script finds elements dynamically, so this should work automatically

## Token Management

Your access token expires every 4 hours. To refresh:
1. Go to http://localhost:3001/api/canva/auth-url
2. Follow OAuth flow again
3. New token will be logged in server console
4. Update `.env` with new token

Or use the refresh token (implementation ready if needed).

---

**Status**: ✅ Ready for testing
**Server**: Running on http://localhost:3001
**Test File**: `test-canva.html` (open in browser)
