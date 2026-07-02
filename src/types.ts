export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  status: 'online' | 'offline' | 'away';
  customStatus?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'file' | 'audio' | 'video';
  fileName?: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'ai';
  avatar: string;
  members: string[]; // User IDs
  lastMessage?: Message;
  unreadCount?: number;
  aiRole?: string; // Optional role for AI chats
}

export interface CallState {
  id: string;
  type: 'audio' | 'video';
  status: 'idle' | 'incoming' | 'outgoing' | 'active' | 'ended';
  caller: {
    id: string;
    username: string;
    avatar: string;
  };
  receiver: {
    id: string;
    username: string;
    avatar: string;
  };
  duration: number; // in seconds
}
