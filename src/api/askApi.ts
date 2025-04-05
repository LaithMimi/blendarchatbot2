// src/api/askApi.ts
import { db } from '../config/firebaseConfig';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';

export interface Message {
  id: string;
  content: string;
  text?: string;
  sender: string;
  timestamp: string;
  isUser?: boolean;
}

export interface ChatSession {
  _id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
  level?: string;
  week?: string;
  gender?: string;
  language?: string;
  [key: string]: any;
}

const ASK_API_URL = import.meta.env.MODE === 'production'
  ? "https://us-central1-arabicchatbot-24bb2.cloudfunctions.net/ask_user"
  : "http://127.0.0.1:5001/arabicchatbot-24bb2/us-central1/ask_user";

  const CHATLOG_API_URL = import.meta.env.MODE === 'production'
  ? "https://us-central1-arabicchatbot-24bb2.cloudfunctions.net/api/chatlogs"
  : "http://127.0.0.1:5001/arabicchatbot-24bb2/us-central1/api_chatlogs";


/**
 * Sends a question to the chatbot API and returns the response
 */
export async function askQuestion(
  question: string, 
  week: string,
  level: string, 
  gender: string, 
  language: string,
  sessionId?: string
): Promise<{
  answer: string;
  sessionId: string;
  chatSession: ChatSession;
}> {
  const authToken = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1]
    || sessionStorage.getItem('authToken')
    || localStorage.getItem('authToken');

  if (!authToken) {
    throw new Error('Authentication token not found');
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`
  };

  const res = await fetch(ASK_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ 
      question,
      week,
      level,
      gender,
      language,
      sessionId
    })
  });

  if (!res.ok) {
    throw new Error(`askQuestion failed: ${res.status} - ${res.statusText}`);
  }

  const response = await res.json();

  if (db && response.chatSession) {
    try {
      const sessionRef = doc(db, "chatLogs", response.sessionId);
      await setDoc(sessionRef, response.chatSession, { merge: true });
    } catch (error) {
      console.error("Failed to sync chat session with Firestore:", error);
    }
  }

  return response;
}

/**
 * Fetches chat logs from server with optional filters
 */
export async function fetchChatLogs(
  currentPage: number, 
  pageSize: number, 
  searchTerm: string = "", 
  userId: string = "", 
  dateRange: any = null
): Promise<{
  chats: ChatSession[];
  totalPages: number;
}> {
  if (db) {
    try {
      const chatsCollection = collection(db, "chatLogs");
      let chatQuery = query(chatsCollection);

      if (userId) {
        chatQuery = query(chatsCollection, where("userId", "==", userId));
      }

      const querySnapshot = await getDocs(chatQuery);
      const chats: ChatSession[] = [];

      querySnapshot.forEach((doc) => {
        const chatData = doc.data() as ChatSession;

        if (searchTerm && !chatContainsSearchTerm(chatData, searchTerm)) {
          return;
        }

        if (dateRange?.from && dateRange?.to && !isWithinDateRange(chatData, dateRange)) {
          return;
        }

        chats.push(chatData);
      });

      chats.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedChats = chats.slice(startIndex, endIndex);
      const totalPages = Math.ceil(chats.length / pageSize);

      return {
        chats: paginatedChats,
        totalPages
      };
    } catch (firestoreError) {
      console.error("Failed to fetch from Firestore, falling back to API:", firestoreError);
    }
  }

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(currentPage));
  searchParams.set("pageSize", String(pageSize));
  if (searchTerm) searchParams.set("searchTerm", searchTerm);
  if (userId) searchParams.set("userId", userId);
  if (dateRange?.from) searchParams.set("dateFrom", dateRange.from.toISOString());
  if (dateRange?.to) searchParams.set("dateTo", dateRange.to.toISOString());

  const url = `${CHATLOG_API_URL}?${searchParams.toString()}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    throw new Error(`fetchChatLogs failed: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function deleteChat(sessionId: string): Promise<{success: boolean}> {
  const url = `${CHATLOG_API_URL}/${sessionId}`;
  const res = await fetch(url, { method: "DELETE" });

  if (!res.ok) {
    throw new Error(`deleteChat failed: ${res.status} - ${res.statusText}`);
  }

  if (db) {
    try {
      await deleteDoc(doc(db, "chatLogs", sessionId));
    } catch (error) {
      console.error("Failed to delete chat from Firestore:", error);
    }
  }

  return res.json();
}

export async function deleteAllChats(): Promise<{success: boolean}> {
  const res = await fetch(CHATLOG_API_URL, { method: "DELETE" });

  if (!res.ok) {
    throw new Error(`deleteAllChats failed: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  if (!sessionId) return null;

  if (db) {
    try {
      const sessionDoc = await getDoc(doc(db, "chatLogs", sessionId));
      if (sessionDoc.exists()) {
        return sessionDoc.data() as ChatSession;
      }
    } catch (error) {
      console.error("Failed to get chat session from Firestore:", error);
    }
  }

  try {
    const res = await fetch(`${CHATLOG_API_URL}/${sessionId}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`getChatSession failed: ${res.status} - ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to get chat session from API:", error);
    return null;
  }
}

export function normalizeMessage(message: any): Message {
  return {
    id: message.id,
    content: message.content || message.text || '',
    text: message.text || message.content || '',
    sender: message.sender,
    timestamp: message.timestamp,
    isUser: message.sender === 'user' || message.isUser === true
  };
}

function chatContainsSearchTerm(chat: ChatSession, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  return (
    chat.userName?.toLowerCase().includes(term) ||
    chat.userEmail?.toLowerCase().includes(term) ||
    chat.userId?.toLowerCase().includes(term) ||
    chat.messages.some(msg =>
      (msg.content || msg.text || '').toLowerCase().includes(term)
    )
  );
}

function isWithinDateRange(chat: ChatSession, dateRange: { from: Date, to: Date }): boolean {
  const chatDate = new Date(chat.createdAt || 0);
  return chatDate >= dateRange.from && chatDate <= dateRange.to;
}
