import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import './ChatList.css';
import ChatBox from './ChatBox';
import studentClassApi from '../../services/api/studentClassApi';
import classApi from '../../services/api/classApi';

// --- Type Definitions ---

// Interface for the raw class data from API
interface ClassApiResponse {
  classId: number;
  classCode: string;
  className?: string;
  subjectName?: string;
}

interface ClassChatItem {
  classId: number;
  classCode: string;
  className: string;
  subjectName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSender?: string;
  unreadCount: number;
  isOnline: boolean;
  hasNewMessages?: boolean;
}

interface ChatListProps {
  currentUsername: string;
  currentRole: 'TEACHER' | 'STUDENT';
}

// Extend Window interface for Webkit Audio (Safari support)
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const ChatList = ({ currentUsername, currentRole }: ChatListProps) => {
  const [classList, setClassList] = useState<ClassChatItem[]>([]);
  const [openChats, setOpenChats] = useState<Set<number>>(new Set());
  const [minimizedChats, setMinimizedChats] = useState<Set<number>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  //  Play notification sound
  const playNotificationSound = () => {
    try {
      // FIX: Use the extended Window interface instead of (window as any)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('[ChatList] Could not play sound:', error);
    }
  };

  //  Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  };

  //  Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  //  Load classes and unread counts
  useEffect(() => {
    loadClassesWithUnreadCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);

  //  Load classes AND their unread counts from database
  const loadClassesWithUnreadCounts = async () => {
    setLoading(true);
    try {
      console.log('[ChatList] Loading classes for role:', currentRole);

      // 1. Load classes
      // FIX: Replaced 'any[]' with 'ClassApiResponse[]'
      let classes: ClassApiResponse[] = [];
      
      if (currentRole === 'TEACHER') {
        classes = await classApi.getMyClasses();
        console.log('[ChatList] Teacher classes loaded:', classes);
      } else {
        classes = await studentClassApi.getMyClasses();
        console.log('[ChatList] Student classes loaded:', classes);
      }

      console.log('[ChatList] Loaded classes:', classes.length);

      // 2. Load unread counts from database
      const token = localStorage.getItem('token');
      const unreadResponse = await fetch('http://localhost:8080/api/chat/unread-counts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let unreadByClass: Record<number, number> = {};
      if (unreadResponse.ok) {
        const unreadData = await unreadResponse.json();
        unreadByClass = unreadData.unreadByClass || {};
        console.log('[ChatList]  Loaded unread counts:', unreadByClass);
      } else {
        console.error('[ChatList]  Failed to load unread counts:', unreadResponse.status);
      }

      // 3. Merge classes with unread counts
      // FIX: Removed ': any' as Typescript now infers 'cls' is 'ClassApiResponse'
      const chatItems: ClassChatItem[] = classes.map((cls) => {
        console.log('[ChatList] Processing class:', cls.classId, cls);
        
        return {
          classId: cls.classId,
          classCode: cls.classCode,
          //  Handle both student and teacher responses via optional chaining/fallback
          className: cls.subjectName || cls.className || cls.classCode || 'Lớp học',
          subjectName: cls.subjectName || cls.className || cls.classCode || 'Lớp học',
          unreadCount: unreadByClass[cls.classId] || 0,
          isOnline: true,
          hasNewMessages: (unreadByClass[cls.classId] || 0) > 0,
        };
      });
      
      console.log('[ChatList]  Merged chat items:', chatItems);

      // 4. Sort by unread count
      chatItems.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return a.classCode.localeCompare(b.classCode);
      });

      setClassList(chatItems);
    } catch (error) {
      console.error('[ChatList]  Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  //  ENHANCED: Open chat and mark as read in database
  const openChat = async (classId: number) => {
    setOpenChats((prev) => new Set(prev).add(classId));
    setMinimizedChats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
    
    //  Mark as read in database
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/chat/${classId}/mark-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('[ChatList]  Marked all messages as read for class:', classId);
      }
    } catch (error) {
      console.error('[ChatList]  Failed to mark as read:', error);
    }

    //  Reset UI immediately
    setClassList((prev) =>
      prev.map((item) =>
        item.classId === classId 
          ? { ...item, unreadCount: 0, hasNewMessages: false } 
          : item
      )
    );
  };

  // Đóng chat
  const closeChat = (classId: number) => {
    setOpenChats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
    setMinimizedChats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
  };

  //  ENHANCED: Minimize/Maximize with mark as read
  const minimizeChat = async (classId: number) => {
    const wasMinimized = minimizedChats.has(classId);
    
    setMinimizedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });

    //  If maximizing (was minimized), mark as read
    if (wasMinimized) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:8080/api/chat/${classId}/mark-read`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Reset UI
        setClassList((prev) =>
          prev.map((item) =>
            item.classId === classId ? { ...item, hasNewMessages: false, unreadCount: 0 } : item
          )
        );
      } catch (error) {
        console.error('[ChatList] Failed to mark as read on maximize:', error);
      }
    }
  };

  //  ENHANCED: Handle new message (increment unread in UI)
  const handleNewMessage = (classId: number, messageContent?: string, senderUsername?: string) => {
    const isMinimized = minimizedChats.has(classId);
    const isClosed = !openChats.has(classId);
    
    //  Only increment if minimized or closed
    if (isMinimized || isClosed) {
      setClassList((prev) => {
        const updated = prev.map((item) => {
          if (item.classId === classId) {
            return {
              ...item,
              unreadCount: item.unreadCount + 1, //  Optimistic UI update
              lastMessage: messageContent || 'Tin nhắn mới',
              lastMessageTime: new Date().toISOString(),
              lastMessageSender: senderUsername,
              hasNewMessages: true,
            };
          }
          return item;
        });

        // Sort by unread
        return updated.sort((a, b) => {
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          if (a.lastMessageTime && b.lastMessageTime) {
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
          }
          return 0;
        });
      });

      // Play sound and notification
      playNotificationSound();
      
      const classItem = classList.find(c => c.classId === classId);
      if (classItem && senderUsername) {
        showBrowserNotification(
          `${classItem.subjectName} - ${classItem.classCode}`,
          `${senderUsername}: ${messageContent || 'Tin nhắn mới'}`
        );
      }
    }
  };

  const sortedClassList = [...classList].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    if (a.lastMessageTime && b.lastMessageTime) {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    }
    return 0;
  });

  const totalUnread = classList.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <>
      {/* Chat List Button */}
      <div className="chat-list-container">
        <button
          className={`chat-list-toggle ${isExpanded ? 'expanded' : ''} ${totalUnread > 0 ? 'has-unread' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <MessageCircle size={24} />
          {totalUnread > 0 && (
            <div className="total-unread-badge pulse-animation">
              {totalUnread > 99 ? '99+' : totalUnread}
            </div>
          )}
        </button>

        {/* Chat List Panel */}
        {isExpanded && (
          <div className="chat-list-panel">
            <div className="chat-list-header">
              <h3>Nhóm chat lớp học</h3>
              {totalUnread > 0 && (
                <span className="header-unread-count">{totalUnread} chưa đọc</span>
              )}
              <button className="close-list-btn" onClick={() => setIsExpanded(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="chat-list-items">
              {loading ? (
                <div className="loading-state-small">
                  <div className="spinner-small"></div>
                  <p>Đang tải...</p>
                </div>
              ) : sortedClassList.length === 0 ? (
                <div className="no-classes">
                  <MessageCircle size={48} strokeWidth={1.5} />
                  <p>Chưa có lớp học nào</p>
                </div>
              ) : (
                sortedClassList.map((item) => (
                  <div
                    key={item.classId}
                    className={`chat-list-item ${openChats.has(item.classId) ? 'active' : ''} ${
                      item.unreadCount > 0 ? 'has-new-message' : ''
                    }`}
                    onClick={() => openChat(item.classId)}
                  >
                    <div className="chat-item-avatar">
                      {item.classCode.substring(0, 2).toUpperCase()}
                      {item.isOnline && <div className="online-dot" />}
                      {item.unreadCount > 0 && (
                        <div className="avatar-unread-badge">{item.unreadCount}</div>
                      )}
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-top">
                        <span className={`chat-item-name ${item.unreadCount > 0 ? 'unread' : ''}`}>
                          {item.subjectName}
                        </span>
                        {item.lastMessageTime && (
                          <span className="chat-item-time">
                            {new Date(item.lastMessageTime).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      
                      {/* "Tin nhắn mới chưa đọc" indicator */}
                      {item.hasNewMessages && item.unreadCount > 0 && (
                        <div className="new-messages-indicator">
                          <span className="new-messages-text">
                            {item.unreadCount} tin nhắn mới chưa đọc
                          </span>
                        </div>
                      )}
                      
                      <div className="chat-item-bottom">
                        {item.lastMessage ? (
                          <span className={`chat-item-last-message ${item.unreadCount > 0 ? 'unread' : ''}`}>
                            {item.lastMessageSender && `${item.lastMessageSender}: `}
                            {item.lastMessage}
                          </span>
                        ) : (
                          <span className="chat-item-code">{item.classCode}</span>
                        )}
                        {item.unreadCount > 0 && (
                          <div className="unread-badge pulse-animation">
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Open Chat Boxes */}
      {Array.from(openChats).map((classId, index) => {
        const classItem = classList.find((c) => c.classId === classId);
        if (!classItem) return null;

        return (
          <div
            key={classId}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: `${100 + index * 400}px`,
              zIndex: 9999 - index,
            }}
          >
            <ChatBox
              classId={classItem.classId}
              className={classItem.subjectName}
              classCode={classItem.classCode}
              currentUsername={currentUsername}
              onClose={() => closeChat(classId)}
              onMinimize={() => minimizeChat(classId)}
              isMinimized={minimizedChats.has(classId)}
              onNewMessage={(content, sender) => handleNewMessage(classId, content, sender)}
            />
          </div>
        );
      })}
    </>
  );
};

export default ChatList;