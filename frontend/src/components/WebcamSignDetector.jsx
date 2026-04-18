import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { Video, VideoOff, Send } from 'lucide-react';

export default function WebcamSignDetector({ onSignsDetected }) {
  const videoRef = useRef(null);
  const recognizerRef = useRef(null);
  const [isRecognizerReady, setIsRecognizerReady] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectedSigns, setDetectedSigns] = useState([]);

  const lastDetectedTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef(null);

  // Initialize MediaPipe Gesture Recognizer
  useEffect(() => {
    const initializeRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU" // Uses WebGL if available
        },
        runningMode: "VIDEO"
      });
      setIsRecognizerReady(true);
    };
    initializeRecognizer();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, []);

  const predictWebcam = () => {
    if (!videoRef.current || !videoRef.current.srcObject || !recognizerRef.current) return;

    // Check if the video is ready and time advanced
    if (videoRef.current.readyState >= 2 && videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const nowInMs = Date.now();
      const results = recognizerRef.current.recognizeForVideo(videoRef.current, nowInMs);

      if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);

        // Map common gestures to simple words for prototype
        const gestureMap = {
          "Thumb_Up": "Good",
          "Thumb_Down": "Bad",
          "Victory": "Peace",
          "ILoveYou": "Love",
          "Closed_Fist": "Stop",
          "Open_Palm": "Hello",
          "Pointing_Up": "Look"
        };

        const word = gestureMap[categoryName] || categoryName;

        // Debounce detection (1 gesture per 1.5 seconds)
        if (word !== "None" && categoryScore > 60 && nowInMs - lastDetectedTimeRef.current > 1500) {
          setDetectedSigns(prev => [...prev, word]);
          lastDetectedTimeRef.current = nowInMs;
        }
      }
    }

    // Keep predicting
    if (videoRef.current && videoRef.current.srcObject) {
      requestRef.current = window.requestAnimationFrame(predictWebcam);
    }
  };

  const enableCam = async () => {
    if (!recognizerRef.current) return;

    if (isWebcamActive) {
      const stream = videoRef.current.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setIsWebcamActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", predictWebcam);
      setIsWebcamActive(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const handleSendToAI = () => {
    if (detectedSigns.length > 0) {
      onSignsDetected(detectedSigns);
      setDetectedSigns([]); // Clear after sending
    }
  };

  return (
    <div className="glass-panel">
      <h2 className="message-label">Deaf User (Sign to Text)</h2>

      <div className="video-container">
        <video
          ref={videoRef}
          className="video-element"
          autoPlay
          playsInline
        ></video>
        {!isWebcamActive && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', textAlign: 'center' }}>
            <VideoOff size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Camera is disabled</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${isWebcamActive ? 'active' : ''}`}
          onClick={enableCam}
          disabled={!isRecognizerReady}
        >
          {isWebcamActive ? <VideoOff /> : <Video />}
          {isWebcamActive ? 'Stop Camera' : 'Start Camera'}
        </button>

        <button
          className="btn"
          style={{ background: 'var(--success)' }}
          onClick={handleSendToAI}
          disabled={detectedSigns.length === 0}
        >
          <Send /> Form Sentence
        </button>
      </div>

      <div className="message-box">
        <div className="message-label">Detected Signs Buffer</div>
        {detectedSigns.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No signs detected yet. Make a gesture like Thumb Up, Victory, or Open Palm.</div>
        ) : (
          <div className="detected-signs">
            {detectedSigns.map((sign, index) => (
              <span key={index} className="sign-badge">{sign}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
