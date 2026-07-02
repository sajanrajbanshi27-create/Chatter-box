import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Phone,
  Settings,
  X,
  Users,
  Grid,
  PhoneCall,
  Video,
  LogOut,
  Cpu,
  RefreshCw,
  PhoneMissed
} from 'lucide-react';

import { Chat, CallState, User, Message } from './types';
import ChatTab from './components/ChatTab';
import ImageGenTab from './components/ImageGenTab';
import AIChatTab from './components/AIChatTab';
import SettingsTab from './components/SettingsTab';
import CallOverlay from './components/CallOverlay';

interface CallHistory {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  duration: string;
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chats' | 'ai-bot' | 'ai-image' | 'calls' | 'settings'>('chats');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([
    {
      id: 'call-1',
      partnerName: 'Alice Smith',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      type: 'video',
      status: 'completed',
      duration: '04:15',
      timestamp: Date.now() - 1000 * 60 * 45,
    },
    {
      id: 'call-2',
      partnerName: 'Bob Vance',
      partnerAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      type: 'audio',
      status: 'missed',
      duration: '00:00',
      timestamp: Date.now() - 1000 * 60 * 120,
    },
  ]);

  // Unified Call Overlay State
  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  // Fetch current user and chat lists
  const refreshChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        
        // Update active chat details if open
        if (activeChat) {
          const freshActive = data.find((c: Chat) => c.id === activeChat.id);
          if (freshActive) setActiveChat(freshActive);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  useEffect(() => {
    // Fetch initial profile
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        const current = data.find((u: User) => u.id === 'user-current');
        if (current) setCurrentUser(current);
      })
      .catch((err) => console.error('Failed to load user profile:', err));

    refreshChats();
    // Poll sidebar lists periodically
    const interval = setInterval(refreshChats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initiate call simulation
  const handleTriggerCall = (chat: Chat, type: 'audio' | 'video') => {
    if (!currentUser) return;

    const partnerId = chat.members.find((id) => id !== 'user-current') || 'user-alice';
    // Find partner metadata
    fetch('/api/users')
      .then((res) => res.json())
      .then((usersList) => {
        const partnerUser = usersList.find((u: User) => u.id === partnerId) || usersList[1];

        const initialCall: CallState = {
          id: `call-${Date.now()}`,
          type,
          status: 'outgoing',
          caller: {
            id: 'user-current',
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
          receiver: {
            id: partnerUser.id,
            username: partnerUser.username,
            avatar: partnerUser.avatar,
          },
          duration: 0,
        };

        setActiveCall(initialCall);

        // Transition from ringing (outgoing) to connected (active) after 1.8s
        setTimeout(() => {
          setActiveCall((prev) => (prev ? { ...prev, status: 'active' } : null));
        }, 1800);
      });
  };

  const handleHangUpCall = () => {
    if (!activeCall) return;

    // Save call to local history logs before clearing
    const partner = activeCall.receiver.id === 'user-current' ? activeCall.caller : activeCall.receiver;
    const durationMins = Math.floor(activeCall.duration / 60).toString().padStart(2, '0');
    const durationSecs = (activeCall.duration % 60).toString().padStart(2, '0');

    const completedLog: CallHistory = {
      id: `call-log-${Date.now()}`,
      partnerName: partner.username,
      partnerAvatar: partner.avatar,
      type: activeCall.type,
      status: activeCall.duration > 0 ? 'completed' : 'rejected',
      duration: activeCall.duration > 0 ? `${durationMins}:${durationSecs}` : '00:00',
      timestamp: Date.now(),
    };

    setCallHistory((prev) => [completedLog, ...prev]);
    setActiveCall(null);
  };

  // Direct integration: Send generated image directly to standard active chats
  const handlePostImageToChat = async (imageUrl: string, promptText: string) => {
    if (!activeChat) return;

    const payload = {
      text: `🎨 Generated Image: "${promptText}"`,
      senderId: 'user-current',
      mediaUrl: imageUrl,
      mediaType: 'image' as const,
      fileName: 'gemini_art.png',
    };

    try {
      const res = await fetch(`/api/chats/${activeChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Automatically switch to chat tab so the user sees the posted graphic
        setActiveTab('chats');
        refreshChats();
      }
    } catch (err) {
      console.error('Failed to post generated graphic into conversation thread:', err);
    }
  };

  const handleUpdateProfile = (updatedUser: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updatedUser } as User);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 text-neutral-800 font-sans antialiased">
      {/* Primary Sidebar Rail */}
      <div className="w-16 md:w-20 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between items-center py-5 shrink-0 z-10">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo Frame */}
          <div className="w-10 md:w-12 h-10 md:h-12 bg-white rounded-2xl flex items-center justify-center font-mono font-bold text-neutral-900 shadow-lg tracking-tighter hover:scale-[1.02] transition-transform select-none cursor-pointer">
            CB
          </div>

          {/* Nav Item Buttons */}
          <div className="flex flex-col gap-2.5 w-full px-2.5">
            {/* Chats */}
            <button
              onClick={() => setActiveTab('chats')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'chats'
                  ? 'bg-white text-neutral-900 shadow-md scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Secure Chats"
            >
              <MessageSquare size={18} />
            </button>

            {/* AI Multi-Persona Bot */}
            <button
              onClick={() => setActiveTab('ai-bot')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'ai-bot'
                  ? 'bg-white text-neutral-900 shadow-md scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Gemini AI Companion"
            >
              <Sparkles size={18} />
            </button>

            {/* AI Image Gen */}
            <button
              onClick={() => setActiveTab('ai-image')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'ai-image'
                  ? 'bg-white text-neutral-900 shadow-md scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="AI Image Generator (1K, 2K, 4K)"
            >
              <ImageIcon size={18} />
            </button>

            {/* Call Logs */}
            <button
              onClick={() => setActiveTab('calls')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'calls'
                  ? 'bg-white text-neutral-900 shadow-md scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Simulated VoIP Logs"
            >
              <Phone size={18} />
            </button>

            {/* Profile Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-neutral-900 shadow-md scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Preferences"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* User Status Bottom Badge */}
        {currentUser && (
          <div className="flex flex-col items-center gap-1.5 select-none">
            <div className="relative w-8 md:w-10 h-8 md:h-10 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800">
              <img
                src={currentUser.avatar}
                alt="Me"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-900" />
            </div>
          </div>
        )}
      </div>

      {/* Primary Context Container */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 h-full overflow-hidden"
            >
              <ChatTab
                currentUser={currentUser}
                activeChat={activeChat}
                chats={chats}
                onSelectChat={(c) => setActiveChat(c)}
                onRefreshChats={refreshChats}
                onTriggerCall={handleTriggerCall}
              />
            </motion.div>
          )}

          {activeTab === 'ai-bot' && (
            <motion.div
              key="ai-bot"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 h-full overflow-hidden"
            >
              <AIChatTab />
            </motion.div>
          )}

          {activeTab === 'ai-image' && (
            <motion.div
              key="ai-image"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 h-full overflow-hidden"
            >
              <ImageGenTab
                onSendToChat={handlePostImageToChat}
                hasActiveChat={!!activeChat}
              />
            </motion.div>
          )}

          {activeTab === 'calls' && (
            <motion.div
              key="calls"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full"
            >
              <div className="flex flex-col gap-5">
                <div className="border-b border-neutral-200 pb-3">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Phone size={18} className="text-neutral-500" />
                    <span>VoIP Call History</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Displays logs from incoming, outgoing, and conference calls.
                  </p>
                </div>

                <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
                  {callHistory.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400">
                      <PhoneCall size={32} className="mx-auto text-neutral-300 stroke-[1.5] mb-3" />
                      <p className="text-xs">No simulated call logs on record.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {callHistory.map((log) => (
                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <img
                              src={log.partnerAvatar}
                              alt={log.partnerName}
                              className="w-10 h-10 rounded-xl object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h3 className="text-xs font-semibold text-neutral-800 leading-tight">
                                {log.partnerName}
                              </h3>
                              <p className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1">
                                {log.status === 'completed' ? (
                                  <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                                    <PhoneCall size={10} /> Completed
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-medium flex items-center gap-0.5">
                                    <PhoneMissed size={10} /> Missed
                                  </span>
                                )}
                                <span className="text-neutral-300">•</span>
                                <span>
                                  {new Date(log.timestamp).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-neutral-500">{log.duration}</span>
                            <div className="text-neutral-400">
                              {log.type === 'video' ? <Video size={14} /> : <Phone size={14} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 h-full overflow-hidden"
            >
              <SettingsTab
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Active VoIP Call Screen Overlays */}
      <AnimatePresence>
        {activeCall && (
          <CallOverlay
            call={activeCall}
            onHangUp={handleHangUpCall}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
