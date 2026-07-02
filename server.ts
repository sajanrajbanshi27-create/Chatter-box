import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialize Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_DEVELOPMENT",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Database State
const USERS = [
  {
    id: "user-current",
    username: "Sajan",
    email: "sajanrajbanshi27@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    bio: "ChatterBox master developer.",
    status: "online" as const,
    customStatus: "Coding in AI Studio 🚀",
  },
  {
    id: "user-alice",
    username: "Alice Smith",
    email: "alice@chatterbox.app",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    bio: "Lead UI Designer. Coffee enthusiast. ☕",
    status: "online" as const,
    customStatus: "Designing things beautifully",
  },
  {
    id: "user-bob",
    username: "Bob Vance",
    email: "bob@vancerefrigeration.com",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
    bio: "Vance Refrigeration. Sales expert.",
    status: "away" as const,
    customStatus: "Out at lunch 🥪",
  },
  {
    id: "user-charlie",
    username: "Charlie Day",
    email: "charlie@paddys.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    bio: "Local rat exterminator. Enthusiastic about cheese and ghouls.",
    status: "online" as const,
    customStatus: "Searching for Pepe Silvia 🔍",
  },
  {
    id: "user-gemini",
    username: "Gemini Companion",
    email: "gemini@google.com",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    bio: "Official AI agent powered by Gemini-3.5-flash.",
    status: "online" as const,
    customStatus: "AI Thinking... 🧠",
  },
];

let CHATS = [
  {
    id: "chat-global",
    name: "Global Lounge",
    type: "group" as const,
    avatar: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=150&q=80",
    members: ["user-current", "user-alice", "user-bob", "user-charlie", "user-gemini"],
  },
  {
    id: "chat-alice",
    name: "Alice Smith",
    type: "direct" as const,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    members: ["user-current", "user-alice"],
  },
  {
    id: "chat-bob",
    name: "Bob Vance",
    type: "direct" as const,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
    members: ["user-current", "user-bob"],
  },
  {
    id: "chat-gemini",
    name: "Gemini AI Chat",
    type: "ai" as const,
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    members: ["user-current", "user-gemini"],
    aiRole: "Helper Bot",
  },
];

let MESSAGES = [
  {
    id: "msg-1",
    chatId: "chat-global",
    senderId: "user-alice",
    senderName: "Alice Smith",
    senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    text: "Welcome to ChatterBox! This chat is completely live and stored in-memory on our Express backend. 🚀",
    timestamp: Date.now() - 1000 * 60 * 10,
  },
  {
    id: "msg-2",
    chatId: "chat-global",
    senderId: "user-bob",
    senderName: "Bob Vance",
    senderAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
    text: "Impressive! Is it also running a live Gemini chatbot in-character?",
    timestamp: Date.now() - 1000 * 60 * 8,
  },
  {
    id: "msg-3",
    chatId: "chat-global",
    senderId: "user-charlie",
    senderName: "Charlie Day",
    senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    text: "Yeah, and check out the AI tab! It literally lets you generate images in 4K size. Wild stuff. 💥",
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: "msg-4",
    chatId: "chat-alice",
    senderId: "user-alice",
    senderName: "Alice Smith",
    senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    text: "Hey Sajan! Let me know if you need any UI assistance on ChatterBox. Custom avatars or themes are ready!",
    timestamp: Date.now() - 1000 * 60 * 15,
  },
  {
    id: "msg-5",
    chatId: "chat-bob",
    senderId: "user-bob",
    senderName: "Bob Vance",
    senderAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
    text: "Sajan, we need a refrigerated server setup for this app immediately. Let's make a deal.",
    timestamp: Date.now() - 1000 * 60 * 20,
  },
];

// Helper to trigger automated character responses via Gemini to make the application alive!
async function triggerCharacterResponse(chatId: string, charId: string, userMessage: string) {
  const char = USERS.find((u) => u.id === charId);
  if (!char) return;

  const ai = getGenAI();
  const apiKeyExists = process.env.GEMINI_API_KEY;

  let responseText = `I'm a little busy right now, but I'll get back to you soon!`;

  if (apiKeyExists) {
    try {
      const prompt = `You are playing the role of ${char.username} in a messaging app.
Here is your description/bio: "${char.bio}".
The user Sajan just sent you this message: "${userMessage}".
Reply to Sajan's message in-character, keeping your reply very short and casual (1-2 sentences). Do not break character. Do not output anything other than your reply.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      if (response.text) {
        responseText = response.text.trim();
      }
    } catch (err) {
      console.error(`Error generating Gemini response for ${char.username}:`, err);
    }
  } else {
    // Basic fallback replies
    if (charId === "user-alice") {
      responseText = `Hey Sajan! I love the new interface changes. Let's design some more custom gradients later!`;
    } else if (charId === "user-bob") {
      responseText = `Bob Vance, Vance Refrigeration. Let me know when you're ready to buy those high-efficiency cooling units.`;
    } else if (charId === "user-charlie") {
      responseText = `We got a rat problem in the basement, Sajan! Let's handle that then chat. Or we can eat some milk steak!`;
    }
  }

  // Add the message
  const replyMessage = {
    id: `msg-auto-${Date.now()}`,
    chatId,
    senderId: charId,
    senderName: char.username,
    senderAvatar: char.avatar,
    text: responseText,
    timestamp: Date.now(),
  };

  MESSAGES.push(replyMessage);
}

// REST Endpoints
app.get("/api/users", (req, res) => {
  res.json(USERS);
});

app.get("/api/chats", (req, res) => {
  // Return chats with their latest messages and unread counts
  const chatsWithDetails = CHATS.map((c) => {
    const chatMessages = MESSAGES.filter((m) => m.chatId === c.id);
    const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : undefined;
    return {
      ...c,
      lastMessage,
      unreadCount: 0, // Mock for simple application
    };
  });
  res.json(chatsWithDetails);
});

app.post("/api/chats", (req, res) => {
  const { name, type, members, aiRole } = req.body;
  const newChat = {
    id: `chat-${Date.now()}`,
    name: name || "New Group Chat",
    type: type || "group",
    avatar: type === "group" 
      ? "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80"
      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    members: members || ["user-current"],
    aiRole,
  };
  CHATS.push(newChat);
  res.status(201).json(newChat);
});

app.get("/api/chats/:chatId/messages", (req, res) => {
  const { chatId } = req.params;
  const chatMessages = MESSAGES.filter((m) => m.chatId === chatId);
  res.json(chatMessages);
});

app.post("/api/chats/:chatId/messages", (req, res) => {
  const { chatId } = req.params;
  const { text, senderId, mediaUrl, mediaType, fileName } = req.body;

  const sender = USERS.find((u) => u.id === senderId) || USERS[0];

  const newMessage = {
    id: `msg-${Date.now()}`,
    chatId,
    senderId: sender.id,
    senderName: sender.username,
    senderAvatar: sender.avatar,
    text: text || "",
    timestamp: Date.now(),
    mediaUrl,
    mediaType,
    fileName,
  };

  MESSAGES.push(newMessage);

  // Check if we should trigger an AI or automated reply
  const chat = CHATS.find((c) => c.id === chatId);
  if (chat && chat.type === "ai") {
    // This is direct chat with Gemini Companion
    setTimeout(async () => {
      const ai = getGenAI();
      const apiKeyExists = process.env.GEMINI_API_KEY;

      let replyText = "I'm Gemini, your companion. Provide a valid GEMINI_API_KEY to see my smart replies!";
      if (apiKeyExists) {
        try {
          // Gather last 10 messages for conversation context
          const history = MESSAGES.filter((m) => m.chatId === chatId).slice(-10);
          const formattedHistory = history.map((h) => ({
            role: h.senderId === "user-current" ? ("user" as const) : ("model" as const),
            parts: [{ text: h.text }],
          }));

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: formattedHistory,
            config: {
              systemInstruction: `You are Gemini Companion, an extremely friendly, helpful, and fun chat companion. You support markdown, write clean bullet points when asked, and sound lively!`,
            },
          });

          if (response.text) {
            replyText = response.text.trim();
          }
        } catch (err) {
          console.error("Gemini companion error:", err);
          replyText = "Oops! I hit a snag trying to think. Make sure your API key and connection are active.";
        }
      }

      const replyMsg = {
        id: `msg-ai-${Date.now()}`,
        chatId,
        senderId: "user-gemini",
        senderName: "Gemini Companion",
        senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
        text: replyText,
        timestamp: Date.now(),
      };
      MESSAGES.push(replyMsg);
    }, 1000);
  } else if (chat && chat.type === "direct") {
    // Direct chat with mock user (Alice, Bob, Charlie)
    const otherMemberId = chat.members.find((m) => m !== senderId);
    if (otherMemberId && otherMemberId !== "user-current") {
      setTimeout(() => {
        triggerCharacterResponse(chatId, otherMemberId, text || "");
      }, 1500);
    }
  }

  res.status(201).json(newMessage);
});

// Update Profile API
app.post("/api/profile", (req, res) => {
  const { username, bio, customStatus, avatar } = req.body;
  const current = USERS.find((u) => u.id === "user-current");
  if (current) {
    if (username) current.username = username;
    if (bio !== undefined) current.bio = bio;
    if (customStatus !== undefined) current.customStatus = customStatus;
    if (avatar) current.avatar = avatar;
    res.json(current);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Multi-turn Custom Role AI Chat
app.post("/api/ai/chat", async (req, res) => {
  const { messages, role, model } = req.body;
  const ai = getGenAI();

  const activeModel = model || "gemini-3.5-flash";

  try {
    // Formulate the contents list correctly for GoogleGenAI SDK
    // The history should be: { role: 'user'|'model', parts: [{ text: '...' }] }
    const formattedContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const systemInstruction = role 
      ? `You are playing a chatbot role of: "${role}". Strictly adopt this personality, vocabulary, and tone. Never break character.`
      : "You are a helpful chat assistant.";

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("AI Chat generation failed:", err);
    res.status(500).json({ error: err?.message || "AI Chatbot generation error" });
  }
});

// High Quality Image Generation API (Supports 1K, 2K, 4K and aspect ratio selections)
app.post("/api/ai/image", async (req, res) => {
  const { prompt, size, aspectRatio } = req.body;
  const ai = getGenAI();

  // The user specifies model gemini-3-pro-image-preview.
  // We'll fall back to gemini-3.1-flash-image if gemini-3-pro-image-preview has any issues,
  // or use gemini-3.1-flash-image as it fully supports 1K, 2K, 4K size parameters in the SDK guidelines.
  const selectedModel = "gemini-3.1-flash-image";

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: size || "1K", // "1K", "2K", "4K"
        },
      },
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      // Look for text feedback (sometimes safety limits trigger a text description instead)
      let textFeedback = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.text) {
          textFeedback += part.text;
        }
      }
      throw new Error(textFeedback || "No image data was generated by the model.");
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
    });
  } catch (err: any) {
    console.error("Image generation failed:", err);
    res.status(500).json({ error: err?.message || "Failed to generate image" });
  }
});

// Start Node server & attach Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
