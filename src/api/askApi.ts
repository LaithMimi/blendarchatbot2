// src/api/askApi.ts
import { db } from '../config/firebaseConfig';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
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

// const ASK_API_URL = process.env.NODE_ENV === 'production' ? "https://ask-user-jfys4ba3ka-uc.a.run.app" : "http://127.0.0.1:5001/arabicchatbot-24bb2/us-central1/ask_user";
const ASK_API_URL = import.meta.env.MODE === 'production'
  ? "https://us-central1-arabicchatbot-24bb2.cloudfunctions.net/ask_user"
  : "http://127.0.0.1:5001/arabicchatbot-24bb2/us-central1/ask_user";

/**
 * Sends a question to the chatbot API and returns the response
 * Also syncs the conversation with Firestore
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
  // Get auth token from cookie or localStorage
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

  // Send the request to the server
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
  
  // If we have a Firestore reference, sync the chat session
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
  // First try to fetch from Firestore if available
  if (db) {
    try {
      const chatsCollection = collection(db, "chatLogs");
      let chatQuery = query(chatsCollection);
      
      // Apply filters if provided
      if (userId) {
        chatQuery = query(chatsCollection, where("userId", "==", userId));
      }
      
      // Additional filters could be applied here
      
      const querySnapshot = await getDocs(chatQuery);
      const chats: ChatSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data() as ChatSession;
        
        // Apply client-side search filtering if needed
        if (searchTerm && !chatContainsSearchTerm(chatData, searchTerm)) {
          return;
        }
        
        // Apply date filtering if needed
        if (dateRange?.from && dateRange?.to && !isWithinDateRange(chatData, dateRange)) {
          return;
        }
        
        chats.push(chatData);
      });
      
      // Sort by updatedAt or createdAt
      chats.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Handle pagination
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
  
  // Fall back to API if Firestore fetch fails or isn't available
  const query = new URLSearchParams();
  query.set("page", String(currentPage));
  query.set("pageSize", String(pageSize));
  
  if (searchTerm) query.set("searchTerm", searchTerm);
  if (userId) query.set("userId", userId);
  
  if (dateRange?.from) query.set("dateFrom", dateRange.from.toISOString());
  if (dateRange?.to) query.set("dateTo", dateRange.to.toISOString());

  const url = `/api/chatlogs?${query.toString()}`;
  const res = await fetch(url, { method: "GET" });
  
  if (!res.ok) {
    throw new Error(`fetchChatLogs failed: ${res.status} - ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Deletes a chat session
 */
export async function deleteChat(sessionId: string): Promise<{success: boolean}> {
  // Delete from server first
  const res = await fetch(`/api/chatlogs/${sessionId}`, {
    method: "DELETE",
  });
  
  if (!res.ok) {
    throw new Error(`deleteChat failed: ${res.status} - ${res.statusText}`);
  }
  
  // If server delete succeeds and Firestore is available, delete from Firestore too
  if (db) {
    try {
      await deleteDoc(doc(db, "chatLogs", sessionId));
    } catch (error) {
      console.error("Failed to delete chat from Firestore:", error);
    }
  }
  
  return res.json();
}

/**
 * Deletes all chat sessions
 */
export async function deleteAllChats(): Promise<{success: boolean}> {
  // Delete from server first
  const res = await fetch("/api/chatlogs", {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`deleteAllChats failed: ${res.status} - ${res.statusText}`);
  }
  return res.json();
}

/**
 * Gets a specific chat session by ID
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  if (!sessionId) return null;
  
  // Try to get from Firestore first if available
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
  
  // Fall back to API
  try {
    const res = await fetch(`/api/chatlogs/${sessionId}`);
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

/**
 * Converts server-side message format to client-side message format if needed
 */
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

/**
 * Helper function to check if a chat contains a search term
 */
function chatContainsSearchTerm(chat: ChatSession, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  
  // Check in user name/email
  if (chat.userName?.toLowerCase().includes(term) || 
      chat.userEmail?.toLowerCase().includes(term) ||
      chat.userId?.toLowerCase().includes(term)) {
    return true;
  }
  
  // Check in messages
  return chat.messages.some(msg => 
    (msg.content || msg.text || '').toLowerCase().includes(term)
  );
}

/**
 * Helper function to check if a chat is within a date range
 */
function isWithinDateRange(chat: ChatSession, dateRange: { from: Date, to: Date }): boolean {
  const chatDate = new Date(chat.createdAt || 0);
  return chatDate >= dateRange.from && chatDate <= dateRange.to;
}

