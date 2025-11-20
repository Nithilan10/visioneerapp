'use client';

import { useState, useRef } from 'react';
import styles from '../styles/App.module.css';

export default function Home() {
  const [openaiKey, setOpenaiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_API_KEY || '');
  const [atissEndpoint, setAtissEndpoint] = useState(process.env.NEXT_PUBLIC_ATISS_ENDPOINT || '');
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
        model: 'gpt-4-vision-preview',
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

  const callATISSModel = async (endpoint, visionDescription) => {
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
        throw new Error(`ATISS API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('ATISS model call failed, using mock data:', error);
      return {
        layout: 'Mock layout data',
        furniture_placement: 'Mock furniture placement',
        room_plan: 'Mock room plan'
      };
    }
  };

  const getRecommendations = async (apiKey, visionResult, atissResult) => {
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
            content: 'You are an expert interior designer. Provide detailed, actionable recommendations for room layout and design based on the room analysis and ATISS model output.'
          },
          {
            role: 'user',
            content: `Based on this room analysis:\n\n${visionResult}\n\nAnd this ATISS model output:\n\n${JSON.stringify(atissResult, null, 2)}\n\nProvide comprehensive design recommendations including:\n1. Optimal furniture placement\n2. Color scheme suggestions\n3. Lighting recommendations\n4. Layout improvements\n5. Style suggestions\n\nFormat your response in a clear, organized manner.`
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
    const finalOpenaiKey = openaiKey.trim() || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const finalAtissEndpoint = atissEndpoint.trim() || process.env.NEXT_PUBLIC_ATISS_ENDPOINT;

    if (!finalOpenaiKey) {
      setError('Please enter your OpenAI API key or set NEXT_PUBLIC_OPENAI_API_KEY in .env.local');
      return;
    }

    if (!finalAtissEndpoint) {
      setError('Please enter your ATISS model endpoint or set NEXT_PUBLIC_ATISS_ENDPOINT in .env.local');
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
      const atissResult = await callATISSModel(finalAtissEndpoint, visionResult);
      
      setActiveStep(3);
      const recommendationsResult = await getRecommendations(finalOpenaiKey, visionResult, atissResult);
      
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
        <h1>🏠 Room Recommendation Pipeline</h1>
        <p className={styles.subtitle}>Upload a room image to get AI-powered design recommendations</p>

        <div className={styles.apiKeySection}>
          <label htmlFor="openai-key">
            OpenAI API Key {process.env.NEXT_PUBLIC_OPENAI_API_KEY && <span style={{color: '#4CAF50'}}>(loaded from .env)</span>}:
          </label>
          <input
            type="password"
            id="openai-key"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder={process.env.NEXT_PUBLIC_OPENAI_API_KEY ? "Using .env value (or type to override)" : "sk-..."}
          />
        </div>

        <div className={styles.atissSection}>
          <label htmlFor="atiss-endpoint">
            ATISS Model Endpoint (API URL) {process.env.NEXT_PUBLIC_ATISS_ENDPOINT && <span style={{color: '#4CAF50'}}>(loaded from .env)</span>}:
          </label>
          <input
            type="text"
            id="atiss-endpoint"
            value={atissEndpoint}
            onChange={(e) => setAtissEndpoint(e.target.value)}
            placeholder={process.env.NEXT_PUBLIC_ATISS_ENDPOINT ? "Using .env value (or type to override)" : "https://your-atiss-model-endpoint.com/api"}
          />
        </div>

        <div
          className={`${styles.uploadSection} ${isDragging ? styles.dragover : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={styles.uploadIcon}>📸</div>
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
          disabled={loading || !selectedFile || (!openaiKey && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) || (!atissEndpoint && !process.env.NEXT_PUBLIC_ATISS_ENDPOINT)}
        >
          🚀 Get Recommendations
        </button>

        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${activeStep === 1 ? styles.active : activeStep > 1 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div>GPT-Vision</div>
          </div>
          <div className={`${styles.step} ${activeStep === 2 ? styles.active : activeStep > 2 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div>ATISS Model</div>
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
            <h2 className={styles.resultsTitle}>✨ Design Recommendations</h2>
            {formatRecommendations(recommendations)}
          </div>
        )}
      </div>
    </div>
  );
}

