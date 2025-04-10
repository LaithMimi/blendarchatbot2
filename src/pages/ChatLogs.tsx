import React, { useState, useEffect } from 'react'; 
import { Download, Search, Calendar, User, MessageSquare, Trash2, AlertTriangle, Upload, Database, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getTeachingMaterialsTemplate, downloadStringAsFile } from "@/lib/utils";
import ChatMessage from '@/components/ChatMessage';
import Footer from '@/components/Footer';
import UploadJsonToFirestore from '../components/UploadJsonToFirestore';
import { DateRange } from 'react-day-picker';
import { fetchChatLogs, ChatSession, Message, deleteChat, deleteAllChats } from '@/api/askApi';
import { useToast } from '@/hooks/use-toast';

const ChatLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>();
  const [userId, setUserId] = useState('');
  const [messageType, setMessageType] = useState<'all' | 'user' | 'bot'>('all');
  const [chatLogs, setChatLogs] = useState<ChatSession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  const loadChatLogs = async () => {
    setIsLoading(true);
    try {
      // Adjust fetchChatLogs call depending on your actual function signature
      const result = await fetchChatLogs(
        currentPage, 
        20, 
        searchTerm,
        userId,
        date
      );

      console.log("Loaded chat logs:", result);
      
      if (result.chats && result.chats.length > 0) {
        setChatLogs(result.chats);
        setTotalPages(result.totalPages || 1);
      } else {
        setChatLogs([]);
        setTotalPages(1);
        
        if (searchTerm || userId || date) {
          toast({
            title: "No results found",
            description: "Try adjusting your search filters.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching chat logs:', error);
      toast({
        title: "Error",
        description: "Failed to load chat logs. Please try again.",
        variant: "destructive"
      });
      setChatLogs([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadChatLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);
  
  useEffect(() => {
    setCurrentPage(1);
    loadChatLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, userId, date, messageType]);
  
  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId) 
        : [...prev, sessionId]
    );
  };
  
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Session ID,User ID,User Name,Message Time,Sender,Message Content\n";
    
    chatLogs.forEach(session => {
      session.messages.forEach(message => {
        const row = [
          session._id,
          session.userId,
          session.userName,
          format(new Date(message.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          message.sender === 'user' ? 'User' : 'Bot',
          `"${((message.text || message.content || '').replace(/"/g, '""'))}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chat_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSearch = () => {
    setCurrentPage(1);
    loadChatLogs();
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setDate(undefined);
    setUserId('');
    setMessageType('all');
    setCurrentPage(1);
  };

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log(`Confirming delete for chat ID: ${chatToDelete}`);
      await deleteChat(chatToDelete);
      
      setChatLogs(prevLogs => prevLogs.filter(chat => chat._id !== chatToDelete));
      
      toast({
        title: "Chat deleted",
        description: "The chat has been successfully deleted.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete the chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const handleDeleteAllClick = () => {
    setIsDeleteAllDialogOpen(true);
  };

  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      console.log("Confirming delete all chats");
      const result = await deleteAllChats();
      
      if (result.success) {
        setChatLogs([]);
        setTotalPages(1);
        setCurrentPage(1);
        
        toast({
          title: "All chats deleted",
          description: "All chat logs have been successfully deleted.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error deleting all chats:', error);
      toast({
        title: "Error",
        description: "Failed to delete all chats. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingAll(false);
      setIsDeleteAllDialogOpen(false);
    }
  };

  const handleUploadSuccess = () => {
    toast({
      title: "Upload Success",
      description: "Teaching materials have been uploaded to Firestore.",
      variant: "default"
    });
    setIsUploadDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-background dark:bg-brand-darkGray/90">
      <main className="flex-1 page-container">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-4xl md:text-5xl lg:text-[49px] font-bold font-sans text-brand-darkGray dark:text-white">
              Chat Logs
            </h1>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="flex items-center gap-2"
              >
                Clear Filters
              </Button>
              <Button 
                onClick={exportToCSV}
                className="bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white flex items-center gap-2 px-4 py-2 rounded-lg"
              >
                <Download size={20} />
                <span className="hidden md:inline">Export as CSV</span>
              </Button>
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Database size={20} />
                <span className="hidden md:inline">Upload Materials</span>
              </Button>
              <Button 
                onClick={handleDeleteAllClick}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 size={20} />
                <span className="hidden md:inline">Delete All</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chat-logs" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="chat-logs">Chat Logs</TabsTrigger>
              <TabsTrigger value="upload-materials">Upload Teaching Materials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat-logs">
              <div className="bg-white/70 dark:bg-black/20 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by keyword or user ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      id="search-term"
                      name="search-term"
                      autoComplete="off"
                      className="pl-10 glass-input w-full"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left glass-input border-border"
                          id="date-filter"
                          name="date-filter"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {date?.from ? (
                            date.to ? (
                              <>
                                {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
                              </>
                            ) : (
                              format(date.from, "MMM d, yyyy")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={date?.from}
                          selected={date}
                          onSelect={setDate}
                          numberOfMonths={2}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Filter by user ID/name..."
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      id="user-id-filter"
                      name="user-id-filter"
                      autoComplete="off"
                      className="pl-10 glass-input w-full"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Button 
                      onClick={() => setMessageType('all')}
                      variant={messageType === 'all' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        messageType === 'all' ? 'bg-brand-yellow text-brand-darkGray' : 'glass-input'
                      )}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      All
                    </Button>
                    <Button 
                      onClick={() => setMessageType('user')}
                      variant={messageType === 'user' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        messageType === 'user' ? 'bg-brand-darkGray text-white' : 'glass-input'
                      )}
                    >
                      <User className="mr-2 h-4 w-4" />
                      User
                    </Button>
                    <Button 
                      onClick={() => setMessageType('bot')}
                      variant={messageType === 'bot' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        messageType === 'bot' ? 'bg-brand-bordeaux text-white' : 'glass-input'
                      )}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Bot
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-10 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-border">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bordeaux"></div>
                    </div>
                    <p className="mt-4 text-muted-foreground">Loading chat logs...</p>
                  </div>
                ) : chatLogs.length > 0 ? (
                  <>
                    {chatLogs.map((session) => {
                      const hasMessages = session.messages && session.messages.length > 0;
                      const sessionDate = hasMessages 
                        ? new Date(session.messages[0].timestamp)
                        : new Date();
                        
                      return (
                        <div 
                          key={session._id}
                          className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-border overflow-hidden shadow-sm"
                        >
                          <div 
                            className="p-4 border-b border-border bg-white/70 dark:bg-black/30 flex flex-col md:flex-row justify-between gap-3"
                          >
                            <div className="flex-1 cursor-pointer" onClick={() => toggleSessionExpand(session._id)}>
                              <h3 className="font-bold text-lg md:text-xl">
                                {session.userName || "Unknown User"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                User ID: {session.userId || "Unknown ID"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {format(sessionDate, 'PPP')} at {format(sessionDate, 'p')}
                              </span>
                              <span className="text-sm px-2 py-1 rounded-full bg-brand-yellow/30 dark:bg-brand-yellow/20 text-brand-darkGray dark:text-brand-yellow">
                                {hasMessages ? session.messages.length : 0} messages
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleDeleteClick(session._id, e)}
                                aria-label="Delete chat"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {expandedSessions.includes(session._id) && hasMessages && (
                            <div className="p-4 space-y-4">
                              {session.messages
                                .filter(msg => {
                                  if (messageType === 'all') return true;
                                  if (messageType === 'user') return msg.sender === 'user' || msg.isUser;
                                  if (messageType === 'bot') return msg.sender === 'bot' || !msg.isUser;
                                  return true;
                                })
                                .map((message, idx) => (
                                  <div key={message.id || idx} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground ml-2">
                                        {message.sender === 'user' || message.isUser ? session.userName : 'Bot'} 
                                        {" - "} 
                                        {format(new Date(message.timestamp), 'p')}
                                      </span>
                                    </div>
                                    <ChatMessage
                                      content={message.text || message.content || ''}
                                      isUser={message.sender === 'user' || !!message.isUser}
                                      timestamp={new Date(message.timestamp)}
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6 space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-border">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-xl font-bold text-brand-darkGray dark:text-white mb-1">
                      No chat logs found
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Try adjusting your search filters or check back later for new conversations.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="upload-materials">
              <div className="bg-white/70 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border">
                <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-darkGray dark:text-white">Upload Teaching Materials</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-sm"
                      onClick={() => downloadStringAsFile(
                        getTeachingMaterialsTemplate(),
                        'teaching_materials_template.json',
                        'application/json'
                      )}
                    >
                      <FileDown size={16} />
                      Download Template
                    </Button>
                  </div>
                  
                  <p className="mb-6 text-muted-foreground">
                    Upload a JSON file containing teaching materials to the Firestore database. 
                    The file must contain an array of objects with the following structure:
                  </p>
                  
                  <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto">
                    <pre className="text-sm text-brand-darkGray dark:text-gray-300">
{`[
  {
    "id": "beginner_week_01_001",
    "hebrew_input": "ברוכים הבאים",
    "arabic_response": "أهْلًا وسَهْلًا",
    "pronunciation": "אַהְלַן וַסַהְלַן"
  },
  {
    "id": "beginner_week_01_002",
    "hebrew_input": "שלום",
    "arabic_response": "مَرْحَبَا",
    "pronunciation": "מַרְחַבַּא"
  }
]`}
                    </pre>
                  </div>
                  
                  <UploadJsonToFirestore onUploadSuccess={handleUploadSuccess} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Delete Single Chat Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone 
              and the chat will be permanently removed from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete All Chats Confirmation Dialog */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete All Chats
            </DialogTitle>
            <DialogDescription>
              <p className="mt-2 font-semibold">Warning: This is a destructive action!</p>
              Are you absolutely sure you want to delete ALL chat logs? This action 
              cannot be undone and all conversations will be permanently removed 
              from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllDialogOpen(false)}
              disabled={isDeletingAll}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteAll}
              disabled={isDeletingAll}
              className="flex items-center gap-2"
            >
              {isDeletingAll && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Yes, Delete All Chats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Materials Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand-bordeaux" />
              Upload Teaching Materials
            </DialogTitle>
            <DialogDescription>
              Upload a JSON file containing teaching materials to the Firestore database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-sm"
                onClick={() => downloadStringAsFile(
                  getTeachingMaterialsTemplate(),
                  'teaching_materials_template.json',
                  'application/json'
                )}
              >
                <FileDown size={16} />
                Download Template
              </Button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto">
              <p className="mb-2 font-medium text-sm">Required JSON Structure:</p>
              <pre className="text-xs text-brand-darkGray dark:text-gray-300">
{`[
  {
    "id": "beginner_week_01_001",
    "hebrew_input": "ברוכים הבאים",
    "arabic_response": "أهْلًا وسَهْلًا",
    "pronunciation": "אַהְלַן וַסַהְלַן"
  }
]`}
              </pre>
            </div>
            
            <UploadJsonToFirestore onUploadSuccess={handleUploadSuccess} />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default ChatLogs;