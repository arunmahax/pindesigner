// React Client Example for Pinterest Pin Generator Service

import React, { useState } from 'react';

const PinterestPinGenerator = () => {
  const [formData, setFormData] = useState({
    topImageUrl: '',
    bottomImageUrl: '',
    recipeTitle: '',
    textOptions: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      textColor: '#ffffff',
      fontSize: 36,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      strokeColor: '#000000',
      strokeWidth: 0
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('textOptions.')) {
      const optionName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        textOptions: {
          ...prev.textOptions,
          [optionName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generatePin = async () => {
    if (!formData.topImageUrl || !formData.bottomImageUrl || !formData.recipeTitle) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/create-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate pin');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImageUrl(imageUrl);
      
    } catch (error) {
      console.error('Error generating pin:', error);
      alert('Error generating pin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPin = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `${formData.recipeTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.click();
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Pinterest Pin Generator</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Image URLs</h3>
        <input
          type="url"
          name="topImageUrl"
          placeholder="Top image URL (from Midjourney)"
          value={formData.topImageUrl}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="url"
          name="bottomImageUrl"
          placeholder="Bottom image URL (from Midjourney)"
          value={formData.bottomImageUrl}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Recipe Title</h3>
        <input
          type="text"
          name="recipeTitle"
          placeholder="Enter recipe name"
          value={formData.recipeTitle}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Text Styling Options</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input
            type="color"
            name="textOptions.textColor"
            value={formData.textOptions.textColor}
            onChange={handleInputChange}
            title="Text Color"
          />
          <input
            type="color"
            name="textOptions.backgroundColor"
            value={formData.textOptions.backgroundColor.replace('rgba(0, 0, 0, 0.7)', '#000000')}
            onChange={(e) => {
              const hex = e.target.value;
              const rgba = `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, 0.7)`;
              setFormData(prev => ({
                ...prev,
                textOptions: {
                  ...prev.textOptions,
                  backgroundColor: rgba
                }
              }));
            }}
            title="Background Color"
          />
          <input
            type="number"
            name="textOptions.fontSize"
            placeholder="Font Size"
            value={formData.textOptions.fontSize}
            onChange={handleInputChange}
            min="12"
            max="72"
          />
          <select
            name="textOptions.fontFamily"
            value={formData.textOptions.fontFamily}
            onChange={handleInputChange}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
          </select>
          <select
            name="textOptions.fontWeight"
            value={formData.textOptions.fontWeight}
            onChange={handleInputChange}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="bolder">Bolder</option>
          </select>
          <input
            type="number"
            name="textOptions.strokeWidth"
            placeholder="Stroke Width"
            value={formData.textOptions.strokeWidth}
            onChange={handleInputChange}
            min="0"
            max="10"
          />
        </div>
      </div>

      <button
        onClick={generatePin}
        disabled={loading}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#e60023',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginRight: '10px'
        }}
      >
        {loading ? 'Generating...' : 'Generate Pinterest Pin'}
      </button>

      {generatedImageUrl && (
        <button
          onClick={downloadPin}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer'
          }}
        >
          Download Pin
        </button>
      )}

      {generatedImageUrl && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Generated Pinterest Pin</h3>
          <img
            src={generatedImageUrl}
            alt="Generated Pinterest Pin"
            style={{ maxWidth: '300px', border: '1px solid #ddd', borderRadius: '10px' }}
          />
        </div>
      )}
    </div>
  );
};

export default PinterestPinGenerator;
