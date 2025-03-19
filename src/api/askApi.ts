// askApi.ts
export interface Message {
  content: string;
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isUser?: boolean;
}

export interface ChatSession {
  _id: string;
  userId: string;
  messages: Message[];
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// POST /ask or /api/ask
export async function askQuestion(
  question: string, 
  week: string,
  level: string, 
  gender: string, 
  language: string
) {
  // Get auth token from cookie or localStorage
  const authToken = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1]
    || sessionStorage.getItem('authToken')
    || localStorage.getItem('authToken');

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  // Add Authorization header if token exists
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch("/api/ask", {
    method: "POST",
    headers,
    body: JSON.stringify({ 
      question,
      week,
      level,
      gender,
      language
    })
  });
  if (!res.ok) {
    throw new Error(`askQuestion failed: ${res.status} - ${res.statusText}`);
  }
  return res.json();
}

// GET /api/chatlogs?queryParams
interface FetchChatLogsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchChatLogs(currentPage: number, p0: number, searchTerm: string, userId: string, date: unknown, params: FetchChatLogsParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.searchTerm) query.set("searchTerm", params.searchTerm);
  if (params.userId) query.set("userId", params.userId);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);

  const url = `/api/chatlogs?${query.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`fetchChatLogs failed: ${res.status} - ${res.statusText}`);
  }
  return res.json() as Promise<{
    chats: ChatSession[];
    totalPages: number;
  }>;
}

// DELETE /api/chatlogs/<sessionId>
export async function deleteChat(sessionId: string) {
  const res = await fetch(`/api/chatlogs/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`deleteChat failed: ${res.status} - ${res.statusText}`);
  }
  return res.json();
}

// DELETE /api/chatlogs
export async function deleteAllChats() {
  const res = await fetch("/api/chatlogs", {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`deleteAllChats failed: ${res.status} - ${res.statusText}`);
  }
  return res.json();
}
