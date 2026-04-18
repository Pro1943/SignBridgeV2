import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function SpeechRecognitionComponent({ onSpeechResult }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(prev => finalTranscript ? prev + ' ' + finalTranscript : prev + interimTranscript);
      
      if (finalTranscript) {
        onSpeechResult(finalTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked! Please click the small camera/mic icon in your browser's address bar to allow microphone access, then try again.");
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        // Automatically restart if it stops unexpectedly while supposed to be listening
        try {
          recognitionRef.current.start();
        } catch(e) {}
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, onSpeechResult]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start listening", err);
      }
    }
  };

  return (
    <div className="glass-panel">
      <h2 className="message-label" style={{ color: 'var(--success)' }}>Hearing User (Speech to Text)</h2>
      
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <button 
          className={`btn ${isListening ? 'recording' : ''}`} 
          onClick={toggleListening}
          style={{ marginBottom: '1.5rem', width: 'auto', alignSelf: 'flex-start' }}
        >
          {isListening ? <MicOff /> : <Mic />}
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>

        <div className="message-box" style={{ flexGrow: 1 }}>
          <div className="message-label">Live Transcript</div>
          {transcript ? (
            <div className="large-text">{transcript}</div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>Waiting for speech... Press the mic and start talking.</div>
          )}
        </div>
      </div>
    </div>
  );
}
