import { useState, useCallback } from 'react';

// Type definitions for safe integration
export interface TextOptions {
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  fontWeight?: string;
}

export interface EnhancedOptions {
  showTextOverlay?: boolean;
  showTextBackground?: boolean;
  textOptions?: TextOptions;
}

export interface SingleImageParams {
  imageUrl: string;
  title: string;
  options?: EnhancedOptions;
}

export interface DualImageParams {
  topImageUrl: string;
  bottomImageUrl: string;
  title: string;
  options?: EnhancedOptions;
}

export interface SmartGenerateParams {
  imageUrl?: string;
  topImageUrl?: string;
  bottomImageUrl?: string;
  title: string;
  options?: EnhancedOptions;
}

export interface GenerateResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  service: 'existing' | 'new' | 'none';
}

export interface ServiceConfig {
  existingService: {
    url: string;
    enabled: boolean;
  };
  newService: {
    url: string;
    enabled: boolean;
  };
}

/**
 * TypeScript version of Pinterest Pin Generator Hook
 * Provides type safety for integration with existing React apps
 */
export const usePinterestPinGenerator = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration - update the existing service URL to match your API
  const config: ServiceConfig = {
    existingService: {
      url: 'YOUR_EXISTING_API_ENDPOINT', // ← Update this URL
      enabled: true
    },
    newService: {
      url: 'http://localhost:3001/api/create-pin',
      enabled: true
    }
  };

  /**
   * Generate pin using existing single-image service
   */
  const generateSingleImagePin = useCallback(async (
    imageUrl: string, 
    title: string, 
    options: EnhancedOptions = {}
  ): Promise<GenerateResult> => {
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
          // Map these to your existing API parameter names
          imageUrl, // or image_url, imgUrl, etc.
          title,    // or recipe_name, text, etc.
          ...options // your existing options
        })
      });

      if (!response.ok) {
        throw new Error(`Single-image service error: ${response.status}`);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // If your API returns JSON with image URL
        const data = await response.json();
        setLoading(false);
        return {
          success: true,
          imageUrl: data.imageUrl || data.url || data.result_url, // adapt to your response
          service: 'existing'
        };
      } else {
        // If your API returns image blob directly
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setLoading(false);
        return {
          success: true,
          imageUrl,
          service: 'existing'
        };
      }

    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        service: 'existing'
      };
    }
  }, []);

  /**
   * Generate pin using new dual-image service
   */
  const generateDualImagePin = useCallback(async (
    topImageUrl: string,
    bottomImageUrl: string,
    title: string,
    options: EnhancedOptions = {}
  ): Promise<GenerateResult> => {
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
            fontSize: 42,
            fontFamily: 'Arial',
            textColor: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            ...textOptions
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        service: 'new'
      };
    }
  }, []);

  /**
   * Smart generate function - automatically chooses the right service
   */
  const generatePin = useCallback(async (params: SmartGenerateParams): Promise<GenerateResult> => {
    const { imageUrl, topImageUrl, bottomImageUrl, title, options = {} } = params;

    // Determine which service to use based on provided parameters
    if (topImageUrl && bottomImageUrl) {
      // Use new dual-image service
      return await generateDualImagePin(topImageUrl, bottomImageUrl, title, options);
    } else if (imageUrl) {
      // Use existing single-image service
      return await generateSingleImagePin(imageUrl, title, options);
    } else {
      const errorMessage = 'Please provide either imageUrl OR both topImageUrl and bottomImageUrl';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        service: 'none'
      };
    }
  }, [generateSingleImagePin, generateDualImagePin]);

  /**
   * Fallback function - tries new service first, falls back to existing
   */
  const generatePinWithFallback = useCallback(async (
    imageUrl: string,
    title: string,
    options: EnhancedOptions = {}
  ): Promise<GenerateResult> => {
    // First, try to use the image for both top and bottom in new service
    const dualResult = await generateDualImagePin(imageUrl, imageUrl, title, options);
    
    if (dualResult.success) {
      return dualResult;
    }

    // If new service fails, fallback to existing service
    console.warn('New service failed, falling back to existing service');
    return await generateSingleImagePin(imageUrl, title, options);
  }, [generateDualImagePin, generateSingleImagePin]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
    clearError,
    config
  };
};

export default usePinterestPinGenerator;
