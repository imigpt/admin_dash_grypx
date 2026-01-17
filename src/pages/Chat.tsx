import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, Search, Circle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderUsername: string;
  receiverId: number;
  receiverName: string;
  receiverUsername: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: string;
}

interface ChatUser {
  userId: number;
  name: string;
  username: string;
  profileImage: string | null;
  isOnline: boolean;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

interface Conversation {
  userId: number;
  userName: string;
  userUsername: string;
  messages: ChatMessage[];
}

type ConversationsMap = { [key: string]: Conversation };

const BASE_URL = "http://34.131.156.94:8080/api/chat";
const WS_URL = "ws://34.131.156.94:8080/ws";
const ADMIN_USER_ID = 11; // Admin user ID (Administrator @GRYPX#011)

// Sample data for demonstration when no real chats exist
const sampleUsers: ChatUser[] = [
  { userId: 1, name: "John Smith", username: "john_smith", profileImage: null, isOnline: true, lastMessage: "Hey, when is the next match?", lastMessageTime: "2025-01-15T10:30:00", unreadCount: 2 },
  { userId: 2, name: "Sarah Johnson", username: "sarah_j", profileImage: null, isOnline: true, lastMessage: "Thanks for the update!", lastMessageTime: "2025-01-15T09:15:00", unreadCount: 0 },
  { userId: 3, name: "Mike Wilson", username: "mike_w", profileImage: null, isOnline: false, lastMessage: "Can you check my score?", lastMessageTime: "2025-01-14T16:45:00", unreadCount: 1 },
  { userId: 4, name: "Emma Davis", username: "emma_d", profileImage: null, isOnline: false, lastMessage: "Great tournament!", lastMessageTime: "2025-01-14T14:20:00", unreadCount: 0 },
  { userId: 5, name: "Alex Brown", username: "alex_b", profileImage: null, isOnline: true, lastMessage: "I'll be there at 5pm", lastMessageTime: "2025-01-15T08:00:00", unreadCount: 0 },
];

const sampleConversations: ConversationsMap = {
  "1-11": {
    userId: 1, userName: "John Smith", userUsername: "john_smith",
    messages: [
      { id: 1, senderId: 1, senderName: "John Smith", senderUsername: "john_smith", receiverId: 11, receiverName: "Admin", receiverUsername: "admin", content: "Hi! I wanted to ask about the upcoming tournament.", timestamp: "2025-01-15T10:00:00", isRead: true, messageType: "TEXT" },
      { id: 2, senderId: 11, senderName: "Admin", senderUsername: "admin", receiverId: 1, receiverName: "John Smith", receiverUsername: "john_smith", content: "Hello John! Sure, what would you like to know?", timestamp: "2025-01-15T10:05:00", isRead: true, messageType: "TEXT" },
      { id: 3, senderId: 1, senderName: "John Smith", senderUsername: "john_smith", receiverId: 11, receiverName: "Admin", receiverUsername: "admin", content: "When is the next match scheduled?", timestamp: "2025-01-15T10:10:00", isRead: true, messageType: "TEXT" },
      { id: 4, senderId: 1, senderName: "John Smith", senderUsername: "john_smith", receiverId: 11, receiverName: "Admin", receiverUsername: "admin", content: "Hey, when is the next match?", timestamp: "2025-01-15T10:30:00", isRead: false, messageType: "TEXT" },
    ]
  },
  "2-11": {
    userId: 2, userName: "Sarah Johnson", userUsername: "sarah_j",
    messages: [
      { id: 5, senderId: 11, senderName: "Admin", senderUsername: "admin", receiverId: 2, receiverName: "Sarah Johnson", receiverUsername: "sarah_j", content: "Your match results have been updated.", timestamp: "2025-01-15T09:10:00", isRead: true, messageType: "TEXT" },
      { id: 6, senderId: 2, senderName: "Sarah Johnson", senderUsername: "sarah_j", receiverId: 11, receiverName: "Admin", receiverUsername: "admin", content: "Thanks for the update!", timestamp: "2025-01-15T09:15:00", isRead: true, messageType: "TEXT" },
    ]
  },
  "3-11": {
    userId: 3, userName: "Mike Wilson", userUsername: "mike_w",
    messages: [
      { id: 7, senderId: 3, senderName: "Mike Wilson", senderUsername: "mike_w", receiverId: 11, receiverName: "Admin", receiverUsername: "admin", content: "Can you check my score? I think there was an error.", timestamp: "2025-01-14T16:45:00", isRead: false, messageType: "TEXT" },
    ]
  },
};

export default function Chat() {
  const [conversations, setConversations] = useState<ConversationsMap>(sampleConversations);
  const [allUsers, setAllUsers] = useState<ChatUser[]>(sampleUsers);
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1-11");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set([1, 2, 5]));
  const [messageCount, setMessageCount] = useState(0); // CRITICAL: Counter to force re-renders
  const stompClient = useRef<Client | null>(null);
  const messageHandlerRef = useRef<(message: ChatMessage) => void>(() => {}); // REF for message handler
  const messagesEndRef = useRef<HTMLDivElement>(null); // REF for auto-scroll
  const [, forceUpdate] = useState({}); // Force update mechanism
  const { toast } = useToast();

  // Log re-renders for debugging
  console.log('🔄 Chat component rendering... Conversations:', Object.keys(conversations).length, 'Messages:', messageCount);

  // Connect to WebSocket
  useEffect(() => {
    connectWebSocket();
    loadAllUsers();
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = () => {
    console.log('🔌 Initializing WebSocket connection...');
    console.log('   URL:', WS_URL);
    console.log('   Admin User ID:', ADMIN_USER_ID);
    
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        userId: ADMIN_USER_ID.toString(), // CRITICAL: Required for authentication
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        console.log('   Subscribing to message queue...');
        setIsConnected(true);
        
        // Subscribe to admin's message queue
        const subscription1 = client.subscribe(`/user/${ADMIN_USER_ID}/queue/messages`, (message) => {
          console.log('📨 RAW WebSocket message received:', message.body);
          const chatMessage: ChatMessage = JSON.parse(message.body);
          console.log('📨 Parsed chat message:', chatMessage);
          // Use ref to always call the latest handler function
          messageHandlerRef.current(chatMessage);
        });
        console.log('   ✓ Subscribed to /user/' + ADMIN_USER_ID + '/queue/messages');

        // Subscribe to online status updates
        const subscription2 = client.subscribe('/topic/online', (message) => {
          console.log('👤 Online status update:', message.body);
          const status = JSON.parse(message.body);
          handleOnlineStatusUpdate(status.userId, status.isOnline);
        });
        console.log('   ✓ Subscribed to /topic/online');

        toast({
          title: "Connected",
          description: "Real-time chat monitoring active",
        });
      },
      onDisconnect: () => {
        console.log('❌ Disconnected from WebSocket');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('⚠️ STOMP error:', frame);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server",
          variant: "destructive",
        });
      },
      onWebSocketError: (event) => {
        console.error('⚠️ WebSocket error:', event);
      },
      onWebSocketClose: (event) => {
        console.log('❌ WebSocket closed:', event);
      },
    });

    console.log('🚀 Activating STOMP client...');
    client.activate();
    stompClient.current = client;
  };

  const disconnectWebSocket = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
  };

// Keep the handler ref updated with the latest function
  useEffect(() => {
    messageHandlerRef.current = handleIncomingMessage;
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messageCount, selectedConversation]);

  const handleIncomingMessage = (message: ChatMessage) => {
    console.log('�🚀🚀 INCOMING MESSAGE HANDLER CALLED 🚀🚀🚀');
    console.log('📨 Message:', message.id, '-', message.content);
    console.log('   From:', message.senderName, '(', message.senderId, ') → To:', message.receiverName, '(', message.receiverId, ')');
    
    // Determine which user this conversation is with
    const otherUserId = message.senderId === ADMIN_USER_ID ? message.receiverId : message.senderId;
    const otherUserName = message.senderId === ADMIN_USER_ID ? message.receiverName : message.senderName;
    const otherUserUsername = message.senderId === ADMIN_USER_ID ? message.receiverUsername : message.senderUsername;
    const conversationKey = `${Math.min(ADMIN_USER_ID, otherUserId)}-${Math.max(ADMIN_USER_ID, otherUserId)}`;

    console.log('   🔑 Conversation Key:', conversationKey);

    // Use functional update with OBJECT (not Map) for better React reactivity
    setConversations(prevConversations => {
      console.log('   📊 Previous conversations count:', Object.keys(prevConversations).length);
      
      const existing = prevConversations[conversationKey];

      if (existing) {
        // Check if message already exists
        const messageExists = existing.messages.some(m => m.id === message.id);
        if (messageExists) {
          console.log('   ⚠️ Message already exists, skipping duplicate');
          return prevConversations;
        }
        
        console.log('   ✅ Adding message to existing conversation');
        // Return NEW object with updated conversation
        return {
          ...prevConversations,
          [conversationKey]: {
            ...existing,
            messages: [...existing.messages, message]
          }
        };
      } else {
        console.log('   ✅ Creating NEW conversation');
        // Return NEW object with new conversation
        return {
          ...prevConversations,
          [conversationKey]: {
            userId: otherUserId,
            userName: otherUserName,
            userUsername: otherUserUsername,
            messages: [message]
          }
        };
      }
    });

    // CRITICAL: Force re-render by updating message counter
    setMessageCount(prev => {
      const newCount = prev + 1;
      console.log('   🔢 Incrementing messageCount from', prev, 'to', newCount);
      return newCount;
    });

    // Force component re-render
    forceUpdate({});
    
    console.log('✅ State updates complete - component should re-render now');

    // Show toast notification
    if (message.receiverId === ADMIN_USER_ID) {
      toast({
        title: `New message from ${message.senderName}`,
        description: message.content.substring(0, 50),
      });
    }
    
    console.log('✓ handleIncomingMessage completed - UI should update now!');
  };

  const handleOnlineStatusUpdate = (userId: number, isOnline: boolean) => {
    setOnlineUsers(prev => {
      const updated = new Set(prev);
      if (isOnline) {
        updated.add(userId);
      } else {
        updated.delete(userId);
      }
      return updated;
    });

    // Update user list
    setAllUsers(prev => prev.map(user => 
      user.userId === userId ? { ...user, isOnline } : user
    ));
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/${ADMIN_USER_ID}`);
      if (response.ok) {
        const users: ChatUser[] = await response.json();
        if (users && users.length > 0) {
          setAllUsers(users);
          
          // Set initial online users
          const online = new Set(users.filter(u => u.isOnline).map(u => u.userId));
          setOnlineUsers(online);

          // Load conversations for users with existing chats
          users.forEach(user => {
            if (user.lastMessage) {
              loadConversation(user.userId, user.name, user.username);
            }
          });
        }
      }
      // If API fails or returns empty, keep sample data
    } catch (error) {
      console.error('Failed to load users, using sample data:', error);
      // Keep sample data - already initialized
    }
  };

  const loadConversation = async (userId: number, userName: string, userUsername: string) => {
    try {
      const response = await fetch(`${BASE_URL}/conversation/${ADMIN_USER_ID}/${userId}`);
      const messages: ChatMessage[] = await response.json();
      
      const conversationKey = `${Math.min(ADMIN_USER_ID, userId)}-${Math.max(ADMIN_USER_ID, userId)}`;
      setConversations(prev => ({
        ...prev,
        [conversationKey]: {
          userId,
          userName,
          userUsername,
          messages: messages, // Keep order: oldest at top, newest at bottom
        }
      }));
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async (receiverId: number, content: string) => {
    if (!content.trim()) return;

    try {
      const response = await fetch(`${BASE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: ADMIN_USER_ID,
          receiverId: receiverId,
          content: content.trim(),
          messageType: 'TEXT',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Message will be added via WebSocket notification
        return true;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
    return false;
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/message/${messageId}?senderId=${ADMIN_USER_ID}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Remove message from state
        setConversations(prev => {
          const updated: ConversationsMap = {};
          Object.keys(prev).forEach(key => {
            updated[key] = {
              ...prev[key],
              messages: prev[key].messages.filter(m => m.id !== messageId)
            };
          });
          return updated;
        });

        toast({
          title: "Success",
          description: "Message deleted",
        });
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert object to array for rendering
  const activeConversations = Object.values(conversations).filter(conv => conv.messages.length > 0);
  const selectedConv = selectedConversation ? conversations[selectedConversation] : null;

  // CRITICAL: Log when conversations or selectedConv changes
  useEffect(() => {
    console.log('🔄 Conversations updated! Total:', Object.keys(conversations).length, 'Active:', activeConversations.length);
    if (selectedConv) {
      console.log('   Selected conversation has', selectedConv.messages.length, 'messages');
    }
  }, [conversations, messageCount, selectedConv]);

  return (
    <DashboardLayout title="CHAT MONITORING" subtitle="Monitor all chat activity in the application">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
              <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500' : 'fill-red-500'}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                {onlineUsers.size} online now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Total conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(conversations).reduce((acc, conv) => acc + conv.messages.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all chats
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle>All Conversations</CardTitle>
            <CardDescription>View and monitor all user conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="conversations" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations">Active Chats</TabsTrigger>
                <TabsTrigger value="users">All Users</TabsTrigger>
              </TabsList>

              {/* Active Conversations Tab */}
              <TabsContent value="conversations" className="space-y-4">
                {activeConversations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active conversations yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" key={`conversations-${messageCount}`}>
                    {activeConversations.map(conv => {
                      const conversationKey = `${Math.min(ADMIN_USER_ID, conv.userId)}-${Math.max(ADMIN_USER_ID, conv.userId)}`;
                      const lastMessage = conv.messages[conv.messages.length - 1];
                      const isOnline = onlineUsers.has(conv.userId);

                      return (
                        <Card
                          key={`${conversationKey}-${conv.messages.length}-${messageCount}`}
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => setSelectedConversation(conversationKey)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.userId}`} />
                                  <AvatarFallback>{conv.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {isOnline && (
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold truncate">{conv.userName}</p>
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {conv.messages.length}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{conv.userUsername}</p>
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {lastMessage.content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(lastMessage.timestamp), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* All Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div
                        key={user.userId}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          const conversationKey = `${Math.min(ADMIN_USER_ID, user.userId)}-${Math.max(ADMIN_USER_ID, user.userId)}`;
                          if (!conversations[conversationKey]) {
                            loadConversation(user.userId, user.name, user.username);
                          }
                          setSelectedConversation(conversationKey);
                        }}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {user.isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{user.name}</p>
                            {user.isOnline && (
                              <Badge variant="outline" className="ml-2 text-xs">Online</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.username}</p>
                          {user.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {user.lastMessage} • {user.lastMessageTime}
                            </p>
                          )}
                        </div>
                        {user.unreadCount > 0 && (
                          <Badge variant="destructive">{user.unreadCount}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected Conversation Dialog */}
        {selectedConv && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConv.userId}`} />
                    <AvatarFallback>{selectedConv.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedConv.userName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{selectedConv.userUsername}</span>
                      {onlineUsers.has(selectedConv.userId) && (
                        <Badge variant="outline">Online</Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedConversation(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4" key={`conv-${selectedConversation}-${messageCount}`}>
                  {selectedConv.messages.map((message, index) => {
                    const isSent = message.senderId === ADMIN_USER_ID;
                    return (
                      <div
                        key={`${message.id}-${index}-${messageCount}`}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`rounded-lg px-4 py-2 ${
                            isSent 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm font-medium mb-1">
                              {isSent ? 'Admin' : message.senderName}
                            </p>
                            <p>{message.content}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                            </p>
                            {isSent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteMessage(message.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Type a message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      sendMessage(selectedConv.userId, input.value);
                      input.value = '';
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    sendMessage(selectedConv.userId, input.value);
                    input.value = '';
                  }}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
