import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Activity, Settings, HelpCircle, Shield, Check, Mail } from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsTabProps {
  currentUser: UserType | null;
  onUpdateProfile: (updated: Partial<UserType>) => void;
}

const AVATAR_TEMPLATES = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80',
];

export default function SettingsTab({ currentUser, onUpdateProfile }: SettingsTabProps) {
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [status, setStatus] = useState<UserType['status']>(currentUser?.status || 'online');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
          customStatus,
          avatar,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateProfile(data);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/20 p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-4">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Settings size={20} className="text-neutral-500" />
            <span>Profile and Preferences</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Update your public credentials, connection status, and select high-contrast avatar templates.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar selection column */}
          <div className="md:col-span-1 bg-white border border-neutral-200/60 p-5 rounded-2xl shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-semibold text-neutral-800 mb-4 self-start">Select Avatar</h3>

            <div className="relative w-24 h-24 mb-6 rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-inner">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt="Current profile"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(tpl)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    avatar === tpl ? 'border-neutral-900 scale-105 shadow-md' : 'border-neutral-100 hover:border-neutral-300'
                  }`}
                >
                  <img src={tpl} alt="Template" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Form details column */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Form layout */}
            <div className="bg-white border border-neutral-200/60 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-neutral-800 border-b border-neutral-100 pb-2 flex items-center gap-1.5">
                <User size={14} className="text-neutral-400" />
                <span>Account Credentials</span>
              </h3>

              {/* Email (Read Only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
                  <Mail size={12} />
                  <span>Verified Email</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || 'sajanrajbanshi27@gmail.com'}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-neutral-100 text-neutral-500 select-none font-medium cursor-not-allowed"
                />
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Sajan..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10 placeholder-neutral-400 font-semibold"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-700">Custom Status Message</label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Coding in AI Studio 🚀"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10 placeholder-neutral-400"
                />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-700">Personal Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="A short description about yourself..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10 placeholder-neutral-400 resize-none font-medium"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 items-center">
              <AnimatePresence>
                {isSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-xs text-emerald-600 font-semibold flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>Profile saved successfully!</span>
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center min-w-[100px]"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Security Info Card */}
        <div className="bg-white border border-neutral-200/60 p-4 rounded-xl flex items-start gap-3 mt-4">
          <Shield size={18} className="text-neutral-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-neutral-800">Operational Guidelines</h4>
            <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
              This application has end-to-end security simulations active. Multi-turn chats are processed server-side through Express proxies to protect all sensitive API keys from browser exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
