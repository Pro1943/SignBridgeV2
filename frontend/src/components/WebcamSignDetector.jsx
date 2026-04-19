import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Video, VideoOff, Send, Trash2 } from 'lucide-react';

export default function WebcamSignDetector({ onSignsDetected }) {
  const videoRef = useRef(null);
  const recognizerRef = useRef(null);
  const [isRecognizerReady, setIsRecognizerReady] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectedSigns, setDetectedSigns] = useState([]);
  const [isSubmittingCountdown, setIsSubmittingCountdown] = useState(false);

  const lastDetectedTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef(null);
  const historyRef = useRef([]);

  const detectedSignsRef = useRef([]);
  const submitTimeoutRef = useRef(null);
  const onSignsDetectedRef = useRef(onSignsDetected);

  useEffect(() => {
    onSignsDetectedRef.current = onSignsDetected;
  }, [onSignsDetected]);

  useEffect(() => {
    detectedSignsRef.current = detectedSigns;
  }, [detectedSigns]);

  // Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    const initializeRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      recognizerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU" // Uses WebGL if available
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setIsRecognizerReady(true);
    };
    initializeRecognizer();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, []);

  // Custom Math-Based ASL Alphabet Classifier
  const classifyPoseMath = (landmarks) => {
    // Resting Hand Filter: If wrist (0) is higher than the middle knuckle (9), hand is pointing down.
    if (landmarks[0].y < landmarks[9].y) return "None";

    const tip = { t: 4, i: 8, m: 12, r: 16, p: 20 };
    const pip = { t: 3, i: 6, m: 10, r: 14, p: 18 };
    const mcp = { t: 2, i: 5, m: 9, r: 13, p: 17 };

    const isUp = (f) => landmarks[tip[f]].y < landmarks[pip[f]].y;
    const tUp = landmarks[tip.t].y < landmarks[mcp.i].y;

    const iUp = isUp('i');
    const mUp = isUp('m');
    const rUp = isUp('r');
    const pUp = isUp('p');

    // Helper to calculate 2D distance
    const dist = (p1, p2) => Math.hypot(landmarks[p1].x - landmarks[p2].x, landmarks[p1].y - landmarks[p2].y);
    if (iUp && mUp && rUp && pUp && tUp && dist(tip.t, mcp.i) > 0.1) return "Hello";
    if (iUp && mUp && rUp && pUp && !tUp) return "B";
    if (iUp && mUp && !rUp && !pUp && dist(tip.i, tip.m) > 0.05) {
      if (dist(tip.i, tip.m) < 0.08) return "V";
      return "Peace";
    }
    if (!iUp && !mUp && !rUp && !pUp && landmarks[tip.t].y < landmarks[mcp.i].y - 0.05) return "Thumbs Up";
    if (!iUp && !mUp && !rUp && !pUp && tUp) return "A";
    if (!iUp && !mUp && !rUp && !pUp && dist(tip.i, tip.t) > 0.05 && dist(tip.i, tip.t) < 0.15) return "C";
    if (iUp && !mUp && !rUp && !pUp && dist(tip.m, tip.t) < 0.05) return "D";
    if (!iUp && !mUp && !rUp && !pUp && !tUp && dist(tip.i, tip.t) < 0.05) return "E";
    if (!iUp && mUp && rUp && pUp && dist(tip.i, tip.t) < 0.05) return "F";
    if (!iUp && !mUp && !rUp && !pUp && dist(tip.i, mcp.i) > 0.05 && dist(tip.i, tip.t) > 0.05) return "G";
    if (!iUp && !mUp && !rUp && !pUp && dist(tip.m, mcp.i) > 0.05) return "H";
    if (!iUp && !mUp && !rUp && pUp && !tUp) return "I";
    if (!iUp && !mUp && !rUp && pUp && tUp) return "J";
    if (iUp && mUp && !rUp && !pUp && tUp) return "K";
    if (iUp && !mUp && !rUp && !pUp && tUp && dist(tip.i, tip.t) > 0.1) return "L";
    if (!iUp && !mUp && !rUp && !pUp && !tUp && landmarks[tip.t].x > landmarks[mcp.m].x) return "M";
    if (!iUp && !mUp && !rUp && !pUp && !tUp && landmarks[tip.t].x > landmarks[mcp.r].x) return "N";
    if (!iUp && !mUp && !rUp && !pUp && dist(tip.i, tip.t) < 0.05 && dist(tip.m, tip.t) < 0.05) return "O";
    // P and Q require tracking pointing downwards, skipping complex depth logic and approximating
    if (iUp && mUp && !rUp && !pUp && dist(tip.i, tip.m) < 0.03) return "R";
    if (!iUp && !mUp && !rUp && !pUp && !tUp && dist(tip.t, mcp.r) < 0.05) return "S";
    if (!iUp && !mUp && !rUp && !pUp && !tUp && dist(tip.t, mcp.i) < 0.05) return "T";
    if (iUp && mUp && !rUp && !pUp && dist(tip.i, tip.m) < 0.04) return "U";
    // V is covered by "Peace"
    if (iUp && mUp && rUp && !pUp) return "W";
    if (!iUp && !mUp && !rUp && !pUp && landmarks[tip.i].y < landmarks[mcp.i].y && landmarks[tip.i].y > landmarks[pip.i].y) return "X";
    if (!iUp && !mUp && !rUp && pUp && tUp) return "Y";
    if (iUp && !mUp && !rUp && !pUp && tUp && dist(tip.i, tip.t) < 0.1) return "Z";

    return "None";
  };

  const predictWebcam = () => {
    if (!videoRef.current || !videoRef.current.srcObject || !recognizerRef.current) return;

    // Check if the video is ready and time advanced
    if (videoRef.current.readyState >= 2 && videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const nowInMs = Date.now();
      const results = recognizerRef.current.detectForVideo(videoRef.current, nowInMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const rawWord = classifyPoseMath(landmarks);

        // Temporal Consistency Filter (Sliding Window)
        historyRef.current.push(rawWord);
        if (historyRef.current.length > 15) historyRef.current.shift();

        let solidWord = "None";
        const validWords = historyRef.current.filter(w => w !== "None");
        
        // Require at least 60% of the last 15 frames to be the same valid sign
        if (validWords.length >= 9) {
          const counts = {};
          let maxCount = 0;
          for (const w of validWords) {
            counts[w] = (counts[w] || 0) + 1;
            if (counts[w] > maxCount) {
              maxCount = counts[w];
              solidWord = w;
            }
          }
          if (maxCount < 9) solidWord = "None";
        }

        console.log(`Raw: ${rawWord} | Solid: ${solidWord}`);

        // Only trigger if we have a solidly held sign and 1.5 seconds have passed
        if (solidWord !== "None" && nowInMs - lastDetectedTimeRef.current > 1500) {
          if (submitTimeoutRef.current) {
            clearTimeout(submitTimeoutRef.current);
            submitTimeoutRef.current = null;
          }
          setIsSubmittingCountdown(false);
          setDetectedSigns(prev => [...prev, solidWord]);
          lastDetectedTimeRef.current = nowInMs;
          
          submitTimeoutRef.current = setTimeout(() => {
            setIsSubmittingCountdown(true);
            submitTimeoutRef.current = setTimeout(() => {
              if (detectedSignsRef.current.length > 0) {
                onSignsDetectedRef.current([...detectedSignsRef.current]);
                setDetectedSigns([]);
              }
              setIsSubmittingCountdown(false);
              submitTimeoutRef.current = null;
              // Clear history after submit so we don't accidentally carry over a stale sign
              historyRef.current = [];
            }, 5000);
          }, 3000);
        }
      } else {
        // If no hand is detected, we still need to record "None" in history so the sliding window decays
        historyRef.current.push("None");
        if (historyRef.current.length > 15) historyRef.current.shift();
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

  const handleClearBuffer = () => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
    setIsSubmittingCountdown(false);
    setDetectedSigns([]);
    historyRef.current = [];
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

        <button
          className="btn"
          style={{ background: '#dc3545', color: 'white' }}
          onClick={handleClearBuffer}
          disabled={detectedSigns.length === 0}
        >
          <Trash2 /> Clear
        </button>
      </div>

      <div className="message-box">
        <div className="message-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Detected Signs Buffer</span>
          {isSubmittingCountdown && (
            <span style={{ color: 'var(--accent)', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
              ⏳ Auto-forming in 5s...
            </span>
          )}
        </div>
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
