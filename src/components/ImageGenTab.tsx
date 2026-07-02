import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Sliders, Play, Sparkles, Download, Check, RefreshCw, Send, Loader2 } from 'lucide-react';

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  size: string;
  ratio: string;
  timestamp: number;
}

interface ImageGenTabProps {
  onSendToChat?: (imageUrl: string, text: string) => void;
  hasActiveChat: boolean;
}

const ASPECT_RATIOS = [
  { label: '1:1 Square', value: '1:1' },
  { label: '16:9 Cinematic', value: '16:9' },
  { label: '9:16 Mobile Portrait', value: '9:16' },
  { label: '4:3 Classic', value: '4:3' },
  { label: '3:4 Portrait', value: '3:4' },
];

const RESOLUTIONS = [
  { label: '1K Standard (HD)', value: '1K' },
  { label: '2K Premium (QHD)', value: '2K' },
  { label: '4K Ultra (UHD)', value: '4K' },
];

export default function ImageGenTab({ onSendToChat, hasActiveChat }: ImageGenTabProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1K');
  const [ratio, setRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([
    {
      id: 'mock-1',
      prompt: 'A futuristic cybernetic metropolis under neon violet rain, synthwave aesthetic, photorealistic',
      url: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=600&q=80',
      size: '1K',
      ratio: '16:9',
      timestamp: Date.now() - 1000 * 60 * 30,
    },
    {
      id: 'mock-2',
      prompt: 'Minimalist flat vector illustration of an astronaut drinking tea on Mars',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      size: '1K',
      ratio: '1:1',
      timestamp: Date.now() - 1000 * 60 * 60,
    },
  ]);

  const loadingMessages = [
    'Synthesizing prompt tokens...',
    'Analyzing structural guidance...',
    'Reticulating splines and layout...',
    'Rendering high-fidelity textures...',
    'Applying light, shade, and color balance...',
    'Completing final upscale pass...',
  ];

  // Rotate loading messages during generation
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          aspectRatio: ratio,
        }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        const newImg: GeneratedImage = {
          id: `img-${Date.now()}`,
          prompt: prompt.trim(),
          url: data.imageUrl,
          size,
          ratio,
          timestamp: Date.now(),
        };
        setGallery((prev) => [newImg, ...prev]);
        setPrompt('');
      } else {
        throw new Error(data.error || 'The server returned an empty image payload.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to establish connection with the Gemini Imaging model.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Configuration Column */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-200/60 bg-neutral-50/50 p-5 overflow-y-auto flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sliders size={18} className="text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 tracking-tight">Configuration</h2>
          </div>
          <p className="text-xs text-neutral-500 leading-normal">
            Configure resolution up to 4K and native cinematic or tall aspect-ratio frameworks.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          {/* Resolutions */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-700">Resolution Size</label>
            <div className="grid grid-cols-1 gap-2">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res.value}
                  type="button"
                  onClick={() => setSize(res.value)}
                  className={`px-3 py-2.5 rounded-lg border text-xs text-left font-medium transition-all flex justify-between items-center ${
                    size === res.value
                      ? 'bg-white border-neutral-900 text-neutral-900 shadow-sm ring-1 ring-neutral-900/10'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <span>{res.label}</span>
                  {size === res.value && <Check size={14} className="text-neutral-950" />}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratios */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-700">Aspect Ratio</label>
            <div className="grid grid-cols-1 gap-2">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRatio(item.value)}
                  className={`px-3 py-2.5 rounded-lg border text-xs text-left font-medium transition-all flex justify-between items-center ${
                    ratio === item.value
                      ? 'bg-white border-neutral-900 text-neutral-900 shadow-sm ring-1 ring-neutral-900/10'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {ratio === item.value && <Check size={14} className="text-neutral-950" />}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Main Prompt/Gallery Column */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Top Prompt Input bar */}
        <div className="p-4 border-b border-neutral-200/60 bg-white">
          <form onSubmit={handleGenerate} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="A futuristic cybernetic metropolis under neon violet rain..."
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900 placeholder-neutral-400 bg-neutral-50/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <Sparkles size={16} className="animate-pulse" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
          </form>

          {/* Error messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-2.5 p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg leading-normal"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Space */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              /* Generating Active State Overlay */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-950 border-t-transparent animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                    <Image size={24} className="animate-pulse text-neutral-500" />
                  </div>
                </div>

                <h3 className="text-base font-semibold text-neutral-800 tracking-tight">
                  Generating Creative Asset
                </h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-sm">
                  {loadingMessages[statusIndex]}
                </p>
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 mt-6">
                  Gemini-3.1-Flash-Image Pipeline
                </span>
              </motion.div>
            ) : gallery.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400"
              >
                <Image size={48} className="text-neutral-300 stroke-[1.5] mb-4" />
                <h3 className="text-sm font-semibold text-neutral-700 tracking-tight">No generated images yet</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-normal">
                  Describe any visual concept in the prompt input at the top to trigger high-quality upscaled generation.
                </p>
              </motion.div>
            ) : (
              /* Gallery view */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {gallery.map((img) => (
                  <div
                    key={img.id}
                    className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    {/* Rendered image */}
                    <div className="aspect-video w-full bg-neutral-950 relative group overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.prompt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                        <p className="text-xs text-neutral-200 line-clamp-2">{img.prompt}</p>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-semibold text-neutral-800 line-clamp-2 leading-relaxed">
                          "{img.prompt}"
                        </p>
                        <div className="flex gap-2 items-center mt-2">
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-500">
                            {img.size}
                          </span>
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-500">
                            {img.ratio} Aspect Ratio
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
                        <a
                          href={img.url}
                          download={`chatterbox-${img.id}.png`}
                          className="flex-1 py-1.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Download size={14} />
                          <span>Save Local</span>
                        </a>

                        {onSendToChat && (
                          <button
                            onClick={() => onSendToChat(img.url, img.prompt)}
                            disabled={!hasActiveChat}
                            className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            title={!hasActiveChat ? 'Select an active chat window first' : ''}
                          >
                            <Send size={14} />
                            <span>Post to Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
