import React, { useState, useRef } from 'react';
import logo from './assets/passport-photo.png';

// A4 canvas and passport-photo dimensions (pixels at the intended print resolution)
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;
const PHOTO_WIDTH = 390;
const PHOTO_HEIGHT = 472;
const MARGIN_LEFT = 60;
const MARGIN_TOP = 60;

const BRAND_NAME = 'Apex AI Automation';
const SHOP_TAGLINE = 'Remove background · Smart A4 layout · Just print';
const FOOTER_TEXT =
  'Apex AI Automation - Fast passport, visa, ID and application photos.';

const BG_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Light grey', value: '#e5e7eb' }
];

const MIN_FRAME_WIDTH = 160;
const MAX_FRAME_WIDTH = 340;
const FRAME_RATIO = 33 / 40;
const INITIAL_FRAME_WIDTH = 240;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const ICONS = {
  upload: 'M12 16V4m0 0L7 9m5-5 5 5M4 20h16',
  download: 'M12 4v12m0 0 5-5m-5 5-5-5M4 20h16',
  print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z',
  restart: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5',
  check: 'M5 12l5 5 9-10'
};

const Icon = ({ name, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={ICONS[name]} />
  </svg>
);

const Slider = ({ label, display, ...rest }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-semibold">{label}</span>
      <span className="font-medium text-[#2457D6]">{display}</span>
    </div>
    <input
      type="range"
      {...rest}
      className="w-full cursor-pointer accent-[#2457D6]"
    />
  </div>
);

const Seg = ({ options, value, onChange }) => (
  <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#EEF2F9] p-1">
    {options.map(([v, t]) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        className={`h-10 rounded-lg text-sm font-semibold transition ${
          value === v
            ? 'bg-[#2457D6] text-white'
            : 'text-[#51607F] hover:bg-white'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

export default function App() {
  const [step, setStep] = useState('upload');
  const [originalImage, setOriginalImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [finalA4Sheet, setFinalA4Sheet] = useState(null);
  const [processStatus, setProcessStatus] = useState('');
  const [isDropping, setIsDropping] = useState(false);

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

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG or PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Please upload an image smaller than 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setFileName(file.name);
      setFinalA4Sheet(null);
      setProcessStatus('');
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropping(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const resetApp = () => {
    setStep('upload');
    setOriginalImage(null);
    setFileName('');
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
    const scaleY =
      Math.round(INITIAL_FRAME_WIDTH / FRAME_RATIO) / img.naturalHeight;
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

      const response = await fetch('https://mona-art-photo-easyprint.onrender.com/remove-bg', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Background removal failed:', errText);
        throw new Error(errText || 'Background removal failed');
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('image/')) {
        const text = await response.text();
        console.error('Unexpected response:', text);
        throw new Error(text || 'Function did not return an image');
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
        ctx.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
        ctx.drawImage(img, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
        finalPhotoSrc = canvas.toDataURL('image/jpeg', 0.95);
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Background removal failed:', err);
      alert(
        'Background removal failed. Using original cropped image instead.'
      );
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
            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; background: white; }
            .wrapper { position: relative; width: 210mm; height: 297mm; background: white; }
            .print-image { position: absolute; top: .5mm; left: .5mm; width: 204mm; height: auto; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="wrapper"><img src="${finalA4Sheet}" class="print-image" /></div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const stepIndex = { upload: 0, crop: 1, process: 2, result: 3 }[step];
  const railSteps = [
    ['Upload photo', fileName || 'Choose a customer photo'],
    ['Crop and adjust', 'Frame the face'],
    ['Remove background', processMode === 'hd' ? 'HD quality' : 'Fast quality'],
    ['Print sheet', `A4 | ${photoCount} photos`]
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F4F6FB] text-[#1B2440]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <style>{`
        #root{max-width:none!important;margin:0!important;padding:0!important;text-align:left!important;width:100%!important}
        body{display:block!important;margin:0!important;min-width:0!important}
      `}</style>

      {/* Redesigned header */}
      <header className="min-h-[88px] shrink-0 bg-gradient-to-r from-[#F8FAFC] to-[#B8E6E2] flex flex-wrap items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Apex AI Automation"
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="text-[#0B1730] font-bold text-lg sm:text-xl">
              Apex AI Automation
            </h1>
            <p className="text-xs text-[#52647A]">
              Instant Passport Photo Maker
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base font-medium text-[#111827]">
          <a href="#features" className="hover:text-[#287C91]">Features</a>
          <a href="#pricing" onClick={(e) => e.preventDefault()} className="hover:text-[#287C91]">Pricing</a>
          <a href="#api" onClick={(e) => e.preventDefault()} className="hover:text-[#287C91]">API</a>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-[#102D50] px-5 py-3 font-semibold text-white transition hover:bg-[#1B456F]"
          >
            Get Started
          </button>
          {step !== 'upload' && (
            <button
              onClick={resetApp}
              className="flex items-center gap-2 rounded-xl border border-[#9AAFC0] px-4 py-3 hover:bg-white/60"
            >
              <Icon name="restart" size={14} /> Start over
            </button>
          )}
        </nav>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Progress sidebar retained for editing, processing and result screens */}
        {step !== 'upload' && (
          <aside className="hidden lg:flex w-60 shrink-0 flex-col justify-between bg-white border-r border-[#E1E6F0] p-4">
            <div>
              <p className="text-sm font-semibold px-2 pb-3">Steps</p>
              <div className="space-y-2">
                {railSteps.map(([title, sub], i) => {
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div
                      key={title}
                      className={`flex items-center gap-3 rounded-xl p-3 ${active ? 'bg-[#EAF0FF]' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                          done
                            ? 'bg-[#1F9D6B] text-white'
                            : active
                            ? 'bg-[#2457D6] text-white'
                            : 'border-2 border-[#C5CEE0] text-[#6B7794]'
                        }`}
                      >
                        {done ? <Icon name="check" size={16} /> : i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${!done && !active ? 'text-[#6B7794]' : ''}`}>
                          {title}
                        </p>
                        <p className="text-xs text-[#6B7794] truncate">{sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl bg-[#F4F6FB] p-4 text-sm text-[#3C4766] space-y-2">
              <p className="font-semibold">Good photo checklist</p>
              <p>• Face front, eyes open</p>
              <p>• Plain, light background</p>
              <p>• No glare, no tilt</p>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0 flex">
          {/* Redesigned upload landing page */}
          {step === 'upload' && (
            <div className="min-h-full w-full bg-gradient-to-br from-[#F7FAFC] via-[#EDF7F7] to-[#B0E3DF] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
              <div className="mx-auto grid max-w-[1450px] items-center gap-10 xl:grid-cols-2 xl:gap-12">
                <section className="space-y-7">
                  <div>
                    <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-[#08152E] sm:text-5xl lg:text-6xl">
                      Perfect Passport Photos, Instantly
                    </h2>
                    <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#27364B] sm:text-xl">
                      Your AI-powered studio for official photo standards.
                      Remove backgrounds, optimize layouts, and get print-ready
                      results in seconds.
                    </p>
                  </div>

                  <div id="features" className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div>
                      <h3 className="font-bold text-[#101D33]"><span className="mr-2 text-[#397F95]">●</span>Remove Background</h3>
                      <p className="mt-1 text-sm text-[#46566A]">Replace the background with your chosen colour.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#101D33]"><span className="mr-2 text-[#397F95]">●</span>Photo Adjustments</h3>
                      <p className="mt-1 text-sm text-[#46566A]">Crop, reposition, zoom and adjust image quality.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#101D33]"><span className="mr-2 text-[#397F95]">●</span>Print-Ready Layouts</h3>
                      <p className="mt-1 text-sm text-[#46566A]">Arrange multiple photos on an A4 sheet.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#ACDCD9] p-5">
                      <div className="text-2xl">▧</div>
                      <h3 className="mt-2 font-bold text-[#10243A]">All Formats</h3>
                      <p className="mt-1 text-sm text-[#33495A]">JPG and PNG image uploads.</p>
                    </div>
                    <div className="rounded-2xl bg-[#ACDCD9] p-5">
                      <div className="text-2xl">♙</div>
                      <h3 className="mt-2 font-bold text-[#10243A]">Local Processing</h3>
                      <p className="mt-1 text-sm text-[#33495A]">Your original photo is loaded on this computer.</p>
                    </div>
                    <div className="rounded-2xl bg-[#ACDCD9] p-5">
                      <div className="text-2xl">▤</div>
                      <h3 className="mt-2 font-bold text-[#10243A]">Easy Printing</h3>
                      <p className="mt-1 text-sm text-[#33495A]">Preview, download and print your A4 sheet.</p>
                    </div>
                  </div>
                </section>

                <section className="w-full min-w-0">
                  <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-[#D8E3E7] px-5 py-5 sm:px-7">
                      <h2 className="text-xl font-bold text-[#101827] sm:text-2xl">Upload and Process</h2>
                      <div className="rounded-lg bg-[#E7EFF2] p-3 text-[#173C55]"><Icon name="upload" size={21} /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="space-y-5 p-5 sm:p-7">
                        <h3 className="text-lg font-bold text-[#152033]">Instructions</h3>
                        <ul className="space-y-4 text-sm leading-relaxed text-[#263548]">
                          <li className="flex gap-3"><span className="text-lg">☺</span><span>Face should be clearly visible and front-facing.</span></li>
                          <li className="flex gap-3"><span className="text-lg">▧</span><span>Use a plain background if possible.</span></li>
                          <li className="flex gap-3"><span className="text-lg">◇</span><span>Avoid blurry, dark or tilted photos.</span></li>
                          <li className="flex gap-3"><span className="text-lg">▤</span><span>Verify the official photo rules before submission.</span></li>
                        </ul>
                        <div className="rounded-xl border border-[#D5DDE4] bg-[#F0F3F5] p-4">
                          <h3 className="font-bold text-[#172033]">Photo processing</h3>
                          <p className="mt-1 text-sm text-[#536174]">Upload a photo to start editing and prepare your print sheet.</p>
                          <span className="mt-3 inline-block rounded-full bg-[#D9E8DF] px-3 py-1 text-xs font-semibold text-[#24583D]">Ready to upload</span>
                        </div>
                      </div>

                      <div className="border-t border-[#D8E3E7] p-5 md:border-l md:border-t-0 sm:p-7">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDropping(true); }}
                          onDragLeave={() => setIsDropping(false)}
                          onDrop={handleDrop}
                          className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition sm:min-h-[380px] ${
                            isDropping
                              ? 'border-[#287C91] bg-[#D8F3EF]'
                              : 'border-[#A8BBC5] bg-gradient-to-b from-[#F0F4F7] to-[#E4EBEF] hover:border-[#287C91] hover:bg-[#E4F4F2]'
                          }`}
                        >
                          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#426477] shadow-sm">
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 16V4m-5 5 5-5 5 5" />
                              <path d="M20 16.5v2A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-2" />
                              <path d="M5 12a7 7 0 0 1 14 0" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-[#243347]">Drag &amp; drop image here</h3>
                          <p className="mt-2 text-sm text-[#5C6B7B]">or click below to browse</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-6 rounded-xl bg-[#102D50] px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-[#1D496E]"
                          >
                            Choose Photo
                          </button>
                          <p className="mt-4 text-xs text-[#687789]">JPG or PNG · Maximum 10 MB</p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/jpeg,image/png"
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-4 rounded-2xl border border-white/80 bg-white/75 p-5 shadow-lg backdrop-blur-xl sm:p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D5ECE8] text-2xl">♢</div>
                    <div>
                      <h3 className="font-bold text-[#152033]">Trust &amp; Safety</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#536174]">
                        Your photo is loaded locally. Background removal uses your configured processing service when available. Avoid uploading sensitive photos to services you do not trust.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Crop editor: original controls and interactions retained */}
          {step === 'crop' && (
            <div className="flex-1 flex flex-col lg:flex-row min-w-0">
              <div className="flex-1 min-w-0 bg-[#0E1626]">
                <div className="h-12 flex items-center px-6 text-sm text-[#A9B6D0] bg-[#182236]">
                  Drag the photo to move it. Drag the frame to reposition it. Use the corner handle to resize.
                </div>
                <div
                  ref={containerRef}
                  className="relative overflow-hidden touch-none h-[calc(100vh-184px)] min-h-[480px]"
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
                      alt="Customer"
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
                    className="absolute border-2 border-[#6FA0FF]"
                    style={{
                      left: frame.x,
                      top: frame.y,
                      width: frame.width,
                      height: frame.height,
                      boxShadow: '0 0 0 4000px rgba(0,0,0,0.72)'
                    }}
                    onPointerDown={startFrameDrag}
                  >
                    <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
                      <div className="mt-[10%] w-[70%] h-[75%] border border-white/30 rounded-[50%]" />
                    </div>
                    <button
                      type="button"
                      onPointerDown={startFrameResize}
                      title="Resize frame"
                      className="absolute -bottom-3 -right-3 w-7 h-7 rounded-md bg-white border-2 border-[#2457D6] shadow-lg active:scale-95"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[400px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-[#E1E6F0] p-6 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-112px)]">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Removal quality</p>
                  <Seg options={[['fast', 'Fast'], ['hd', 'HD']]} value={processMode} onChange={setProcessMode} />
                  <p className="text-xs text-[#6B7794]">HD gives cleaner hair edges but takes longer.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Background colour</p>
                  <div className="flex gap-3">
                    {BG_COLORS.map((color) => (
                      <button key={color.value} type="button" onClick={() => setBgColor(color.value)} className="flex flex-col items-center gap-1">
                        <span
                          className={`block w-[72px] h-12 rounded-xl ${bgColor === color.value ? 'border-[3px] border-[#2457D6]' : 'border border-[#C5CEE0]'}`}
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-xs text-[#6B7794]">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Slider label="Zoom" display={`${Math.round(scale * 100)}%`} min="0.1" max="5" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
                <Slider label="Brightness" display={`${brightness}%`} min="50" max="150" step="1" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value, 10))} />
                <Slider label="Contrast" display={`${contrast}%`} min="50" max="150" step="1" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value, 10))} />
                <Slider label="Photos on sheet" display={photoCount} min="1" max="30" step="1" value={photoCount} onChange={(e) => setPhotoCount(parseInt(e.target.value, 10))} />

                <button onClick={confirmCrop} className="w-full h-14 rounded-2xl bg-[#F2A93B] text-[#0F1B3D] text-lg font-bold hover:bg-[#E89B26] active:scale-[0.99] transition">
                  Make print sheet
                </button>
              </div>
            </div>
          )}

          {/* Processing screen */}
          {step === 'process' && (
            <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-[#F7FAFC] to-[#D8EFED]">
              <div className="bg-white/90 rounded-3xl shadow-xl px-8 sm:px-16 py-14 flex flex-col items-center text-center">
                <div className="w-20 h-20 border-4 border-[#D8EFED] border-t-[#2457D6] rounded-full animate-spin mb-8" />
                <h3 className="text-2xl font-bold mb-2">Processing photo</h3>
                <p className="text-[#6B7794]">{processStatus}</p>
              </div>
            </div>
          )}

          {/* Result and printing screen */}
          {step === 'result' && (
            <div className="flex-1 flex flex-col lg:flex-row min-w-0 bg-gradient-to-br from-[#F7FAFC] to-[#E4F4F2]">
              <div className="flex-1 min-w-0 p-6 lg:p-10 overflow-auto flex flex-col items-center">
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-bold">Print preview</h2>
                  <p className="text-[#6B7794]">A4 sheet, {photoCount} photos, ready to print.</p>
                </div>
                <img
                  src={finalA4Sheet}
                  alt="A4 sheet preview"
                  className="max-h-[calc(100vh-260px)] w-auto max-w-full bg-white border border-[#D5DCEA] shadow-2xl"
                />
              </div>

              <div className="w-full lg:w-[380px] shrink-0 bg-white/90 border-t lg:border-t-0 lg:border-l border-[#D8E3E7] p-6 space-y-4">
                <h3 className="text-lg font-semibold">Print station</h3>
                <button onClick={handlePrint} className="w-full h-14 rounded-2xl bg-[#2457D6] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1D47B0] transition">
                  <Icon name="print" /> Print sheet
                </button>
                <button onClick={handleDownload} className="w-full h-14 rounded-2xl bg-[#102D50] text-white font-semibold flex items-center justify-center gap-2 hover:bg-black transition">
                  <Icon name="download" /> Download JPEG
                </button>
                <button onClick={resetApp} className="w-full h-14 rounded-2xl bg-[#E8F1F2] text-[#1B2440] font-semibold hover:bg-[#D8E7E9] transition">
                  New customer photo
                </button>
                <div className="pt-4 border-t border-[#E1E6F0] text-sm text-[#6B7794] space-y-2">
                  <div className="flex justify-between"><span>Photos</span><span className="font-medium text-[#1B2440]">{photoCount}</span></div>
                  <div className="flex justify-between"><span>Paper</span><span className="font-medium text-[#1B2440]">A4, 300 DPI canvas</span></div>
                  <div className="flex justify-between"><span>Cutting lines</span><span className="font-medium text-[#1B2440]">Included</span></div>
                </div>
                <p className="text-xs text-[#6B7794]">{BRAND_NAME}</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="min-h-10 shrink-0 bg-[#EEF5F5] border-t border-[#D8E3E7] flex items-center justify-center text-xs sm:text-sm text-[#6B7794] px-4 py-3 text-center">
        {FOOTER_TEXT}
      </footer>
    </div>
  );
}
