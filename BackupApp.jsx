import React, { useState, useRef, useEffect } from 'react';
import logo from './assets/passport-photo.png';

/**
 * CONSTANTS
 * Based on 300 DPI for high-quality printing
 * 33mm x 40mm passport size at 300 DPI
 */
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;
const PHOTO_WIDTH = 390;
const PHOTO_HEIGHT = 472;

const MARGIN_LEFT = 60;
const MARGIN_TOP = 60;

const BRAND_NAME = 'Apex AI Automation';
const SHOP_TAGLINE = 'Remove Background • Smart A4 Layout • Just Print';
const FOOTER_TEXT =
  'Apex AI Automation - Fast passport, visa, ID, and application photo service.';

const BG_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Light Grey', value: '#e5e7eb' }
];

const MIN_FRAME_WIDTH = 160;
const MAX_FRAME_WIDTH = 340;
const FRAME_RATIO = 33 / 40; // width / height
const INITIAL_FRAME_WIDTH = 240;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const Icons = {
  Upload: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Printer: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Download: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Restart: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Grid: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Shield: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
};

export default function App() {
  const [step, setStep] = useState('upload');
  const [originalImage, setOriginalImage] = useState(null);
  const [finalA4Sheet, setFinalA4Sheet] = useState(null);
  const [processStatus, setProcessStatus] = useState('');

  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const [isResizingFrame, setIsResizingFrame] = useState(false);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [photoCount, setPhotoCount] = useState(30);
  const [processMode, setProcessMode] = useState('fast');

  const [frame, setFrame] = useState({
    x: 0,
    y: 0,
    width: INITIAL_FRAME_WIDTH,
    height: Math.round(INITIAL_FRAME_WIDTH / FRAME_RATIO)
  });

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [frameDragStart, setFrameDragStart] = useState({
    x: 0,
    y: 0,
    frameX: 0,
    frameY: 0
  });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: INITIAL_FRAME_WIDTH
  });

  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        if (typeof __firebase_config === 'undefined') return;

        const { initializeApp } = await import(
          'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
        );
        const {
          getAuth,
          signInAnonymously,
          signInWithCustomToken,
          onAuthStateChanged
        } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');

        const firebaseConfig = JSON.parse(__firebase_config);
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, () => {});
      } catch (err) {
        console.warn('Firebase initialization failed:', err);
      }
    };

    initFirebase();
  }, []);

  const setFrameCentered = () => {
    const container = containerRef.current;
    if (!container) return;

    const width = INITIAL_FRAME_WIDTH;
    const height = Math.round(width / FRAME_RATIO);

    setFrame({
      width,
      height,
      x: (container.offsetWidth - width) / 2,
      y: (container.offsetHeight - height) / 2
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Please upload an image smaller than 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setFinalA4Sheet(null);
      setProcessStatus('');
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };

  const resetApp = () => {
    setStep('upload');
    setOriginalImage(null);
    setFinalA4Sheet(null);
    setProcessStatus('');
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setBgColor('#ffffff');
    setPhotoCount(30);
    setProcessMode('fast');
    setIsDraggingImage(false);
    setIsDraggingFrame(false);
    setIsResizingFrame(false);
    setFrame({
      x: 0,
      y: 0,
      width: INITIAL_FRAME_WIDTH,
      height: Math.round(INITIAL_FRAME_WIDTH / FRAME_RATIO)
    });
  };

  const centerImageManually = () => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!container || !img) return;

    const scaleX = INITIAL_FRAME_WIDTH / img.naturalWidth;
    const scaleY = Math.round(INITIAL_FRAME_WIDTH / FRAME_RATIO) / img.naturalHeight;
    const initialScale = Math.max(scaleX, scaleY) * 1.2;

    setScale(initialScale);
    setPosition({
      x: (container.offsetWidth - img.naturalWidth * initialScale) / 2,
      y: (container.offsetHeight - img.naturalHeight * initialScale) / 2
    });

    setFrameCentered();
  };

  const startImageDrag = (e) => {
    if (isDraggingFrame || isResizingFrame) return;
    setIsDraggingImage(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const startFrameDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isResizingFrame) return;

    setIsDraggingFrame(true);
    setFrameDragStart({
      x: e.clientX,
      y: e.clientY,
      frameX: frame.x,
      frameY: frame.y
    });
  };

  const startFrameResize = (e) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizingFrame(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: frame.width
    });
  };

  const handlePointerMove = (e) => {
    const container = containerRef.current;
    if (!container) return;

    if (isDraggingImage) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (isDraggingFrame) {
      const nextX = frameDragStart.frameX + (e.clientX - frameDragStart.x);
      const nextY = frameDragStart.frameY + (e.clientY - frameDragStart.y);

      setFrame((prev) => ({
        ...prev,
        x: clamp(nextX, 0, container.offsetWidth - prev.width),
        y: clamp(nextY, 0, container.offsetHeight - prev.height)
      }));
      return;
    }

    if (isResizingFrame) {
      const deltaX = e.clientX - resizeStart.x;
      const nextWidth = clamp(
        resizeStart.width + deltaX,
        MIN_FRAME_WIDTH,
        MAX_FRAME_WIDTH
      );
      const nextHeight = Math.round(nextWidth / FRAME_RATIO);

      setFrame((prev) => ({
        ...prev,
        width: Math.min(nextWidth, container.offsetWidth - prev.x),
        height: Math.min(nextHeight, container.offsetHeight - prev.y)
      }));
    }
  };

  const stopInteractions = () => {
    setIsDraggingImage(false);
    setIsDraggingFrame(false);
    setIsResizingFrame(false);
  };

  const confirmCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    const sourceX = (frame.x - position.x) / scale;
    const sourceY = (frame.y - position.y) / scale;
    const sourceWidth = frame.width / scale;
    const sourceHeight = frame.height / scale;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      PHOTO_WIDTH,
      PHOTO_HEIGHT
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setStep('process');
    processImage(croppedDataUrl);
  };

  const processImage = async (croppedSrc) => {
    let finalPhotoSrc = croppedSrc;

    try {
      setProcessStatus(
        processMode === 'hd'
          ? 'Removing background in HD mode...'
          : 'Removing background in Fast mode...'
      );

      const formData = new FormData();

      const byteString = atob(croppedSrc.split(',')[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([uint8Array], { type: 'image/jpeg' });
      formData.append('file', blob, 'photo.jpg');
      formData.append('mode', processMode);

      const response = await fetch(
  'http://127.0.0.1:8000/remove-bg',
  {
    method: 'POST',
    body: formData,
  }
);

      if (!response.ok) {
        const errText = await response.text();
        console.error('Background removal failed:', errText);
        throw new Error(errText || 'Background removal failed');
      }

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('image/')) {
        const text = await response.text();
        console.error('Unexpected response:', text);
        throw new Error('Function did not return an image');
      }

      const resultBlob = await response.blob();
      const url = URL.createObjectURL(resultBlob);

      try {
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = PHOTO_WIDTH;
        canvas.height = PHOTO_HEIGHT;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);

        finalPhotoSrc = canvas.toDataURL('image/jpeg', 0.95);
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Background removal failed:', err);
      alert('Background removal failed. Using original cropped image instead.');
      finalPhotoSrc = croppedSrc;
    }

    try {
      setProcessStatus('Generating print sheet...');
      const a4Src = await generateA4Sheet(finalPhotoSrc);
      setFinalA4Sheet(a4Src);
      setStep('result');
    } catch (err) {
      console.error('Sheet generation failed:', err);
      alert('Failed to generate print sheet.');
      setStep('crop');
    }
  };

  const generateA4Sheet = (photoSrc) =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = A4_WIDTH;
      canvas.height = A4_HEIGHT;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const cols = 5;
        const rows = 6;
        const gapX = 50;
        const gapY = 50;
        let drawnCount = 0;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (drawnCount >= photoCount) break;

            const x = MARGIN_LEFT + c * (PHOTO_WIDTH + gapX);
            const y = MARGIN_TOP + r * (PHOTO_HEIGHT + gapY);

            ctx.drawImage(img, x, y, PHOTO_WIDTH, PHOTO_HEIGHT);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, PHOTO_WIDTH, PHOTO_HEIGHT);

            drawnCount++;
          }
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => reject(new Error('Failed to load processed image'));
      img.src = photoSrc;
    });

  const handleDownload = () => {
    if (!finalA4Sheet) return;

    fetch(finalA4Sheet)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Apex_AI_Automation_Passport_Sheet_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Download failed:', err));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Passport Photos</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }

            html, body {
              margin: 0;
              padding: 0;
              width: 210mm;
              height: 297mm;
              background: white;
            }

            .wrapper {
              position: relative;
              width: 210mm;
              height: 297mm;
              background: white;
            }

            .print-image {
              position: absolute;
              top: .5mm;
              left: .5mm;
              width: 204mm;
              height: auto;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="wrapper">
            <img src="${finalA4Sheet}" class="print-image" />
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center gap-4 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <div className="shrink-0">
            <img
              src={logo}
              alt="Apex AI Automation Logo"
              className="h-16 w-auto object-contain bg-white p-1 rounded-md shadow-sm"
            />
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 leading-tight">
              <span className="block text-indigo-600">Instant Passport Photo Maker</span>
              <span className="block text-slate-700 text-xl sm:text-3xl lg:text-4xl">
                Print Ready in Seconds
              </span>
            </h1>

            <p className="mt-2 text-base sm:text-lg lg:text-xl font-semibold text-slate-700 tracking-wide">
              {SHOP_TAGLINE}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-end">
          {step !== 'upload' && (
            <button
              onClick={resetApp}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-all"
            >
              <Icons.Restart /> Start Over
            </button>
          )}
        </div>
      </header>

      <div className="bg-indigo-50 border-b border-indigo-100 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-3 text-sm text-slate-700">
          <div>Upload a clear front-facing photo with good lighting.</div>
          <div>Best for passport, visa, ID card, and application photos.</div>
          <div>Supported formats: JPG, PNG | Max file size: 10 MB.</div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative">
          {step === 'upload' && (
            <div className="w-full max-w-6xl grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
              <div
                className="rounded-3xl p-8 sm:p-12 shadow-xl border-2 border-dashed flex flex-col items-center text-center cursor-pointer transition-all group"
                style={{ backgroundColor: '#ffe5e5', borderColor: '#ff4d4d' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Icons.Upload />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black mb-4 text-slate-800">
                  Upload Customer Photo
                </h2>

                <p className="text-slate-600 text-base sm:text-lg mb-8 max-w-md">
                  Drag and drop or click to upload. Clear portrait photos give the best
                  passport print result.
                </p>

                <button
                  type="button"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Upload Photo
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                <h3 className="font-black text-slate-800 text-xl mb-6">
                  Customer Instructions
                </h3>

                <div className="space-y-4 text-slate-600">
                  <p>• Face should be clearly visible and front-facing.</p>
                  <p>• Use a plain background if possible.</p>
                  <p>• Avoid blurry, dark, or tilted photos.</p>
                  <p>• Please verify official photo rules before submission.</p>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                    <Icons.Shield /> Trust & Safety
                  </div>
                  <p className="text-sm text-slate-600">
                    Photos are processed securely. Please do not upload sensitive photos
                    unless required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'crop' && (
            <div className="w-full h-full max-w-6xl flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-800 min-h-[460px] sm:min-h-[520px]">
                <div
                  ref={containerRef}
                  className="w-full h-full relative overflow-hidden touch-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
                  onPointerDown={startImageDrag}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopInteractions}
                  onPointerLeave={stopInteractions}
                >
                  {originalImage && (
                    <img
                      ref={imageRef}
                      src={originalImage}
                      onLoad={centerImageManually}
                      className="absolute max-w-none pointer-events-none select-none"
                      draggable="false"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'top left',
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`
                      }}
                    />
                  )}

                  <div
                    className="absolute border-2 border-indigo-400 shadow-2xl"
                    style={{
                      left: frame.x,
                      top: frame.y,
                      width: frame.width,
                      height: frame.height,
                      boxShadow: '0 0 0 4000px rgba(0,0,0,0.78)'
                    }}
                    onPointerDown={startFrameDrag}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="absolute top-[10%] w-[70%] h-[75%] border border-white/20 rounded-[50%] flex items-center justify-center">
                        <div className="w-full h-px bg-white/10 absolute top-[35%]"></div>
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter absolute top-2">
                          Head Area
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onPointerDown={startFrameResize}
                      className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center active:scale-95"
                      title="Resize frame"
                    >
                      <span className="block w-3 h-3 border-r-2 border-b-2 border-white"></span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xs mb-6">
                    Photo Adjustments
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>Processing Mode</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setProcessMode('fast')}
                          className={`h-11 rounded-xl font-black text-sm border-2 transition-all ${
                            processMode === 'fast'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          ⚡ Fast
                        </button>

                        <button
                          type="button"
                          onClick={() => setProcessMode('hd')}
                          className={`h-11 rounded-xl font-black text-sm border-2 transition-all ${
                            processMode === 'hd'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          🎯 HD
                        </button>
                      </div>

                      <p className="text-xs text-slate-500">
                        Fast is quicker. HD gives cleaner edges but takes more time.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>Background</span>
                      </div>

                      <div className="flex gap-2">
                        {BG_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setBgColor(color.value)}
                            className={`flex-1 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                              bgColor === color.value
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-slate-100 hover:border-slate-300'
                            }`}
                            title={color.name}
                            type="button"
                          >
                            <div
                              className="w-4 h-4 rounded-full border border-slate-200"
                              style={{ backgroundColor: color.value }}
                            ></div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>Photo Scale</span>
                        <span className="text-indigo-600">{Math.round(scale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.01"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>Brightness</span>
                        <span className="text-indigo-600">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="1"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>Contrast</span>
                        <span className="text-indigo-600">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="1"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span className="flex items-center gap-1">
                          <Icons.Grid /> Photos
                        </span>
                        <span className="text-indigo-600">{photoCount}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={photoCount}
                        onChange={(e) => setPhotoCount(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 text-sm text-slate-600">
                  Move the photo by dragging the image. Move the frame by dragging the
                  frame. Resize the frame using the bottom-right handle.
                </div>

                <button
                  onClick={confirmCrop}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Process Print Sheet <Icons.ArrowRight />
                </button>
              </div>
            </div>
          )}

          {step === 'process' && (
            <div className="bg-white p-10 sm:p-16 rounded-[3rem] shadow-2xl flex flex-col items-center text-center">
              <div className="w-20 h-20 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                Processing Photo
              </h3>
              <p className="text-slate-400 font-medium">{processStatus}</p>
            </div>
          )}

          {step === 'result' && (
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 h-full pb-8">
              <div className="flex-1 bg-white shadow-2xl rounded-3xl p-5 sm:p-10 overflow-auto flex flex-col items-center border border-slate-200">
                <div className="w-full text-center mb-6">
                  <h2 className="text-2xl font-black text-slate-800">Print Preview</h2>
                  <p className="text-slate-500">
                    Ready for passport, visa, ID, and application photo printing.
                  </p>
                </div>

                <div className="bg-slate-200/30 p-4 sm:p-12 shadow-inner rounded-2xl border-2 border-dashed border-slate-300">
                  <img
                    src={finalA4Sheet}
                    className="max-w-full h-auto shadow-2xl border bg-white"
                    alt="A4 Sheet Preview"
                  />
                </div>
              </div>

              <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xs mb-6">
                    Print Station
                  </h3>

                  <div className="space-y-4">
                    <button
                      onClick={handlePrint}
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      <Icons.Printer /> Print Sheet
                    </button>

                    <button
                      onClick={handleDownload}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
                    >
                      <Icons.Download /> Download JPEG
                    </button>

                    <button
                      onClick={resetApp}
                      className="w-full bg-slate-100 text-slate-800 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      New Customer Photo
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-sm text-slate-600">
                  <p className="font-bold text-slate-800 mb-2">{BRAND_NAME}</p>
                  <p>Fast passport, visa, ID, and application photo service.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t px-4 sm:px-6 lg:px-8 py-4 text-sm text-slate-600">
        <div className="max-w-7xl mx-auto text-center">{FOOTER_TEXT}</div>
      </footer>
    </div>
  );
}