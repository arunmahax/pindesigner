const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

/**
 * Canva Design API Service
 * Handles design imports, autofill, and exports
 */

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

/**
 * Poll async job until completion
 * @param {string} jobId - Job ID to poll
 * @param {string} endpoint - API endpoint to poll
 * @param {string} accessToken - Canva access token
 * @returns {Promise<Object>} - Completed job result
 */
async function pollJob(jobId, endpoint, accessToken) {
  const maxAttempts = 60; // Max 5 minutes (5 second intervals)
  let attempt = 0;
  let delay = 2000; // Start with 2 second delay
  
  while (attempt < maxAttempts) {
    try {
      const response = await axios.get(
        `${CANVA_API_BASE}${endpoint}/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const job = response.data.job;
      
      if (job.status === 'success') {
        return job;
      } else if (job.status === 'failed') {
        throw new Error(`Job failed: ${job.error || 'Unknown error'}`);
      }
      
      // Job still in progress, wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff (max 10 seconds)
      delay = Math.min(delay * 1.5, 10000);
      attempt++;
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Job not found');
      }
      throw error;
    }
  }
  
  throw new Error('Job polling timeout - job did not complete in time');
}

/**
 * Upload asset to Canva
 * @param {string} filePath - Path to local image file
 * @param {string} accessToken - Canva access token
 * @returns {Promise<Object>} - { asset_id }
 */
async function uploadAsset(filePath, accessToken) {
  try {
    // Ensure filename has .png extension
    const filename = path.basename(filePath);
    const assetName = filename.endsWith('.png') ? filename : `${filename}.png`;
    
    console.log(`📤 Uploading asset directly: ${assetName}`);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Metadata as JSON string in header
    const metadata = JSON.stringify({
      name_base64: Buffer.from(assetName).toString('base64'),
      tags: ['pinterest-pin']
    });
    
    // Try direct upload with metadata in header
    const uploadResponse = await axios.post(
      `${CANVA_API_BASE}/asset-uploads`,
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Upload-Metadata': metadata
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    
    console.log('✅ Upload response:', uploadResponse.data);
    
    // Check if it's an async job
    if (uploadResponse.data?.job?.id && uploadResponse.data?.job?.status === 'in_progress') {
      console.log('⏳ Upload is async, polling for completion...');
      const completedJob = await pollJob(uploadResponse.data.job.id, '/asset-uploads', accessToken);
      const asset_id = completedJob.asset?.id;
      
      if (!asset_id) {
        throw new Error('No asset ID in completed job: ' + JSON.stringify(completedJob));
      }
      
      console.log(`✅ Asset uploaded successfully: ${asset_id}`);
      return { asset_id };
    }
    
    // Immediate response with asset ID
    const asset_id = uploadResponse.data?.job?.asset_id || uploadResponse.data?.asset?.id;
    
    if (!asset_id) {
      throw new Error('No asset ID in response: ' + JSON.stringify(uploadResponse.data));
    }
    
    console.log(`✅ Asset uploaded successfully: ${asset_id}`);
    return { asset_id };
    
  } catch (error) {
    console.error('❌ Canva API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    throw new Error(`Failed to upload asset: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Create a new design (since we can't duplicate brand templates without Data Autofill)
 * @param {string} templateId - Brand Template ID (unused for now)
 * @param {string} accessToken - Canva access token
 * @param {string} title - Title for the new design
 * @param {string} assetId - Asset ID to create design from
 * @returns {Promise<Object>} - { design_id }
 */
async function duplicateDesign(templateId, accessToken, title, assetId) {
  try {
    console.log(`🖼️ Creating new design from asset: ${assetId}`);
    
    // Create a design from the first uploaded image
    const response = await axios.post(
      `${CANVA_API_BASE}/designs`,
      {
        asset_id: assetId,
        title: title
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const designId = response.data.design?.id;
    
    if (!designId) {
      throw new Error('No design ID in response: ' + JSON.stringify(response.data));
    }
    
    console.log(`✅ New design created: ${designId}`);
    console.log(`⚠️ Note: Using basic design. For template styling, Data Autofill API approval needed.`);
    return { design_id: designId };
    
  } catch (error) {
    console.error('❌ Failed to create design:', error.response?.data);
    throw new Error(`Failed to create design: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get design elements (pages and their content)
 * @param {string} designId - Design ID
 * @param {string} accessToken - Canva access token
 * @returns {Promise<Object>} - Design with pages and elements
 */
async function getDesignElements(designId, accessToken) {
  try {
    const response = await axios.get(
      `${CANVA_API_BASE}/designs/${designId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log(`✅ Retrieved design elements for: ${designId}`);
    return response.data.design;
    
  } catch (error) {
    console.error('❌ Failed to get design elements:', error.response?.data);
    throw new Error(`Failed to get design elements: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Update text element content
 * @param {string} designId - Design ID
 * @param {string} elementId - Element ID
 * @param {string} text - New text content
 * @param {string} accessToken - Canva access token
 * @returns {Promise<void>}
 */
async function updateTextElement(designId, elementId, text, accessToken) {
  try {
    await axios.patch(
      `${CANVA_API_BASE}/designs/${designId}/elements/${elementId}`,
      {
        text: {
          content: text
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Updated text element: ${elementId}`);
    
  } catch (error) {
    console.error('❌ Failed to update text element:', error.response?.data);
    throw new Error(`Failed to update text element: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Update image element with new asset
 * @param {string} designId - Design ID
 * @param {string} elementId - Element ID
 * @param {string} assetId - New asset ID
 * @param {string} accessToken - Canva access token
 * @returns {Promise<void>}
 */
async function updateImageElement(designId, elementId, assetId, accessToken) {
  try {
    await axios.patch(
      `${CANVA_API_BASE}/designs/${designId}/elements/${elementId}`,
      {
        image: {
          asset_id: assetId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Updated image element: ${elementId} with asset: ${assetId}`);
    
  } catch (error) {
    console.error('❌ Failed to update image element:', error.response?.data);
    throw new Error(`Failed to update image element: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Create autofill job (add text to design using template)
 * @param {string} designId - Design ID
 * @param {string} accessToken - Canva access token
 * @param {Object} textData - Text content to add
 * @returns {Promise<Object>} - { design_id }
 */
async function autofillDesign(designId, accessToken, textData) {
  try {
    // Create autofill job
    const createResponse = await axios.post(
      `${CANVA_API_BASE}/autofills`,
      {
        design_id: designId,
        data: textData
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const jobId = createResponse.data.job.id;
    console.log(`✏️ Autofill job created: ${jobId}`);
    
    // Poll for completion
    const completedJob = await pollJob(jobId, '/autofills', accessToken);
    
    return {
      design_id: completedJob.design.id
    };
    
  } catch (error) {
    throw new Error(`Failed to autofill design: ${error.message}`);
  }
}

/**
 * Export design as PNG
 * @param {string} designId - Design ID
 * @param {string} accessToken - Canva access token
 * @param {Object} options - Export options
 * @returns {Promise<Object>} - { url } - URL to download exported image
 */
async function exportDesign(designId, accessToken, options = {}) {
  try {
    // Create export job
    const createResponse = await axios.post(
      `${CANVA_API_BASE}/exports`,
      {
        design_id: designId,
        format: {
          type: 'png',
          quality: options.quality || 'high'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const jobId = createResponse.data.job.id;
    console.log(`📥 Export job created: ${jobId}`);
    
    // Poll for completion
    const completedJob = await pollJob(jobId, '/exports', accessToken);
    
    console.log('✅ Export job completed:', JSON.stringify(completedJob, null, 2));
    
    // URL is in urls array (first element)
    const url = completedJob.urls?.[0] || 
                completedJob.export?.url || 
                completedJob.result?.url;
    
    if (!url) {
      throw new Error('No export URL in completed job: ' + JSON.stringify(completedJob));
    }
    
    return { url };
    
  } catch (error) {
    console.error('❌ Export failed:', error.response?.data);
    throw new Error(`Failed to export design: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Download exported design to local file
 * @param {string} exportUrl - URL from export job
 * @param {string} outputPath - Local path to save file
 * @returns {Promise<void>}
 */
async function downloadExport(exportUrl, outputPath) {
  try {
    const response = await axios.get(exportUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download export: ${error.message}`);
  }
}

/**
 * Create Pinterest pin using brand template workflow
 * @param {string} templateId - Brand Template ID
 * @param {Array<string>} imagePaths - Paths to images to insert
 * @param {string} title - Recipe title
 * @param {string} accessToken - Canva access token
 * @param {string} outputPath - Path to save final image
 * @returns {Promise<string>} - Path to saved image
 */
async function createPinterestPin(templateId, imagePaths, title, accessToken, outputPath) {
  console.log('🎨 Starting Canva Pinterest pin creation with brand template...');
  
  // Step 1: Upload image assets
  console.log('📤 Uploading images to Canva...');
  const assetIds = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const { asset_id } = await uploadAsset(imagePaths[i], accessToken);
    assetIds.push(asset_id);
    console.log(`✅ Asset ${i + 1} uploaded: ${asset_id}`);
  }
  
  // Step 2: Duplicate brand template (or create from first asset)
  console.log('🖼️ Creating design...');
  const { design_id } = await duplicateDesign(templateId, accessToken, `Pinterest Pin - ${title}`, assetIds[0]);
  console.log(`✅ Design created: ${design_id}`);
  
  // Step 3: Get design elements to find what to replace
  console.log('🔍 Analyzing design structure...');
  const design = await getDesignElements(design_id, accessToken);
  
  // Find text and image elements in first page
  const page = design.pages && design.pages[0];
  
  if (!page || !page.elements || page.elements.length === 0) {
    console.log('⚠️ Design has no editable elements - will export as-is');
    console.log('⚠️ For custom styling, use Data Autofill API once approved');
  } else {
    const textElements = page.elements.filter(el => el.type === 'text');
    const imageElements = page.elements.filter(el => el.type === 'image');
    
    console.log(`Found ${textElements.length} text elements and ${imageElements.length} image elements`);
    
    // Step 4: Update text element with title (update first text element)
    if (textElements.length > 0) {
      console.log('✏️ Updating title text...');
      await updateTextElement(design_id, textElements[0].id, title, accessToken);
      console.log('✅ Title updated');
    }
    
    // Step 5: Update image elements with uploaded assets
    if (imageElements.length > 0) {
      console.log('🖼️ Replacing images...');
      for (let i = 0; i < Math.min(imageElements.length, assetIds.length); i++) {
        await updateImageElement(design_id, imageElements[i].id, assetIds[i], accessToken);
        console.log(`✅ Image ${i + 1} replaced`);
      }
    }
  }
  
  // Step 6: Export design
  console.log('📥 Exporting final design...');
  const { url } = await exportDesign(design_id, accessToken, {
    quality: 'high'
  });
  console.log(`✅ Export ready: ${url}`);
  
  // Step 7: Download to local file
  console.log('💾 Downloading final image...');
  await downloadExport(url, outputPath);
  console.log(`✅ Saved to: ${outputPath}`);
  
  return outputPath;
}

module.exports = {
  uploadAsset,
  duplicateDesign,
  getDesignElements,
  updateTextElement,
  updateImageElement,
  autofillDesign,
  exportDesign,
  downloadExport,
  createPinterestPin,
  pollJob
};
