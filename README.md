<div align="center">

  <img src="./assets/logo.png" alt="SignBridge V2 logo — a hand signing connected to a speech bubble through a bridge, symbolizing AI-powered communication between deaf and hearing users" width="180" />

  <h1>SignBridge V2</h1>

  <p><strong>AI-powered real-time two-way sign language communication bridge</strong></p>

  <p>
    Breaking the barrier between deaf and hearing communities through<br/>
    computer vision, machine learning, and natural language processing.
  </p>

  <br/>

  <a href="https://github.com/Pro1943/SignBridgeV2/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Pro1943/SignBridgeV2?style=flat-square&color=3B82F6&label=License" alt="MIT License" /></a>
  <img src="https://img.shields.io/github/repo-size/Pro1943/SignBridgeV2?style=flat-square&color=8B5CF6&label=Repo%20Size" alt="Repository size" />
  <a href="https://github.com/Pro1943/SignBridgeV2/stargazers"><img src="https://img.shields.io/github/stars/Pro1943/SignBridgeV2?style=flat-square&color=F59E0B&label=Stars" alt="GitHub stars" /></a>
  <a href="https://signbridgev2.vercel.app"><img src="https://img.shields.io/badge/▶_Live_Demo-signbridgev2.vercel.app-00E676?style=flat-square&logo=vercel&logoColor=white" alt="Live demo at signbridgev2.vercel.app" /></a>

  <br/><br/>

  <a href="https://signbridgev2.vercel.app">Live Demo</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#-features">Features</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#-quick-start">Quick Start</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#-system-architecture">Architecture</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://github.com/Pro1943/Ml-API">ML API Repo</a>

</div>

<br/>

<div align="center">
  <img src="./assets/screenshot_full_ui.png" alt="SignBridge V2 full application interface showing the webcam sign detection panel on the left, AI translation output on the upper right, and speech-to-text input on the lower right — all rendered in a dark editorial UI" width="800" />
  <br/>
  <sub><em>SignBridge V2 — Two-way communication interface in action</em></sub>
</div>

<br/>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Two-Way Communication](#-two-way-communication)
- [System Architecture](#-system-architecture)
- [Built With](#-built-with)
- [How It Works](#-how-it-works)
- [ML Training Pipeline](#-ml-training-pipeline)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Model Performance](#-model-performance)
- [In Action](#-in-action)
- [GitHub Stats](#-github-stats)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 💡 About

**SignBridge V2** is a full-stack, AI-powered communication system that enables real-time, two-way conversation between deaf and hearing individuals.

A deaf user signs ASL letters through their webcam. MediaPipe extracts 21 hand landmarks per frame, a Random Forest classifier identifies each letter, and an LLM reconstructs the detected sequence into a natural English sentence — spoken aloud via Text-to-Speech. In the reverse direction, a hearing user speaks into their microphone, and the browser's Speech-to-Text API transcribes the audio into on-screen text for the deaf user to read.

> **No plugins. No installs. No sign-up.** Everything runs in the browser with serverless API backends.

---

## ✨ Features

| Feature | Description |
|:--------|:------------|
| 🤟 **Real-Time Sign Detection** | MediaPipe WASM hand-tracking at ~15 fps with ML-powered ASL classification |
| 🧠 **AI Grammar Reconstruction** | ASI:One LLM transforms raw sign sequences into natural sentences |
| 🔊 **Text-to-Speech Output** | Premium voice synthesis with automatic spoken output for hearing users |
| 🎙️ **Speech-to-Text Input** | Browser-native speech recognition for hearing-to-deaf communication |
| ⏱️ **Smart Auto-Submit** | 3-second idle detection + 5-second countdown for hands-free operation |
| 🛡️ **Input Sanitization** | Client-side sign sanitization and server-side validation against prompt injection |
| ♿ **Accessibility-First** | WCAG 2.1 skip-nav, ARIA live regions, semantic HTML, descriptive alt text |
| 🌙 **Dark Editorial UI** | Medical-grade dark interface with Space Grotesk + DM Mono typography |
| 🔒 **Content Security Policy** | CSP headers, preconnect hints, and non-blocking font loading |
| ⚡ **Serverless Architecture** | Zero-infra deployment across Vercel with cold-start-optimized APIs |

---

## 🔄 Two-Way Communication

<div align="center">

| Direction | **Deaf → Hearing** | **Hearing → Deaf** |
|:---------:|:------------------:|:------------------:|
| **Input** | ASL hand signs via webcam | Voice via microphone |
| **Processing** | MediaPipe → ML API → LLM | Web Speech API (STT) |
| **Output** | Spoken sentence (TTS) 🔊 | Text transcript on screen 📝 |
| **Latency** | ~2–4 seconds end-to-end | Real-time |

</div>

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Browser["🖥️ Browser Client — React 19 + Vite 8"]
        CAM[Webcam Feed]
        MP[MediaPipe WASM]
        BUF[Sign Buffer]
        TTS[Text-to-Speech]
        MIC[Microphone]
        STT[Web Speech API]
        TXT[Transcript Display]
    end

    subgraph MLAPI["🤖 ML API — FastAPI + scikit-learn"]
        NORM[Normalize Landmarks]
        RF[Random Forest Classifier]
    end

    subgraph BACKEND["⚡ Grammar Backend — Next.js API Route"]
        VAL[Input Validation]
        LLM[ASI:One LLM]
    end

    CAM --> MP
    MP -->|21 landmarks x,y,z| NORM
    NORM --> RF
    RF -->|sign + confidence| BUF
    BUF -->|auto-submit| VAL
    VAL --> LLM
    LLM -->|formed sentence| TTS
    MIC --> STT
    STT --> TXT

    style Browser fill:#0D1117,stroke:#30363D,color:#E6EDF3
    style MLAPI fill:#1A1F2E,stroke:#8B5CF6,color:#E6EDF3
    style BACKEND fill:#1A1F2E,stroke:#F59E0B,color:#E6EDF3
```

<div align="center">

| Service | Deployment | Repository |
|:--------|:----------:|:----------:|
| **Frontend** (React + Vite) | [signbridgev2.vercel.app](https://signbridgev2.vercel.app) | This repo |
| **ML API** (FastAPI + scikit-learn) | Vercel Serverless | [Pro1943/Ml-API](https://github.com/Pro1943/Ml-API) |
| **Grammar Backend** (Next.js) | Vercel Serverless | Private |

</div>

---

## 🛠️ Built With

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript_ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)

### Machine Learning

![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white)

### Backend & Infrastructure

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=flat-square&logo=google&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F56565?style=flat-square&logo=lucide&logoColor=white)

</div>

---

## ⚡ How It Works

### Sign-to-Speech Pipeline

```mermaid
sequenceDiagram
    participant U as 🤟 Deaf User
    participant C as 📷 Camera
    participant MP as MediaPipe
    participant ML as ML API
    participant B as Sign Buffer
    participant AI as ASI:One LLM
    participant S as 🔊 Speaker

    U->>C: Show ASL hand sign
    C->>MP: Video frame at ~15 fps
    MP->>MP: Extract 21 hand landmarks
    MP->>ML: POST /classify (landmarks)
    ML->>ML: Normalize + Random Forest predict
    ML-->>B: sign: "H", confidence: 0.94
    Note over B: Accumulate signs in buffer
    Note over B: 3s idle → 5s countdown
    B->>AI: POST /api/signbridge (words)
    AI->>AI: Grammar reconstruction
    AI-->>S: "Hello, how are you?"
    S->>S: Speak sentence aloud
```

### Speech-to-Text Pipeline

```mermaid
sequenceDiagram
    participant H as 🗣️ Hearing User
    participant M as 🎙️ Microphone
    participant W as Web Speech API
    participant D as 📝 Display

    H->>M: Speak naturally
    M->>W: Audio stream
    W->>W: Real-time transcription
    W-->>D: Display transcript
    Note over D: Deaf user reads text
```

---

## 🔬 ML Training Pipeline

```mermaid
flowchart LR
    A["📁 Kaggle ASL Dataset"] --> B["🖼️ Image Collection"]
    B --> C["✋ MediaPipe Landmark Extraction"]
    C --> D["📊 21x3 Coordinate Vectors"]
    D --> E["⚖️ Normalization and Centering"]
    E --> F["✂️ Train/Test Split — 80/20"]
    F --> G["🌲 Random Forest Training — 100 Trees"]
    G --> H["💾 sign_classifier.pkl — 11.3 MB"]
    H --> I["🚀 FastAPI Inference Server"]
```

> **ML API Repository:** The complete training pipeline, model artifacts, and inference server are maintained at **[Pro1943/Ml-API](https://github.com/Pro1943/Ml-API)**.

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|:-----|:--------|:--------|
| **Node.js** | ≥ 18.x | Frontend dev server |
| **npm** | ≥ 9.x | Package management |
| **Git** | Latest | Version control |
| **Modern Browser** | Chrome / Edge | WebRTC + Speech APIs |

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Pro1943/SignBridgeV2.git
cd SignBridgeV2/frontend

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Create .env file in frontend/
cp .env.example .env
```

```env
# frontend/.env
VITE_BACKEND_URL=https://backend-snowy-sigma-85.vercel.app/api/signbridge
VITE_ML_API_URL=http://localhost:8000/classify
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. (Optional) Run ML API Locally

```bash
# In a separate terminal
git clone https://github.com/Pro1943/Ml-API.git
cd Ml-API
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> **Note:** The live demo at [signbridgev2.vercel.app](https://signbridgev2.vercel.app) is fully deployed — local setup is only needed for development.

---

## 📁 Project Structure

```
SignBridgeV2/
├── assets/                          # Static assets
│   ├── logo.png                     # Project logo
│   ├── hand_landmarker.task         # MediaPipe model binary (7.8 MB)
│   ├── screenshot_full_ui.png       # Full interface preview
│   ├── screenshot_sign_detection.png
│   ├── screenshot_ai_output.png
│   ├── screenshot_speech_to_text.png
│   └── screenshot_auto_submit.png
│
├── frontend/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebcamSignDetector.jsx   # Camera + MediaPipe + ML integration
│   │   │   └── SpeechRecognition.jsx    # Browser STT component
│   │   ├── App.jsx                  # Root component + TTS + AI orchestration
│   │   ├── index.css                # Full design system (13 KB)
│   │   └── main.jsx                 # React DOM entry point
│   ├── public/                      # Static public assets
│   ├── index.html                   # HTML shell with CSP + font preloading
│   ├── package.json
│   ├── vite.config.js
│   └── .env                         # Environment variables (gitignored)
│
├── LICENSE                          # MIT License
├── README.md                        # You are here
└── report.md                        # Comprehensive codebase audit (58 findings)
```

> **Companion Repository:** The ML classification API lives at [**Pro1943/Ml-API**](https://github.com/Pro1943/Ml-API) — a standalone FastAPI service with training pipeline, model artifacts, and inference endpoints.

---

## 📡 API Reference

### ML Classification API

> **Base URL:** `https://github.com/Pro1943/Ml-API` · Deployed on Vercel Serverless

| Method | Endpoint | Body | Response | Description |
|:------:|:---------|:-----|:---------|:------------|
| `POST` | `/classify` | `{ "landmarks": [{"x","y","z"}...] }` | `{ "sign": "A", "confidence": 0.94 }` | Classify 21 hand landmarks into ASL sign |
| `GET` | `/` | — | `{ "status": "ok" }` | Health check |

<details>
<summary><strong>Example Request</strong></summary>

```json
{
  "landmarks": [
    { "x": 0.52, "y": 0.71, "z": -0.03 },
    { "x": 0.49, "y": 0.65, "z": -0.01 },
    "... (21 landmarks total)"
  ]
}
```

</details>

### Grammar Backend API

> **Base URL:** Vercel Serverless · Private deployment

| Method | Endpoint | Body | Response | Description |
|:------:|:---------|:-----|:---------|:------------|
| `POST` | `/api/signbridge` | `{ "words": ["H","E","L","L","O"] }` | `{ "sentence": "Hello!" }` | Reconstruct sign sequence into natural sentence via ASI:One LLM |
| `OPTIONS` | `/api/signbridge` | — | CORS preflight | CORS preflight handler |

---

## 📊 Model Performance

The Random Forest classifier (100 estimators) achieves the following metrics on the test set:

<div align="center">

| Metric | Score |
|:-------|:-----:|
| **Overall Accuracy** | 93% |
| **Macro Avg Precision** | 0.91 |
| **Macro Avg Recall** | 0.89 |
| **Macro Avg F1-Score** | 0.89 |
| **Classes Supported** | A–Z (excluding J, Z) + 0–9 |
| **Model Size** | 11.3 MB |
| **Inference Latency** | < 50ms |

</div>

> **Known Limitations:**
> - Letters **J** and **Z** require motion trajectories — single-frame classification cannot capture dynamic signs.
> - Letter **T** has insufficient training samples and may show reduced accuracy.
> - Model trained on a single dataset (Kaggle ASL) — accuracy may vary with different skin tones, lighting, and hand orientations.

---

## 📸 In Action

<div align="center">

<table>
  <tr>
    <td align="center">
      <img src="./assets/screenshot_sign_detection.png" alt="Webcam panel showing the camera feed area with Start Camera, Form Sentence, and Clear action buttons, plus the detected signs buffer below" width="380" />
      <br/><sub><strong>Sign Detection Panel</strong></sub>
    </td>
    <td align="center">
      <img src="./assets/screenshot_ai_output.png" alt="AI Translation section displaying a reconstructed English sentence generated from detected ASL sign letters" width="380" />
      <br/><sub><strong>AI Translation Output</strong></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./assets/screenshot_speech_to_text.png" alt="Speech-to-text section with a Start Listening button and live transcript area for hearing user voice input" width="380" />
      <br/><sub><strong>Speech-to-Text Input</strong></sub>
    </td>
    <td align="center">
      <img src="./assets/screenshot_auto_submit.png" alt="Auto-submit countdown timer badge that appears after 3 seconds of idle detection, counting down from 5 before automatic sentence formation" width="380" />
      <br/><sub><strong>Auto-Submit Countdown</strong></sub>
    </td>
  </tr>
</table>

</div>

---

## 📈 GitHub Stats

<div align="center">

  <img src="https://github-readme-stats.vercel.app/api?username=Pro1943&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=3B82F6&icon_color=F59E0B&text_color=E6EDF3" alt="Pro1943 GitHub stats card showing total stars, commits, PRs, issues, and contributions" height="180" />
  &nbsp;&nbsp;
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Pro1943&layout=compact&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=3B82F6&text_color=E6EDF3" alt="Pro1943 most used programming languages pie chart" height="180" />

</div>

<div align="center">

  <img src="https://github-readme-streak-stats.herokuapp.com/?user=Pro1943&theme=tokyonight&hide_border=true&background=0D1117&ring=3B82F6&fire=F59E0B&currStreakLabel=E6EDF3" alt="Pro1943 GitHub streak stats showing current streak, longest streak, and total contributions" height="180" />

</div>

---

## 🗺️ Roadmap

- [x] Real-time ASL alphabet detection (A–Z static signs)
- [x] AI-powered grammar reconstruction via LLM
- [x] Two-way communication (Sign ↔ Speech)
- [x] Auto-submit with idle detection + countdown
- [x] Dark editorial UI with Space Grotesk typography
- [x] Content Security Policy + font preloading
- [x] WCAG 2.1 Level A accessibility baseline
- [ ] Hand skeleton overlay on webcam feed
- [ ] Dynamic sign detection (J, Z) via temporal models
- [ ] Multi-hand tracking support
- [ ] Conversation history persistence (localStorage)
- [ ] Light mode toggle
- [ ] PWA with offline support
- [ ] Model retraining pipeline automation
- [ ] Cross-validation + hyperparameter tuning
- [ ] Support for additional sign languages (BSL, ISL)

---

## 🤝 Contributing

Contributions are welcome! This is a solo project, but community input is valued.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request


---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

## 🏆 Built for the ASI:One AI Hackathon

<div align="center">

  <br/>

  <img src="https://img.shields.io/badge/🏆_Built_for-ASI%3AOne_AI_Hackathon-FFD700?style=for-the-badge" alt="Built for ASI:One AI Hackathon" />

  <br/><br/>

  <p>
    <strong>SignBridge V2</strong> was proudly built for the <strong>ASI:One AI Hackathon</strong> —<br/>
    pushing the boundaries of AI-powered accessibility and inclusive communication.
  </p>

  <p>
    The mission: prove that a single developer, armed with modern AI tools,<br/>
    can build a production-grade accessibility platform in hackathon time.
  </p>

  <br/>

</div>

---

## 🙏 Acknowledgments

- [**MediaPipe**](https://developers.google.com/mediapipe) — Google's on-device ML framework for hand landmark detection
- [**ASI:One**](https://asi1.ai) — LLM API powering grammar reconstruction
- [**Kaggle ASL Dataset**](https://www.kaggle.com/datasets/ayuraj/asl-dataset) — Training data for the sign classifier
- [**Vercel**](https://vercel.com) — Serverless deployment platform
- [**Shields.io**](https://shields.io) — Dynamic badge generation
- [**GitHub Readme Stats**](https://github.com/anuraghazra/github-readme-stats) — Dynamic stats cards

---

<div align="center">

  <img src="./assets/logo.png" alt="SignBridge V2 logo" width="60" />

  <br/>

  <sub>Made with ❤️ by <a href="https://github.com/Pro1943">Abir Saha</a></sub>

  <br/><br/>

  <a href="https://signbridgev2.vercel.app"><img src="https://img.shields.io/badge/Try_SignBridge_V2-00E676?style=for-the-badge&logo=vercel&logoColor=white" alt="Try SignBridge V2 live demo" /></a>

</div>
