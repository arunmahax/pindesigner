import React, { useState } from 'react';
import usePinterestPinGenerator from './usePinterestPinGenerator';

/**
 * Enhanced Pinterest Pin Component
 * Compatible with both existing single-image and new dual-image services
 */
const EnhancedPinterestPin = () => {
  const {
    loading,
    error,
    generatePin,
    generateSingleImagePin,
    generateDualImagePin,
    generatePinWithFallback,
    clearError
  } = usePinterestPinGenerator();

  const [generatedPin, setGeneratedPin] = useState(null);
  const [mode, setMode] = useState('single'); // 'single', 'dual', or 'smart'
  
  // Form state
  const [formData, setFormData] = useState({
    // For single image mode (your existing workflow)
    imageUrl: 'https://picsum.photos/600/400?random=1',
    
    // For dual image mode (new enhanced features)
    topImageUrl: 'https://picsum.photos/600/400?random=1',
    bottomImageUrl: 'https://picsum.photos/600/400?random=2',
    
    // Common fields
    title: 'Delicious Recipe',
    
    // Enhanced options for new service
    enhancedOptions: {
      showTextOverlay: true,
      showTextBackground: true,
      textOptions: {
        fontSize: 60,
        fontFamily: 'Arial',
        textColor: '#ffffff',
        strokeColor: '#ff0000',
        strokeWidth: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTextOptionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      enhancedOptions: {
        ...prev.enhancedOptions,
        textOptions: {
          ...prev.enhancedOptions.textOptions,
          [field]: value
        }
      }
    }));
  };

  // Generate pin using current mode
  const handleGenerate = async () => {
    clearError();
    let result;

    switch (mode) {
      case 'single':
        // Use your existing single-image service
        result = await generateSingleImagePin(
          formData.imageUrl,
          formData.title,
          formData.enhancedOptions
        );
        break;

      case 'dual':
        // Use new dual-image service
        result = await generateDualImagePin(
          formData.topImageUrl,
          formData.bottomImageUrl,
          formData.title,
          formData.enhancedOptions
        );
        break;

      case 'smart':
        // Smart mode - automatically chooses the right service
        result = await generatePin({
          imageUrl: formData.imageUrl,
          topImageUrl: formData.topImageUrl,
          bottomImageUrl: formData.bottomImageUrl,
          title: formData.title,
          options: formData.enhancedOptions
        });
        break;

      case 'fallback':
        // Fallback mode - tries new service, falls back to existing
        result = await generatePinWithFallback(
          formData.imageUrl,
          formData.title,
          formData.enhancedOptions
        );
        break;

      default:
        console.error('Invalid mode');
        return;
    }

    if (result.success) {
      setGeneratedPin(result);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎨 Enhanced Pinterest Pin Generator</h1>
      <p>Safe integration with your existing service + new dual-image features</p>

      {/* Mode Selection */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Generation Mode</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { key: 'single', label: '📷 Single Image (Your Existing Service)', desc: 'Uses your current pin generation service' },
            { key: 'dual', label: '🖼️ Dual Image (New Enhanced Service)', desc: 'Combines 2 images with enhanced features' },
            { key: 'smart', label: '🧠 Smart Mode', desc: 'Automatically chooses the right service' },
            { key: 'fallback', label: '🛡️ Fallback Mode', desc: 'Tries new service, falls back to existing' }
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                padding: '10px 15px',
                backgroundColor: mode === key ? '#e60023' : '#ffffff',
                color: mode === key ? '#ffffff' : '#333333',
                border: '2px solid #e60023',
                borderRadius: '5px',
                cursor: 'pointer',
                flex: '1',
                minWidth: '200px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{label}</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Input Section */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3>📝 Pin Configuration</h3>
          
          {/* Single Image Mode */}
          {(mode === 'single' || mode === 'fallback') && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Image URL (Your Existing Workflow):
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/your-image.jpg"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          )}

          {/* Dual Image Mode */}
          {(mode === 'dual' || mode === 'smart') && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Top Image URL:
                </label>
                <input
                  type="url"
                  value={formData.topImageUrl}
                  onChange={(e) => handleInputChange('topImageUrl', e.target.value)}
                  placeholder="https://example.com/top-image.jpg"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Bottom Image URL:
                </label>
                <input
                  type="url"
                  value={formData.bottomImageUrl}
                  onChange={(e) => handleInputChange('bottomImageUrl', e.target.value)}
                  placeholder="https://example.com/bottom-image.jpg"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </>
          )}

          {/* Common Fields */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Recipe Title:
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Amazing Recipe Title"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          {/* Enhanced Options (for new service) */}
          {(mode === 'dual' || mode === 'smart' || mode === 'fallback') && (
            <div style={{ backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>🎨 Enhanced Features (New Service)</h4>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Font Size: {formData.enhancedOptions.textOptions.fontSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={formData.enhancedOptions.textOptions.fontSize}
                  onChange={(e) => handleTextOptionChange('fontSize', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Text Color:</label>
                <input
                  type="color"
                  value={formData.enhancedOptions.textOptions.textColor}
                  onChange={(e) => handleTextOptionChange('textColor', e.target.value)}
                  style={{ width: '50px', height: '30px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Stroke Color:</label>
                <input
                  type="color"
                  value={formData.enhancedOptions.textOptions.strokeColor}
                  onChange={(e) => handleTextOptionChange('strokeColor', e.target.value)}
                  style={{ width: '50px', height: '30px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Stroke Width: {formData.enhancedOptions.textOptions.strokeWidth}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.enhancedOptions.textOptions.strokeWidth}
                  onChange={(e) => handleTextOptionChange('strokeWidth', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.enhancedOptions.showTextBackground}
                    onChange={(e) => handleInputChange('enhancedOptions', {
                      ...formData.enhancedOptions,
                      showTextBackground: e.target.checked
                    })}
                  />
                  {' '}Show Text Background
                </label>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#ccc' : '#e60023',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Generating...' : '🎨 Generate Pinterest Pin'}
          </button>

          {/* Error Display */}
          {error && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#ffe6e6',
              color: '#cc0000',
              borderRadius: '4px',
              border: '1px solid #ff9999'
            }}>
              ❌ Error: {error}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3>📋 Preview</h3>
          <div style={{
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            {generatedPin ? (
              <div>
                <img
                  src={generatedPin.imageUrl}
                  alt="Generated Pinterest Pin"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Generated using: <strong>{generatedPin.service}</strong> service
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedPin.imageUrl;
                    link.download = 'pinterest-pin.png';
                    link.click();
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ⬇️ Download Pin
                </button>
              </div>
            ) : (
              <div style={{ color: '#666' }}>
                Your generated Pinterest pin will appear here...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integration Information */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h3>ℹ️ Integration Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <h4>🔒 Safe Integration</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Your existing service remains functional</li>
              <li>New features are opt-in</li>
              <li>Gradual migration support</li>
              <li>Fallback mechanisms included</li>
            </ul>
          </div>
          <div>
            <h4>✨ New Capabilities</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Dual-image Pinterest pins</li>
              <li>Font sizes up to 120px</li>
              <li>Custom stroke colors</li>
              <li>Text background toggle</li>
            </ul>
          </div>
          <div>
            <h4>🛠️ Implementation</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Drop-in React hook</li>
              <li>Backward compatible</li>
              <li>Error handling included</li>
              <li>TypeScript ready</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPinterestPin;
