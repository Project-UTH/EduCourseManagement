import { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, MessageCircle } from 'lucide-react';
import './ChatBox.css';

// --- Types ---

interface Message {
  id: number;
  senderUsername: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

interface ChatBoxProps {
  classId: number;
  className: string;
  classCode: string;
  currentUsername: string;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  onNewMessage?: (content: string, sender: string) => void;
}

interface StompMessage {
  body: string;
}

interface StompClient {
  connected: boolean;
  debug: ((msg: string) => void) | null;
  connect: (
    headers: Record<string, string>,
    onConnect: () => void,
    onError: (error: unknown) => void
  ) => void;
  subscribe: (
    destination: string,
    callback: (message: StompMessage) => void
  ) => void;
  send: (destination: string, headers: Record<string, string>, body: string) => void;
  disconnect: () => void;
}

declare global {
  interface Window {
    SockJS: new (url: string) => unknown;
    Stomp: {
      over: (socket: unknown) => StompClient;
    };
  }
}

const ChatBox = ({
  classId,
  className,
  classCode,
  currentUsername,
  onClose,
  onMinimize,
  isMinimized,
  onNewMessage,
}: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Use refs for values accessed inside closures (socket callbacks)
  // to prevent unnecessary reconnection or stale state.
  const stompClientRef = useRef<StompClient | null>(null);
  const isMinimizedRef = useRef(isMinimized); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep isMinimizedRef in sync with prop
  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // FIX: Reset unread count when opening chat.
  // Removed 'unreadCount' from dependencies to avoid loop/lint error.
  useEffect(() => {
  if (!isMinimized) {
    const id = setTimeout(() => setUnreadCount(0), 0);
    return () => clearTimeout(id);
  }
}, [isMinimized]);


  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/chat/${classId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('[ChatBox] Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [classId]);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const SockJS = window.SockJS;
    const Stomp = window.Stomp;

    if (!SockJS || !Stomp) {
      console.error('[ChatBox] SockJS or Stomp not loaded');
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    client.debug = null;

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('[ChatBox] WebSocket connected for class:', classId);
        setIsConnected(true);

        client.subscribe(`/topic/class/${classId}`, (message: StompMessage) => {
          const receivedMessage: Message = JSON.parse(message.body);
          console.log('[ChatBox] New message received:', receivedMessage);
          
          setMessages((prev) => {
            const exists = prev.some(msg => 
              msg.id === receivedMessage.id && 
              msg.timestamp === receivedMessage.timestamp
            );
            
            if (exists) {
              return prev;
            }
            return [...prev, receivedMessage];
          });
          
          if (receivedMessage.senderUsername !== currentUsername) {
            // FIX: Use ref to check minimized state inside callback without 
            // causing the useEffect to re-run (and socket to reconnect).
            if (isMinimizedRef.current) {
              setUnreadCount(prev => prev + 1);
            }
            
            if (onNewMessage) {
              onNewMessage(receivedMessage.content, receivedMessage.senderUsername);
            }
          }
        });
      },
      (error: unknown) => {
        console.error('[ChatBox] WebSocket connection error:', error);
        setIsConnected(false);
      }
    );

    stompClientRef.current = client;

    return () => {
      if (client && client.connected) {
        client.disconnect();
        console.log('[ChatBox] WebSocket disconnected');
      }
    };
    // FIX: Removed isMinimized from dependencies to prevent reconnection loops
  }, [classId, currentUsername, onNewMessage]); 

  // Send message
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !stompClientRef.current || !isConnected) return;

    stompClientRef.current.send(
      `/app/chat.sendMessage/${classId}`,
      {},
      JSON.stringify({ content: inputMessage })
    );

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <div className="chat-box-minimized" onClick={onMinimize}>
        <div className="chat-minimized-header">
          <div className="chat-minimized-info">
            <div className="class-code-badge">{classCode.substring(0, 2).toUpperCase()}</div>
            <span className="class-name-mini">{className}</span>
          </div>
          <div className="minimized-status">
            {isConnected && <div className="online-indicator"></div>}
            {unreadCount > 0 && (
              <div className="minimized-unread-badge pulse-animation">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="class-avatar">
            {classCode.substring(0, 2).toUpperCase()}
          </div>
          <div className="chat-header-info">
            <div className="chat-class-name">{className}</div>
            <div className="chat-class-code">
              {classCode}
              {isConnected && (
                <span className="status-online">● Đang hoạt động</span>
              )}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-action-btn" onClick={onMinimize}>
            <Minimize2 size={18} />
          </button>
          <button className="chat-action-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-state">
            <MessageCircle size={48} strokeWidth={1.5} style={{ opacity: 0.3 }} />
            <p>Chưa có tin nhắn nào</p>
            <p className="empty-chat-hint">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${classId}-${msg.id}-${msg.timestamp}-${index}`}
              className={`message ${
                msg.senderUsername === currentUsername ? 'message-sent' : 'message-received'
              }`}
            >
              <div className="message-content">
                {msg.senderUsername !== currentUsername && (
                  <div className="message-sender">
                    {msg.senderUsername}
                    <span className="sender-role">{msg.senderRole}</span>
                  </div>
                )}
                <div className="message-bubble">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {!isConnected && (
          <div className="connection-warning">
             Đang kết nối lại...
          </div>
        )}
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Nhập tin nhắn..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;