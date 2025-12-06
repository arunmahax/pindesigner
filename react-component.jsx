import React, { useState } from 'react';
import axios from 'axios';

const PinterestPinGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    topImageUrl: 'https://picsum.photos/600/400?random=1',
    bottomImageUrl: 'https://picsum.photos/600/400?random=2',
    recipeTitle: 'Delicious Homemade Recipe',
    showTextOverlay: true, // Toggle to show/hide entire text overlay
    showTextBackground: true, // Toggle to show/hide text background layer
    textOptions: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // 70% opacity for transparency
      textColor: '#ffffff',
      fontSize: 42,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      strokeColor: '#000000',
      strokeWidth: 2
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('textOptions.')) {
      const optionKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        textOptions: {
          ...prev.textOptions,
          [optionKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generatePin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3001/api/create-pin', formData, {
        responseType: 'blob'
      });
      
      // Create a URL for the generated image
      const imageUrl = URL.createObjectURL(response.data);
      setGeneratedPin(imageUrl);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate pin');
    } finally {
      setLoading(false);
    }
  };

  const downloadPin = () => {
    if (generatedPin) {
      const link = document.createElement('a');
      link.href = generatedPin;
      link.download = 'pinterest-pin.png';
      link.click();
    }
  };

  return (
    <div className="pinterest-pin-generator" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#e60023' }}>
        📌 Pinterest Pin Generator
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Form Section */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
          <h3>Configuration</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Top Image URL:</label>
            <input
              type="url"
              name="topImageUrl"
              value={formData.topImageUrl}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Bottom Image URL:</label>
            <input
              type="url"
              name="bottomImageUrl"
              value={formData.bottomImageUrl}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Recipe Title:</label>
            <input
              type="text"
              name="recipeTitle"
              value={formData.recipeTitle}
              onChange={handleInputChange}
              disabled={!formData.showTextOverlay}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                opacity: formData.showTextOverlay ? 1 : 0.5
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                name="showTextOverlay"
                checked={formData.showTextOverlay}
                onChange={(e) => setFormData(prev => ({ ...prev, showTextOverlay: e.target.checked }))}
                style={{ marginRight: '8px' }}
              />
              Show Text Overlay
            </label>
          </div>
          
          <div style={{ marginBottom: '15px', opacity: formData.showTextOverlay ? 1 : 0.5 }}>
            <label>
              <input
                type="checkbox"
                name="showTextBackground"
                checked={formData.showTextBackground}
                onChange={(e) => setFormData(prev => ({ ...prev, showTextBackground: e.target.checked }))}
                disabled={!formData.showTextOverlay}
                style={{ marginRight: '8px' }}
              />
              Show Text Background
            </label>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              When unchecked, text appears directly over images without background layer
            </div>
          </div>
          
          <div style={{ marginBottom: '15px', opacity: formData.showTextOverlay ? 1 : 0.5 }}>
            <label>Font Size:</label>
            <input
              type="range"
              name="textOptions.fontSize"
              min="20"
              max="120"
              value={formData.textOptions.fontSize}
              onChange={handleInputChange}
              disabled={!formData.showTextOverlay}
              style={{ width: '100%' }}
            />
            <span>{formData.textOptions.fontSize}px</span>
          </div>
          
          <div style={{ marginBottom: '15px', opacity: formData.showTextOverlay ? 1 : 0.5 }}>
            <label>Font Family:</label>
            <select
              name="textOptions.fontFamily"
              value={formData.textOptions.fontFamily}
              onChange={handleInputChange}
              disabled={!formData.showTextOverlay}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Impact">Impact</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px', opacity: formData.showTextOverlay ? 1 : 0.5 }}>
            <label>Text Color:</label>
            <input
              type="color"
              name="textOptions.textColor"
              value={formData.textOptions.textColor}
              onChange={handleInputChange}
              disabled={!formData.showTextOverlay}
              style={{ width: '100%', height: '40px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px', opacity: formData.showTextOverlay ? 1 : 0.5 }}>
            <label>Stroke Color:</label>
            <input
              type="color"
              name="textOptions.strokeColor"
              value={formData.textOptions.strokeColor}
              onChange={handleInputChange}
              disabled={!formData.showTextOverlay}
              style={{ width: '100%', height: '40px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px', opacity: formData.showTextOverlay ? 1 : 0.5 }}>
            <label>Stroke Width:</label>
            <input
              type="range"
              name="textOptions.strokeWidth"
              min="0"
              max="10"
              value={formData.textOptions.strokeWidth}
              onChange={handleInputChange}
              disabled={!formData.showTextOverlay}
              style={{ width: '100%' }}
            />
            <span>{formData.textOptions.strokeWidth}px</span>
          </div>
          
          <button
            onClick={generatePin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#e60023',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '🔄 Generating...' : '🎨 Generate Pin'}
          </button>
        </div>
        
        {/* Preview Section */}
        <div style={{ textAlign: 'center' }}>
          <h3>Preview</h3>
          <div style={{
            background: '#f8f9fa',
            border: '2px dashed #ddd',
            borderRadius: '10px',
            padding: '20px',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            {loading && <p>Generating your pin...</p>}
            {error && <p style={{ color: '#e60023' }}>Error: {error}</p>}
            {generatedPin && !loading && (
              <>
                <img 
                  src={generatedPin} 
                  alt="Generated Pinterest Pin" 
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
                <button
                  onClick={downloadPin}
                  style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ⬇️ Download Pin
                </button>
              </>
            )}
            {!generatedPin && !loading && !error && (
              <p>Your generated pin will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinterestPinGenerator;
