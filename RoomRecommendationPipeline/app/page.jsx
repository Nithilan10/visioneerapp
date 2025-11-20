'use client';

import { useState, useRef } from 'react';
import styles from '../styles/App.module.css';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const callGPTVision = async (apiKey, base64Image) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this room image in detail. Describe the room dimensions, layout, existing furniture, wall colors, floor type, lighting conditions, and any architectural features. Provide a comprehensive description that can be used for interior design recommendations.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'GPT Vision API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const callTransformerModel = async (endpoint, visionDescription) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_description: visionDescription
        })
      });

      if (!response.ok) {
        throw new Error(`Transformer API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process transformer output: category and positions (x, y, z)
      // Category can be one-hot encoded array or index
      // Positions are [x, y, z] coordinates
      const processedOutput = {
        predictions: Array.isArray(data) ? data : (data.predictions || [data]),
        raw: data
      };

      // Process each prediction
      processedOutput.predictions = processedOutput.predictions.map((pred, idx) => {
        let category;
        let categoryIndex;
        let positions = { x: null, y: null, z: null };

        // Handle category (one-hot encoded array or index)
        if (pred.category !== undefined) {
          if (Array.isArray(pred.category)) {
            // One-hot encoded: find argmax
            categoryIndex = pred.category.indexOf(Math.max(...pred.category));
            category = categoryIndex;
          } else if (typeof pred.category === 'number') {
            // Already an index
            categoryIndex = pred.category;
            category = categoryIndex;
          }
        }

        // Handle positions
        if (pred.position) {
          positions = {
            x: pred.position[0] || pred.position.x || null,
            y: pred.position[1] || pred.position.y || null,
            z: pred.position[2] || pred.position.z || null
          };
        } else if (pred.x !== undefined || pred.y !== undefined || pred.z !== undefined) {
          positions = {
            x: pred.x || null,
            y: pred.y || null,
            z: pred.z || null
          };
        }

        return {
          category,
          categoryIndex,
          positions,
          raw: pred
        };
      });

      return processedOutput;
    } catch (error) {
      console.warn('Transformer model call failed, using mock data:', error);
      return {
        predictions: [{
          category: 0,
          categoryIndex: 0,
          positions: { x: 2.5, y: 0, z: 3.0 },
          raw: { category: 0, position: [2.5, 0, 3.0] }
        }],
        raw: { error: 'Mock data' }
      };
    }
  };

  const getRecommendations = async (apiKey, visionResult, transformerResult) => {
    // Format transformer predictions for GPT
    const predictionsText = transformerResult.predictions.map((pred, idx) => {
      const categoryNames = ['chair', 'table', 'sofa', 'bed', 'desk', 'cabinet', 'shelf', 'lamp', 'other'];
      const categoryName = categoryNames[pred.categoryIndex] || `category_${pred.categoryIndex}`;
      const pos = pred.positions;
      
      return `Prediction ${idx + 1}:
- Object Category: ${categoryName} (index: ${pred.categoryIndex})
- Position: X=${pos.x !== null ? pos.x.toFixed(2) : 'N/A'}, Y=${pos.y !== null ? pos.y.toFixed(2) : 'N/A'}, Z=${pos.z !== null ? pos.z.toFixed(2) : 'N/A'}
- Suggested placement: Place a ${categoryName} at coordinates (${pos.x !== null ? pos.x.toFixed(2) : 'N/A'}, ${pos.y !== null ? pos.y.toFixed(2) : 'N/A'}, ${pos.z !== null ? pos.z.toFixed(2) : 'N/A'})`;
    }).join('\n\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interior designer. Based on room analysis and predicted object placements from an autoregressive transformer model, provide detailed, actionable design recommendations. The transformer predicts next objects and their 3D positions (x, y, z) in the room.'
          },
          {
            role: 'user',
            content: `Room Analysis:\n${visionResult}\n\nPredicted Object Placements (from autoregressive transformer):\n${predictionsText}\n\nBased on this information, provide comprehensive design recommendations including:\n1. Furniture placement suggestions based on predicted positions\n2. How to arrange objects at the suggested coordinates\n3. Color scheme suggestions that complement the layout\n4. Lighting recommendations for the predicted arrangement\n5. Layout improvements and style suggestions\n6. Visual recommendations like "place a chair here" or "add a table there" based on the predicted positions\n\nFormat your response in a clear, organized manner with specific references to the predicted positions.`
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'GPT API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const processImage = async () => {
    const finalOpenaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const finalTransformerEndpoint = process.env.NEXT_PUBLIC_TRANSFORMER_ENDPOINT;

    if (!finalOpenaiKey) {
      setError('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in .env.local');
      return;
    }

    if (!finalTransformerEndpoint) {
      setError('Transformer model endpoint not configured. Please set NEXT_PUBLIC_TRANSFORMER_ENDPOINT in .env.local');
      return;
    }

    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations(null);
    setActiveStep(1);

    try {
      const base64Image = await fileToBase64(selectedFile);
      
      setActiveStep(1);
      const visionResult = await callGPTVision(finalOpenaiKey, base64Image);
      
      setActiveStep(2);
      const transformerResult = await callTransformerModel(finalTransformerEndpoint, visionResult);
      
      setActiveStep(3);
      const recommendationsResult = await getRecommendations(finalOpenaiKey, visionResult, transformerResult);
      
      setRecommendations(recommendationsResult);
      setActiveStep(0);
    } catch (err) {
      setError(err.message);
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const formatRecommendations = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      if (line.match(/^\d+\./)) {
        const parts = line.split('.');
        const title = parts[0] + '.';
        const content = parts.slice(1).join('.').trim();
        return (
          <div key={index} className={styles.recommendationCard}>
            <div className={styles.recommendationTitle}>{title}</div>
            <div className={styles.recommendationContent}>{content}</div>
          </div>
        );
      } else if (line.startsWith('#')) {
        return (
          <div key={index} className={styles.recommendationCard}>
            <div className={styles.recommendationTitle}>{line.replace(/#/g, '').trim()}</div>
          </div>
        );
      } else {
        return (
          <div key={index} className={styles.recommendationCard}>
            <div className={styles.recommendationContent}>{line}</div>
          </div>
        );
      }
    });
  };

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <h1 className={styles.title}>Room Recommendation Pipeline</h1>
        <p className={styles.subtitle}>Upload a room image to get AI-powered design recommendations</p>

        <div
          className={`${styles.uploadSection} ${isDragging ? styles.dragover : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={styles.uploadText}>Drag & drop your room image here, or click to browse</div>
          <input
            ref={fileInputRef}
            type="file"
            id="image-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            Choose Image
          </button>
        </div>

        {previewUrl && (
          <div className={styles.previewSection}>
            <img src={previewUrl} alt="Room preview" className={styles.previewImage} />
          </div>
        )}

        <button
          className={styles.processBtn}
          onClick={processImage}
          disabled={loading || !selectedFile || (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) || (!process.env.NEXT_PUBLIC_TRANSFORMER_ENDPOINT)}
        >
          Get Recommendations
        </button>

        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${activeStep === 1 ? styles.active : activeStep > 1 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div>GPT-Vision</div>
          </div>
          <div className={`${styles.step} ${activeStep === 2 ? styles.active : activeStep > 2 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div>Transformer Model</div>
          </div>
          <div className={`${styles.step} ${activeStep === 3 ? styles.active : activeStep > 3 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div>GPT Recommendations</div>
          </div>
        </div>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Processing your room image...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {recommendations && (
          <div className={styles.resultsSection}>
            <h2 className={styles.resultsTitle}>Design Recommendations</h2>
            {formatRecommendations(recommendations)}
          </div>
        )}
      </div>
    </div>
  );
}

