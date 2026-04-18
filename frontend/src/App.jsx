import React, { useState } from 'react';
import WebcamSignDetector from './components/WebcamSignDetector';
import SpeechRecognitionComponent from './components/SpeechRecognition';

function App() {
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Small delay to ensure it doesn't overlap weirdly
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        // Using a clear voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
        }
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  const handleSignsDetected = async (signs) => {
    setIsProcessing(true);
    setAiResponse('');
    try {
      const response = await fetch('https://backend-snowy-sigma-85.vercel.app/api/signbridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: signs })
      });
      
      const data = await response.json();
      setAiResponse(data.sentence);
      speakText(data.sentence); // Play TTS so hearing person hears it
    } catch (error) {
      console.error('Error forming sentence:', error);
      setAiResponse("Error: Could not reach backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeechResult = (text) => {
    // The SpeechRecognitionComponent already displays the live text for the deaf person to read.
  };

  return (
    <div className="app-container">
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: '-1rem' }}>
        <h1>SignBridge v2</h1>
        <p className="subtitle">Real-time Two-Way Communication System</p>
      </div>

      <WebcamSignDetector onSignsDetected={handleSignsDetected} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ flexGrow: 1, border: '2px solid var(--accent)' }}>
          <h2 className="message-label" style={{ color: 'var(--accent)' }}>AI Translation (Sign to Sentence)</h2>
          <div className="message-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            {isProcessing ? (
              <div className="ai-processing">ASI:One AI is formulating sentence...</div>
            ) : aiResponse ? (
              <div className="large-text">{aiResponse}</div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>The formed sentence will appear here and be spoken aloud for the hearing person.</div>
            )}
          </div>
        </div>

        <SpeechRecognitionComponent onSpeechResult={handleSpeechResult} />
      </div>
    </div>
  );
}

export default App;
