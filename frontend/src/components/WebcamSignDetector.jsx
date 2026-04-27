import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000/classify';
const CONFIDENCE_THRESHOLD = 0.47;
const DEBOUNCE_MS = 300;

export default function WebcamSignDetector({ onSignsDetected, onCameraChange }) {
  const videoRef = useRef(null);
  const recognizerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastFrameTimeRef = useRef(0);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastDetectedRef = useRef(0);
  const submitTORef = useRef(null);
  const countdownRef = useRef(null);
  const detectedSignsRef = useRef([]);
  const onDetectedRef = useRef(onSignsDetected);
  const loadedHandlerRef = useRef(null);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [mlApiError, setMlApiError] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectedSigns, setDetectedSigns] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState('—');
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownSec, setCountdownSec] = useState(5);

  useEffect(() => { onDetectedRef.current = onSignsDetected; }, [onSignsDetected]);
  useEffect(() => { detectedSignsRef.current = detectedSigns; }, [detectedSigns]);
  useEffect(() => { onCameraChange?.(isWebcamActive); }, [isWebcamActive, onCameraChange]);

  /* ── INIT MEDIAPIPE ── */
  useEffect(() => {
    (async () => {
      setIsModelLoading(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
        );
        const cfg = {
          baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
          runningMode: 'VIDEO', numHands: 1,
        };
        try {
          recognizerRef.current = await HandLandmarker.createFromOptions(vision, { ...cfg, baseOptions: { ...cfg.baseOptions, delegate: 'GPU' } });
        } catch {
          recognizerRef.current = await HandLandmarker.createFromOptions(vision, { ...cfg, baseOptions: { ...cfg.baseOptions, delegate: 'CPU' } });
        }
        setIsReady(true);
      } catch (err) {
        setModelError(`Failed to load AI model: ${err.message}`);
      } finally {
        setIsModelLoading(false);
      }
    })();

    const onUnload = () => videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  /* ── ML API ── */
  const fetchPrediction = async (landmarks) => {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchTimeRef.current < DEBOUNCE_MS) return;
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    try {
      const clean = landmarks.map(({ x, y, z }) => ({ x, y, z }));
      const res = await fetch(ML_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.confidence === 'number') {
          setMlApiError(null);
          setCurrentPrediction(`${String(data.sign).toUpperCase()} · ${Math.round(data.confidence * 100)}%`);

          if (data.confidence >= CONFIDENCE_THRESHOLD) {
            handlePrediction(data.sign, data.confidence);
          }
        }
      } else {
        setMlApiError(`ML API: server returned ${res.status}`);
      }
    } catch {
      setMlApiError('ML API unreachable — check classifier server.');
    } finally {
      isFetchingRef.current = false;
    }
  };

  /* ── PREDICTION HANDLER ── */
  const handlePrediction = (sign, confidence) => {
    setCurrentPrediction(`${sign.toUpperCase()} · ${Math.round(confidence * 100)}%`);
    if (sign === 'None' || !sign || Date.now() - lastDetectedRef.current < 800) return;

    clearTimeout(submitTORef.current);
    clearInterval(countdownRef.current);
    setIsCountdown(false);
    setCountdownSec(5);
    setDetectedSigns(prev => [...prev, sign]);
    lastDetectedRef.current = Date.now();

    submitTORef.current = setTimeout(() => {
      setIsCountdown(true);
      let rem = 5;
      countdownRef.current = setInterval(() => {
        rem -= 1;
        setCountdownSec(rem);
        if (rem <= 0) {
          clearInterval(countdownRef.current);
          if (detectedSignsRef.current.length > 0) {
            onDetectedRef.current([...detectedSignsRef.current]);
            setDetectedSigns([]);
          }
          setIsCountdown(false);
          setCountdownSec(5);
        }
      }, 1000);
    }, 3000);
  };

  /* ── FRAME LOOP ── */
  const predictWebcam = () => {
    if (!videoRef.current?.srcObject || !recognizerRef.current) return;
    const now = performance.now();
    if (now - lastFrameTimeRef.current < 66) { requestRef.current = requestAnimationFrame(predictWebcam); return; }
    lastFrameTimeRef.current = now;

    if (videoRef.current.readyState >= 2 && videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const results = recognizerRef.current.detectForVideo(videoRef.current, Date.now());
      if (results.landmarks?.length > 0) fetchPrediction(results.landmarks[0]);
      else setCurrentPrediction('—');
    }
    if (videoRef.current?.srcObject) requestRef.current = requestAnimationFrame(predictWebcam);
  };

  /* ── CAMERA TOGGLE ── */
  const toggleCamera = async () => {
    if (isWebcamActive) {
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (loadedHandlerRef.current && videoRef.current)
        videoRef.current.removeEventListener('loadeddata', loadedHandlerRef.current);
      setIsWebcamActive(false);
      setCurrentPrediction('—');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoRef.current.srcObject = stream;
      loadedHandlerRef.current = predictWebcam;
      videoRef.current.addEventListener('loadeddata', predictWebcam, { once: true });
      setIsWebcamActive(true);
    } catch {
      setModelError('Camera access denied. Allow camera permissions and retry.');
    }
  };

  /* ── CONTROLS ── */
  const sendToAI = () => {
    if (!detectedSigns.length) return;
    clearTimeout(submitTORef.current);
    clearInterval(countdownRef.current);
    setIsCountdown(false);
    onSignsDetected([...detectedSigns]);
    setDetectedSigns([]);
  };
  const undoLast = () => setDetectedSigns(p => p.slice(0, -1));
  const clearAll = () => {
    clearTimeout(submitTORef.current);
    clearInterval(countdownRef.current);
    setIsCountdown(false);
    setCountdownSec(5);
    setDetectedSigns([]);
    lastDetectedRef.current = 0;
  };

  /* ── RENDER ── */
  return (
    <>
      {/* Banners */}
      {isModelLoading && (
        <div className="banner banner-amber" role="status">
          <div className="spinner-xs" />
          Loading AI model (~7.8 MB)…
        </div>
      )}
      {modelError && (
        <div className="banner banner-danger" role="alert">⚠ {modelError}</div>
      )}
      {mlApiError && !modelError && (
        <div className="banner banner-warn" role="alert">⚠ {mlApiError}</div>
      )}

      {/* Video */}
      <div className="video-wrapper">
        <video ref={videoRef} className="video-feed" autoPlay playsInline
          aria-label="Webcam feed for sign language detection" />

        {/* Corner brackets */}
        <div className="bracket bracket-tl" aria-hidden="true" />
        <div className="bracket bracket-tr" aria-hidden="true" />
        <div className="bracket bracket-bl" aria-hidden="true" />
        <div className="bracket bracket-br" aria-hidden="true" />

        {/* Prediction pill */}
        {isWebcamActive && (
          <div className="prediction-pill" aria-live="polite">
            <span className="pred-label">AI</span>
            <span className="pred-value">{currentPrediction}</span>
          </div>
        )}

        {/* Camera-off placeholder */}
        {!isWebcamActive && (
          <div className="camera-off">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Camera disabled</p>
          </div>
        )}
      </div>

      {/* Sign chip tape */}
      <div className="sign-tape" aria-label="Detected signs buffer">
        <span className="tape-label">Buffer</span>
        {detectedSigns.length === 0 ? (
          <span className="tape-empty">No signs detected — make a gesture</span>
        ) : (
          detectedSigns.map((s, i) => (
            <span key={i} className="sign-chip">{s}</span>
          ))
        )}
        {isCountdown && (
          <span className="countdown-chip" aria-live="assertive">
            ⏳ {countdownSec}s
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className={`btn ${isWebcamActive ? 'btn-danger' : 'btn-amber'}`}
          onClick={toggleCamera} disabled={!isReady}
          aria-label={isWebcamActive ? 'Stop camera' : 'Start camera'}>
          {isWebcamActive ? '◼ Stop' : '▶ Start Camera'}
        </button>

        <button className="btn btn-outline" onClick={sendToAI}
          disabled={!detectedSigns.length}
          aria-label="Send signs to AI for sentence formation">
          ↑ Form Sentence
        </button>

        <button className="btn btn-outline" onClick={undoLast}
          disabled={!detectedSigns.length}
          aria-label="Remove last sign">
          ← Undo
        </button>

        <button className="btn btn-outline" onClick={clearAll}
          disabled={!detectedSigns.length}
          aria-label="Clear all signs">
          ✕ Clear
        </button>
      </div>
    </>
  );
}
