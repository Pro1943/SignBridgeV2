import React, { useState } from 'react';
import WebcamSignDetector from './components/WebcamSignDetector';
import SpeechRecognitionComponent from './components/SpeechRecognition';

function App() {
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      let voices = window.speechSynthesis.getVoices();
      
      const playUtterance = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Prioritize natural sounding, premium voices
        const premiumVoices = ['Google US English', 'Samantha', 'Karen', 'Tessa', 'Microsoft Zira'];
        let selectedVoice = voices.find(v => premiumVoices.some(premium => v.name.includes(premium)));
        
        // Fallback to any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        utterance.rate = 0.95;  // Slightly slower for better articulation
        utterance.pitch = 1.05; // Slightly higher pitch for a warmer, friendlier tone

        window.speechSynthesis.cancel(); // Stop any currently playing audio so it doesn't queue up weirdly
        window.speechSynthesis.speak(utterance);
      };

      if (voices.length === 0) {
        // Wait for voices to load if they aren't ready yet (common on mobile browsers)
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          playUtterance();
        };
      } else {
        setTimeout(playUtterance, 100);
      }
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

        <SpeechRecognitionComponent onSpeechResult={() => {}} />
      </div>
    </div>
  );
}

export default App;
