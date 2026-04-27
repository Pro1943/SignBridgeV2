import React, { useState, useRef, useCallback } from 'react';
import WebcamSignDetector from './components/WebcamSignDetector';
import SpeechRecognitionComponent from './components/SpeechRecognition';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend-snowy-sigma-85.vercel.app/api/signbridge';

const sanitizeSign = (sign) => {
  if (typeof sign !== 'string') return '';
  return sign.replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 30);
};

export default function App() {
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setHistory] = useState([]);
  const [isWebcamLive, setIsWebcamLive] = useState(false);
  const lastApiCallRef = useRef(0);
  const voicesLoadedRef = useRef(false);
  const historyRef = useRef([]);
  React.useEffect(() => { historyRef.current = conversationHistory; }, [conversationHistory]);

  /* ── TTS ── */
  const speakText = (text) => {
    if (!text?.trim() || !('speechSynthesis' in window)) return;
    let voices = window.speechSynthesis.getVoices();
    const play = () => {
      const utt = new SpeechSynthesisUtterance(text);
      const preferred = ['Google US English', 'Samantha', 'Karen', 'Tessa', 'Microsoft Zira'];
      let v = voices.find(v => preferred.some(p => v.name.includes(p)))
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices[0];
      if (v) utt.voice = v;
      utt.rate = 0.95; utt.pitch = 1.05;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    };
    if (!voices.length && !voicesLoadedRef.current) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        voicesLoadedRef.current = true;
        play();
      };
    } else {
      setTimeout(play, 100);
    }
  };

  /* ── SIGN → AI ── */
  const handleSignsDetected = async (signs) => {
    const now = Date.now();
    if (now - lastApiCallRef.current < 3000) return;
    lastApiCallRef.current = now;

    // Sanitize letters — preserve ALL consecutive letters (double letters in
    // words like HELLO, BOOK, COFFEE must NOT be deduped).
    const letters = signs.map(sanitizeSign).filter(Boolean);
    if (!letters.length) return;

    setIsProcessing(true);
    setAiResponse('');

    // Build conversational context from the last 2 AI-formed sentences.
    // The LLM sees its own prior output as 'assistant' messages so it can
    // resolve context across turns:
    //   assistant: "My name is:"  ← prior turn
    //   user: [a, b, i, r]        ← current letters → AI says "Abir"
    const recentHistory = historyRef.current
      .filter(e => e.type === 'sign' && e.sentence)
      .slice(-2)
      .map(e => ({ role: 'assistant', content: e.sentence }));

    const attempt = async (retry = 0) => {
      try {
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words: letters, history: recentHistory }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.sentence?.trim()) {
          setAiResponse(data.sentence);
          speakText(data.sentence);
          setHistory(prev => [...prev, { type: 'sign', signs: letters, sentence: data.sentence, ts: Date.now() }]);
        } else {
          setAiResponse('Error: empty AI response.');
        }
      } catch (err) {
        if (retry < 1) { await new Promise(r => setTimeout(r, 2000)); return attempt(1); }
        setAiResponse('Error: could not reach backend.');
      }
    };
    await attempt();
    setIsProcessing(false);
  };

  /* ── SPEECH ── */
  const handleSpeechResult = useCallback((text) => {
    setHistory(prev => [...prev, { type: 'speech', text, ts: Date.now() }]);
  }, []);

  return (
    <div className="app-shell" id="main-content">

      {/* ── HEADER BAR ── */}
      <header className="header-bar" role="banner">
        <div className="header-logo">
          <div className="logo-mark">
            <img src="/logo.png" alt="SignBridge logo" className="logo-img" />
          </div>
          <span className="logo-wordmark">
            SignBridge<span className="logo-version">v2</span>
          </span>
        </div>
        <div className="header-right">
          <div className="header-status" aria-live="polite">
            <span className={`status-dot ${isWebcamLive ? 'live' : ''}`} />
            {isWebcamLive ? 'Camera live' : 'Camera off'}
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="main-grid">

        {/* ── LEFT — DEAF USER ── */}
        <section className="left-panel" aria-label="Deaf user — sign input">
          <div className="panel-strip">
            <span className="strip-label amber">◈ Sign Input</span>
            <span className="strip-label">Deaf User</span>
          </div>
          <WebcamSignDetector
            onSignsDetected={handleSignsDetected}
            onCameraChange={setIsWebcamLive}
          />
        </section>

        {/* ── RIGHT — AI OUTPUT + SPEECH ── */}
        <section className="right-panel" aria-label="AI translation and speech">

          {/* AI OUTPUT */}
          <div className="ai-section">
            <div className="panel-strip">
              <span className="strip-label amber">◈ AI Translation</span>
              <span className="strip-label">Sign → Sentence</span>
            </div>
            <div className="ai-body" aria-live="polite" aria-label="AI translated sentence">
              {isProcessing ? (
                <div className="ai-processing" role="status">
                  <div className="dot-row">
                    <span /><span /><span />
                  </div>
                  <span className="processing-label">ASI:One formulating…</span>
                </div>
              ) : aiResponse ? (
                <p className="ai-sentence">{aiResponse}</p>
              ) : (
                <p className="ai-placeholder">
                  {'// Waiting for sign input\n// The formed sentence will\n// appear here and be spoken aloud.'.split('\n').map((l, i) => (
                    <span key={i} style={{ display: 'block' }}>{l}</span>
                  ))}
                </p>
              )}
            </div>

            {/* History */}
            {conversationHistory.length > 0 && (
              <div className="history-scroll" role="log" aria-label="Conversation history">
                {conversationHistory.map((e, i) => (
                  <div key={i} className="history-row">
                    <span className="history-glyph">{e.type === 'sign' ? '🤟' : '🗣️'}</span>
                    <span className="history-text">{e.type === 'sign' ? e.sentence : e.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SPEECH */}
          <div className="speech-section">
            <div className="panel-strip">
              <span className="strip-label green">◈ Speech Input</span>
              <span className="strip-label">Hearing User</span>
            </div>
            <SpeechRecognitionComponent onSpeechResult={handleSpeechResult} />
          </div>
        </section>
      </main>
    </div>
  );
}
