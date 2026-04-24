import React, { useState, useEffect, useRef } from 'react';

export default function SpeechRecognitionComponent({ onSpeechResult }) {
  const [isListening, setIsListening]   = useState(false);
  const [finalText, setFinalText]       = useState('');
  const [interimText, setInterimText]   = useState('');
  const recognitionRef   = useRef(null);
  const isListeningRef   = useRef(false);
  const onResultRef      = useRef(onSpeechResult);
  const transcriptRef    = useRef(null);

  useEffect(() => { onResultRef.current = onSpeechResult; }, [onSpeechResult]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  /* ── INIT SPEECH RECOGNITION ── */
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;

    rec.onresult = (e) => {
      let fin = '', int = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else int = e.results[i][0].transcript;
      }
      if (fin) {
        setFinalText(p => p + ' ' + fin);
        setInterimText('');
        onResultRef.current(fin.trim());
      } else {
        setInterimText(int);
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        alert('Microphone blocked — allow access in browser settings.');
        setIsListening(false);
      } else if (e.error === 'no-speech') {
        setInterimText('… (no speech detected)');
      } else {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start(); } catch { /* already started */ }
      }
    };

    return () => { try { rec.abort(); } catch { /* cleanup */ } };
  }, []);

  /* Auto-scroll */
  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [finalText, interimText]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try { recognitionRef.current.abort(); } catch { /* ok */ }
      setIsListening(false);
    } else {
      setFinalText('');
      setInterimText('');
      try { recognitionRef.current.start(); setIsListening(true); } catch { /* ok */ }
    }
  };

  const display = (finalText + (interimText ? ' ' + interimText : '')).trim();

  return (
    <>
      {/* Transcript */}
      <div className="speech-body" ref={transcriptRef}
        aria-live="polite" aria-label="Speech transcript">
        {display ? (
          <div className="speech-live">
            {finalText.trim()}
            {interimText && <span className="interim"> {interimText}</span>}
          </div>
        ) : (
          <p className="speech-empty">
            {isListening
              ? '// Listening… speak now'
              : '// Press listen to capture speech'}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="speech-controls">
        <button
          className={`btn ${isListening ? 'btn-danger' : 'btn-success'}`}
          onClick={toggle}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '◼ Stop' : '⏺ Listen'}
        </button>
        {isListening && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            color: 'var(--success)',
            animation: 'blink 1.5s ease-in-out infinite',
          }}>
            REC
          </span>
        )}
      </div>
    </>
  );
}
