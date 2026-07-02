import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, Send, ShieldAlert, Cpu, CornerDownLeft, RefreshCw, MessageSquare } from 'lucide-react';

interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const BOT_ROLES = [
  {
    name: 'Tech Expert',
    icon: '💻',
    description: 'Expert developer. Explains system designs, optimizes code, and refactors bugs.',
    systemPrompt: 'You are a Senior Principal Software Architect and Tech Expert. You write precise, highly structured, optimized code and explain technical systems with extreme clarity. Use markdown code blocks, bold key terms, and bullet points.',
    chips: ['Write an elegant Express rate limiter', 'Compare SQL vs NoSQL for chats', 'Optimizing React re-renders'],
  },
  {
    name: 'Sarcastic Buddy',
    icon: '😏',
    description: 'Answers with witty remarks, dry humor, and slight playful banter.',
    systemPrompt: 'You are a highly sarcastic, dry-witted close friend. You answer questions accurately but with humorous, playful banter, eye-rolls, and funny comparisons. Keep replies relatively concise and full of personality.',
    chips: ['Why is my code not building?', 'Should I eat leftover pizza?', 'Give me a pep talk'],
  },
  {
    name: 'French Tutor',
    icon: '🥖',
    description: 'Speaks mostly French, translates vocab, and helps you practice conversation.',
    systemPrompt: 'You are an encouraging, friendly French language tutor. Reply primarily in French with clear explanations and translate difficult vocabulary or phrases in English inside brackets. Ask questions to keep the practice going!',
    chips: ['Practice ordering a croissant', 'How do you say "buggy server"?', 'Teach me 3 cool idioms'],
  },
  {
    name: 'Life Coach',
    icon: '🧘',
    description: 'Empathetic, structured counselor. Helps design routines and reduce stress.',
    systemPrompt: 'You are a warm, highly empathetic, and professional Life Coach. You listen, offer structured action items, encourage positive habit loops, and validate emotions. Keep formatting structured with clear bullet points and goals.',
    chips: ['I feel overwhelmed with work', 'Optimize my morning routine', 'How to handle career stress'],
  },
];

const MODELS = [
  { label: 'Gemini 3.5 Flash (General)', value: 'gemini-3.5-flash' },
  { label: 'Gemini 3.1 Pro (Complex Tasks)', value: 'gemini-3.1-pro-preview' },
  { label: 'Gemini 3.1 Lite (Fast)', value: 'gemini-3.1-flash-lite' },
];

export default function AIChatTab() {
  const [activeRole, setActiveRole] = useState(BOT_ROLES[0]);
  const [activeModel, setActiveModel] = useState('gemini-3.5-flash');
  const [messagesByRole, setMessagesByRole] = useState<Record<string, AIMessage[]>>({
    'Tech Expert': [
      {
        id: 'init-tech',
        sender: 'assistant',
        text: "System status: Operational. I am your Senior Technical Expert. How can I assist you with code optimization, system design, or architectural queries today? 💻",
        timestamp: Date.now(),
      },
    ],
    'Sarcastic Buddy': [
      {
        id: 'init-sarcastic',
        sender: 'assistant',
        text: "Oh, look, another message. Let me guess, you broke something or you need advice on something incredibly obvious? Hit me with it. 😏",
        timestamp: Date.now(),
      },
    ],
    'French Tutor': [
      {
        id: 'init-french',
        sender: 'assistant',
        text: "Bonjour ! Comment ça va ? I am your French Tutor. Are you ready to practice your conversation? Let me know what you want to talk about today! 🥖",
        timestamp: Date.now(),
      },
    ],
    'Life Coach': [
      {
        id: 'init-coach',
        sender: 'assistant',
        text: "Hello there. Take a deep breath. 🧘 I am here to help you navigate through your goals, optimize your focus, and organize your stress. What is on your mind today?",
        timestamp: Date.now(),
      },
    ],
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activeMessages = messagesByRole[activeRole.name] || [];

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: `ai-msg-u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: Date.now(),
    };

    // Optimistically update
    const updatedHistory = [...activeMessages, userMsg];
    setMessagesByRole((prev) => ({
      ...prev,
      [activeRole.name]: updatedHistory,
    }));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          role: activeRole.systemPrompt,
          model: activeModel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.text) {
        const botMsg: AIMessage = {
          id: `ai-msg-b-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: Date.now(),
        };
        setMessagesByRole((prev) => ({
          ...prev,
          [activeRole.name]: [...updatedHistory, botMsg],
        }));
      } else {
        throw new Error(data.error || 'Empty response from model.');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: AIMessage = {
        id: `ai-msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Snag**: Could not fetch Gemini completion. Please verify your GEMINI_API_KEY in Settings.\n\nError details: \`${err?.message || 'Unknown'}\``,
        timestamp: Date.now(),
      };
      setMessagesByRole((prev) => ({
        ...prev,
        [activeRole.name]: [...updatedHistory, errorMsg],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessagesByRole((prev) => ({
      ...prev,
      [activeRole.name]: [
        {
          id: `init-${Date.now()}`,
          sender: 'assistant',
          text: `Reset. Hello, I am back online as your ${activeRole.name}!`,
          timestamp: Date.now(),
        },
      ],
    }));
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white">
      {/* Sidebar: Persona + Model configurations */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-200/60 bg-neutral-50/50 p-5 overflow-y-auto flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bot size={18} className="text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 tracking-tight">AI Personas</h2>
          </div>
          <p className="text-xs text-neutral-500 leading-normal">
            Choose a custom role instructions persona. Each agent preserves its own conversation thread.
          </p>
        </div>

        {/* Persona Selectors */}
        <div className="flex flex-col gap-2">
          {BOT_ROLES.map((role) => (
            <button
              key={role.name}
              onClick={() => setActiveRole(role)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                activeRole.name === role.name
                  ? 'bg-white border-neutral-900 text-neutral-900 shadow-sm ring-1 ring-neutral-900/5'
                  : 'bg-white/80 border-neutral-200 hover:border-neutral-300 text-neutral-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{role.icon}</span>
                <div>
                  <h3 className="text-xs font-semibold">{role.name}</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{role.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Model Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1">
            <Cpu size={12} className="text-neutral-400" />
            <span>Underlying LLM Engine</span>
          </label>
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-800 focus:outline-none focus:border-neutral-950 font-medium"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Thread */}
        <button
          onClick={clearHistory}
          className="mt-auto py-2 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw size={12} />
          <span>Clear Active Thread</span>
        </button>
      </div>

      {/* Main Chat Conversation Thread */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Sub-Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200/60 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-lg shadow-sm">
              {activeRole.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-neutral-800 tracking-tight">{activeRole.name}</h2>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">{activeRole.description}</p>
            </div>
          </div>
        </div>

        {/* Message Threads */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/20">
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {msg.sender === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center">
                    S
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm shadow-sm">
                    {activeRole.icon}
                  </div>
                )}
              </div>

              {/* Text Bubble */}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-neutral-900 text-white rounded-tr-none'
                    : 'bg-white border border-neutral-200/60 text-neutral-800 rounded-tl-none font-sans'
                }`}
              >
                {/* Check for markdown in a basic but visually clean way */}
                <div className="whitespace-pre-wrap break-words">
                  {msg.text.split('\n').map((line, lIdx) => {
                    // Render simple code block formatting
                    if (line.startsWith('```')) {
                      return null;
                    }
                    if (line.includes('`')) {
                      const parts = line.split('`');
                      return (
                        <p key={lIdx} className="mb-1">
                          {parts.map((p, pIdx) =>
                            pIdx % 2 === 1 ? (
                              <code key={pIdx} className="bg-neutral-100 text-rose-600 px-1.5 py-0.5 rounded font-mono text-[11px]">
                                {p}
                              </code>
                            ) : (
                              p
                            )
                          )}
                        </p>
                      );
                    }
                    return (
                      <p key={lIdx} className={line ? 'mb-1' : 'h-2'}>
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm shadow-sm animate-pulse">
                {activeRole.icon}
              </div>
              <div className="px-4 py-3 bg-white border border-neutral-200/60 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Suggestions chips */}
        <div className="px-5 pt-3 pb-1 bg-white border-t border-neutral-100 flex gap-2 overflow-x-auto select-none shrink-0 scrollbar-none">
          {activeRole.chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50 text-neutral-600 rounded-full text-[11px] font-semibold border border-neutral-200/40 whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-neutral-200/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={`Query ${activeRole.name} using ${activeModel.split(' ')[0]}...`}
              className="flex-1 pl-4 pr-3 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
            >
              <Send size={12} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
