import { useState, useCallback } from 'react';

/**
 * Enhanced Pinterest Pin Generator Hook
 * Safely integrates with both single-image and dual-image pin generation
 */
export const usePinterestPinGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuration for your services
  const config = {
    // Your existing single-image service endpoint
    existingService: {
      url: 'YOUR_EXISTING_API_ENDPOINT', // Replace with your actual endpoint
      enabled: true
    },
    // New dual-image service endpoint
    newService: {
      url: 'http://localhost:3001/api/create-pin',
      enabled: true
    }
  };

  /**
   * Generate pin using your existing single-image service
   */
  const generateSingleImagePin = useCallback(async (imageUrl, title, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Adapt this to match your existing API structure
      const response = await fetch(config.existingService.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl, // Your existing parameter name
          title,    // Your existing parameter name
          ...options // Your existing options
        })
      });

      if (!response.ok) {
        throw new Error(`Single-image service error: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      setLoading(false);
      return {
        success: true,
        imageUrl,
        service: 'existing'
      };

    } catch (err) {
      setLoading(false);
      setError(err.message);
      return {
        success: false,
        error: err.message,
        service: 'existing'
      };
    }
  }, []);

  /**
   * Generate pin using new dual-image service
   */
  const generateDualImagePin = useCallback(async (topImageUrl, bottomImageUrl, title, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        showTextOverlay = true,
        showTextBackground = true,
        textOptions = {}
      } = options;

      const response = await fetch(config.newService.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topImageUrl,
          bottomImageUrl,
          recipeTitle: title,
          showTextOverlay,
          showTextBackground,
          textOptions: {
  fontSize: 48,
  fontFamily: 'Montserrat Bold',
  textColor: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 3,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  textAlign: 'center',
  fontWeight: 'bold'
}
        })
      });

      if (!response.ok) {
        throw new Error(`Dual-image service error: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      setLoading(false);
      return {
        success: true,
        imageUrl,
        service: 'new'
      };

    } catch (err) {
      setLoading(false);
      setError(err.message);
      return {
        success: false,
        error: err.message,
        service: 'new'
      };
    }
  }, []);

  /**
   * Smart generate function - automatically chooses the right service
   */
  const generatePin = useCallback(async (params) => {
    const {
      imageUrl,        // For single image (existing service)
      topImageUrl,     // For dual image (new service)
      bottomImageUrl,  // For dual image (new service)
      title,
      options = {}
    } = params;

    // Determine which service to use
    if (topImageUrl && bottomImageUrl) {
      // Use new dual-image service
      return await generateDualImagePin(topImageUrl, bottomImageUrl, title, options);
    } else if (imageUrl) {
      // Use existing single-image service
      return await generateSingleImagePin(imageUrl, title, options);
    } else {
      setError('Please provide either imageUrl OR both topImageUrl and bottomImageUrl');
      return {
        success: false,
        error: 'Invalid parameters',
        service: 'none'
      };
    }
  }, [generateSingleImagePin, generateDualImagePin]);

  /**
   * Fallback function - tries new service first, falls back to existing
   */
  const generatePinWithFallback = useCallback(async (imageUrl, title, options = {}) => {
    // First, try to use the image for both top and bottom in new service
    const dualResult = await generateDualImagePin(imageUrl, imageUrl, title, options);
    
    if (dualResult.success) {
      return dualResult;
    }

    // If new service fails, fallback to existing service
    console.warn('New service failed, falling back to existing service');
    return await generateSingleImagePin(imageUrl, title, options);
  }, [generateDualImagePin, generateSingleImagePin]);

  return {
    // State
    loading,
    error,
    
    // Main functions
    generatePin,                    // Smart function that chooses the right service
    generateSingleImagePin,         // Your existing service
    generateDualImagePin,          // New enhanced service
    generatePinWithFallback,       // Tries new, falls back to existing
    
    // Utility
    clearError: () => setError(null),
    config
  };
};

export default usePinterestPinGenerator;
