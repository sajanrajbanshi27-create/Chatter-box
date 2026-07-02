import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Phone,
  Video,
  Paperclip,
  Smile,
  X,
  File,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { Chat, Message, User } from '../types';

interface ChatTabProps {
  currentUser: User | null;
  activeChat: Chat | null;
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  onRefreshChats: () => void;
  onTriggerCall: (chat: Chat, type: 'audio' | 'video') => void;
}

export default function ChatTab({
  currentUser,
  activeChat,
  chats,
  onSelectChat,
  onRefreshChats,
  onTriggerCall,
}: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['user-current']);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  // Attachments simulation
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    type: 'image' | 'file';
    name: string;
  } | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter chats by search
  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch users for group creation
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setAvailableUsers(data.filter((u: User) => u.id !== 'user-current')));
  }, []);

  // Fetch messages for active chat
  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Set up message short polling for live messaging!
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);

      // Clear old polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      // Start new polling every 2.5s
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(activeChat.id);
        onRefreshChats(); // update left sidebar preview
      }, 2500);
    } else {
      setMessages([]);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeChat?.id]);

  // Scroll to bottom on message updates
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile && !activeChat) return;

    const payload = {
      text: inputText.trim(),
      senderId: 'user-current',
      mediaUrl: attachedFile?.url,
      mediaType: attachedFile?.type,
      fileName: attachedFile?.name,
    };

    setInputText('');
    setAttachedFile(null);
    setAttachmentMenuOpen(false);

    try {
      const res = await fetch(`/api/chats/${activeChat!.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        onRefreshChats();
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  };

  // Create Group Chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          type: 'group',
          members: selectedMembers,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onRefreshChats();
        onSelectChat(created);
        setIsGroupModalOpen(false);
        setNewGroupName('');
        setSelectedMembers(['user-current']);
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Simulated Attachments Upload
  const simulateAttachment = (type: 'image' | 'file') => {
    if (type === 'image') {
      setAttachedFile({
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
        type: 'image',
        name: 'abstract_waves.jpg',
      });
    } else {
      setAttachedFile({
        url: '#',
        type: 'file',
        name: 'release_notes.pdf',
      });
    }
    setAttachmentMenuOpen(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Sub-sidebar: Channels and active users */}
      <div className="w-full md:w-80 border-r border-neutral-200/60 bg-neutral-50/20 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-200/50 flex flex-col gap-3.5 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 tracking-tight">Channels</h2>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
              title="New Group Chat"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or members..."
              className="w-full pl-8 pr-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10 placeholder-neutral-400"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.map((c) => {
            const isActive = activeChat?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectChat(c)}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                  isActive ? 'bg-white border border-neutral-200/60 shadow-sm' : 'hover:bg-neutral-100/50'
                }`}
              >
                {/* Avatar status frame */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-100 bg-neutral-100">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {c.type === 'direct' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-neutral-800 tracking-tight truncate">
                      {c.name}
                    </h3>
                    {c.lastMessage && (
                      <span className="text-[9px] text-neutral-400 font-mono">
                        {new Date(c.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate mt-1">
                    {c.lastMessage ? (
                      <span>
                        <span className="font-medium text-neutral-600">
                          {c.lastMessage.senderId === 'user-current' ? 'You' : c.lastMessage.senderName}
                          :
                        </span>{' '}
                        {c.lastMessage.text || '📎 Sent an attachment'}
                      </span>
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-neutral-200/60 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-100">
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-neutral-800 tracking-tight">
                    {activeChat.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-neutral-400 font-medium">Active now</span>
                  </div>
                </div>
              </div>

              {/* Call Simulation Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onTriggerCall(activeChat, 'audio')}
                  className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors"
                  title="Simulate Voice Call"
                >
                  <Phone size={15} />
                </button>
                <button
                  onClick={() => onTriggerCall(activeChat, 'video')}
                  className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors"
                  title="Simulate Video Call"
                >
                  <Video size={15} />
                </button>
              </div>
            </div>

            {/* Message Thread Board */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/20">
              {messages.map((msg) => {
                const isMe = msg.senderId === 'user-current';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-neutral-100">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Chat Bubble Container */}
                    <div className="flex flex-col gap-1">
                      {/* Name & Time */}
                      <div
                        className={`flex gap-2 items-baseline text-[10px] text-neutral-400 ${
                          isMe ? 'justify-end' : ''
                        }`}
                      >
                        <span className="font-semibold text-neutral-600">{msg.senderName}</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed max-w-full break-words flex flex-col gap-2 ${
                          isMe
                            ? 'bg-neutral-900 text-white rounded-tr-none'
                            : 'bg-white border border-neutral-200/50 text-neutral-800 rounded-tl-none'
                        }`}
                      >
                        {/* Display attached image */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 max-w-xs mt-1">
                            <img
                              src={msg.mediaUrl}
                              alt={msg.fileName || 'Attached graphic'}
                              referrerPolicy="no-referrer"
                              className="w-full h-auto object-cover max-h-56"
                            />
                            {msg.fileName && (
                              <div className="p-1.5 bg-neutral-900/40 text-[10px] text-neutral-400 truncate">
                                {msg.fileName}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Display attached file icon */}
                        {msg.mediaType === 'file' && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100/50 border border-neutral-200/50 rounded-lg text-neutral-700 max-w-xs">
                            <File size={16} className="text-neutral-500" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-semibold truncate leading-none">
                                {msg.fileName || 'document.pdf'}
                              </p>
                              <span className="text-[8px] text-neutral-400 font-mono">Simulated document</span>
                            </div>
                          </div>
                        )}

                        {/* Message Text */}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            {/* Attachment preview panel */}
            <AnimatePresence>
              {attachedFile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0"
                >
                  <div className="flex items-center gap-2">
                    {attachedFile.type === 'image' ? (
                      <ImageIcon size={16} className="text-neutral-500" />
                    ) : (
                      <File size={16} className="text-neutral-500" />
                    )}
                    <span className="text-xs text-neutral-700 font-medium truncate max-w-xs">
                      {attachedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="p-1 hover:bg-neutral-200 rounded text-neutral-500"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="p-4 bg-white border-t border-neutral-200/60 shrink-0 relative">
              {/* Simulated attachments popover */}
              <AnimatePresence>
                {attachmentMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute bottom-16 left-4 bg-white border border-neutral-200 shadow-xl rounded-xl p-2 z-20 flex flex-col gap-1 w-44"
                  >
                    <button
                      onClick={() => simulateAttachment('image')}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-50 rounded text-xs text-neutral-700"
                    >
                      <ImageIcon size={14} className="text-neutral-500" />
                      <span>Simulate Image</span>
                    </button>
                    <button
                      onClick={() => simulateAttachment('file')}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-50 rounded text-xs text-neutral-700"
                    >
                      <File size={14} className="text-neutral-500" />
                      <span>Simulate Document</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                  className={`p-2.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors ${
                    attachmentMenuOpen ? 'bg-neutral-50' : ''
                  }`}
                  title="Attach asset"
                >
                  <Paperclip size={15} />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Send a secure message..."
                  className="flex-1 pl-4 pr-3 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10 placeholder-neutral-400"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedFile}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
                >
                  <Send size={12} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Landing Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 select-none">
            <MessageSquare size={48} className="text-neutral-200 stroke-[1.5] mb-4" />
            <h3 className="text-sm font-semibold text-neutral-700 tracking-tight">No Chat Selected</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-normal">
              Select any conversation or create a new channel in the sidebar to start typing.
            </p>
          </div>
        )}
      </div>

      {/* New Group Chat Modal */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-neutral-200 shadow-2xl rounded-2xl overflow-hidden max-w-md w-full"
            >
              <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Assemble New Channel</span>
                </h3>
                <button
                  onClick={() => setIsGroupModalOpen(false)}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-500"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-700">Group/Channel Name</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="React Devs, Designer Guild, Office Lounge..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/10 placeholder-neutral-400 font-medium"
                  />
                </div>

                {/* Member selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-700">Select Members</label>
                  <div className="max-h-44 overflow-y-auto border border-neutral-200/60 rounded-xl p-2 bg-neutral-50/10 space-y-1">
                    {availableUsers.map((user) => {
                      const isSelected = selectedMembers.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleMemberSelection(user.id)}
                          className={`w-full p-2 rounded-lg text-left flex items-center justify-between gap-3 text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white'
                              : 'bg-white border-neutral-100 hover:border-neutral-200 text-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-6 h-6 rounded-md object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span>{user.username}</span>
                          </div>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newGroupName.trim() || selectedMembers.length < 2}
                  className="mt-2 w-full py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>Build Channel</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
