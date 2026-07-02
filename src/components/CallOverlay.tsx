import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Grid, User, ShieldAlert } from 'lucide-react';
import { CallState } from '../types';

interface CallOverlayProps {
  call: CallState;
  onHangUp: () => void;
}

export default function CallOverlay({ call, onHangUp }: CallOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(call.type === 'audio');
  const [seconds, setSeconds] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Handle active call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (call.status === 'active') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [call.status]);

  // Request local camera feed for video call
  useEffect(() => {
    if (call.type === 'video' && !isCamOff && call.status === 'active') {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera permission or availability failed:', err);
          setCameraError('Camera access unavailable (frame/device constraint)');
        });
    } else {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [call.type, isCamOff, call.status]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const partner = call.receiver.id === 'user-current' ? call.caller : call.receiver;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col justify-between p-6 select-none"
    >
      {/* Encryption Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900/80 rounded-full border border-neutral-800 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Simulated End-to-End Encrypted Call</span>
        </div>
        <div className="text-sm font-mono text-neutral-400">
          {call.status === 'active' ? formatTime(seconds) : call.status}
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 relative overflow-hidden rounded-2xl bg-neutral-900/40 border border-neutral-800/50">
        {call.type === 'video' && !isCamOff ? (
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Remote Video - Simulated looping ambient artwork */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-neutral-900 to-purple-950/40 flex flex-col items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ repeat: Infinity, duration: 10 }}
                className="w-32 h-32 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-2xl mb-4"
              >
                <img
                  src={partner.avatar}
                  alt={partner.username}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <h3 className="text-lg font-semibold tracking-wide">{partner.username}</h3>
              <p className="text-xs text-neutral-400 mt-1">Remote Video Feed (Simulated)</p>
            </div>

            {/* Local Video - Picture in Picture */}
            <div className="absolute bottom-4 right-4 w-32 h-44 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 shadow-xl flex items-center justify-center">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center p-2 text-center text-[10px] text-neutral-400">
                  <ShieldAlert size={16} className="text-amber-500 mb-1" />
                  <span>No Camera</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              )}
              <div className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-neutral-200">
                You
              </div>
            </div>
          </div>
        ) : (
          /* Audio Call Layout */
          <div className="flex flex-col items-center">
            {/* Animated Ring Ripple */}
            <div className="relative flex items-center justify-center w-48 h-48 mb-6">
              <AnimatePresence>
                {call.status !== 'ended' && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeOut' }}
                      className="absolute w-24 h-24 rounded-full bg-neutral-800 border border-neutral-700"
                    />
                    <motion.div
                      animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: 1, ease: 'easeOut' }}
                      className="absolute w-24 h-24 rounded-full bg-neutral-800 border border-neutral-700"
                    />
                  </>
                )}
              </AnimatePresence>

              <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-neutral-700 shadow-2xl z-10">
                <img
                  src={partner.avatar}
                  alt={partner.username}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">{partner.username}</h2>
            <p className="text-sm text-neutral-400 mt-2">
              {call.status === 'incoming' && 'Incoming call...'}
              {call.status === 'outgoing' && 'Ringing...'}
              {call.status === 'active' && 'Connected'}
            </p>

            {/* Pulsing visualizer effect for active voice */}
            {call.status === 'active' && (
              <div className="flex gap-1 h-6 items-center justify-center mt-6">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 24, 8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + i * 0.1,
                      ease: 'easeInOut',
                    }}
                    className="w-1 bg-indigo-500 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons Footer */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors border ${
              isMuted
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
            }`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* Hang Up Button */}
          <button
            onClick={onHangUp}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-lg shadow-red-900/30"
          >
            <PhoneOff size={24} />
          </button>

          {/* Camera Toggle (Only for Video Calls) */}
          {call.type === 'video' && (
            <button
              onClick={() => setIsCamOff(!isCamOff)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors border ${
                isCamOff
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
              }`}
            >
              {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          )}
        </div>

        <span className="text-xs text-neutral-500 font-mono">
          ChatterBox VoIP Interface
        </span>
      </div>
    </motion.div>
  );
}
