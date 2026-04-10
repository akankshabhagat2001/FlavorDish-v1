import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage } from '../services/chatService';

interface ChatModalProps {
  orderId: string;
  restaurantId: string;
  customerId: string;
  restaurantName: string;
  currentUserId: string;
  userRole: 'customer' | 'restaurant';
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  orderId,
  restaurantId,
  customerId,
  restaurantName,
  currentUserId,
  userRole,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomId = `order-${orderId}`;

  useEffect(() => {
    const initChat = async () => {
      try {
        setLoading(true);
        if (!chatService.isConnected()) {
          await chatService.initialize();
        }
        chatService.joinChatRoom(orderId, restaurantId, customerId);
        
        // Load initial messages
        const storedMessages = localStorage.getItem(`chat-${roomId}`);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setLoading(false);
      }
    };

    initChat();

    // Listen for new messages
    const handleMessageReceived = () => {
      const updatedMessages = chatService.getMessages(roomId);
      setMessages([...updatedMessages]);
      localStorage.setItem(`chat-${roomId}`, JSON.stringify(updatedMessages));
    };

    // Listen for typing indicators
    const handleTyping = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.roomId === roomId && customEvent.detail.user !== currentUserId) {
        setOthersTyping(customEvent.detail.isTyping);
      }
    };

    window.addEventListener('chat:message', handleMessageReceived);
    window.addEventListener('chat:typing', handleTyping);

    return () => {
      window.removeEventListener('chat:message', handleMessageReceived);
      window.removeEventListener('chat:typing', handleTyping);
      chatService.leaveChatRoom(roomId);
    };
  }, [orderId, restaurantId, customerId, roomId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      chatService.sendTypingIndicator(roomId, currentUserId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatService.sendTypingIndicator(roomId, currentUserId, false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      chatService.sendMessage(roomId, currentUserId, userRole, inputValue);
      
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: currentUserId,
        senderRole: userRole,
        message: inputValue,
        timestamp: Date.now(),
        read: true,
      };
      
      setMessages([...messages, newMessage]);
      const allMessages = [...messages, newMessage];
      localStorage.setItem(`chat-${roomId}`, JSON.stringify(allMessages));
      
      setInputValue('');
      setIsTyping(false);
      chatService.sendTypingIndicator(roomId, currentUserId, false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#EF4F5F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Chat with {restaurantName}</h2>
            <p className="text-sm text-white/80">Order #{orderId.substring(0, 8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 p-2 rounded-full transition-all"
          >
            ✕
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <i className="fa-solid fa-comments text-4xl mb-3 block"></i>
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.sender === currentUserId
                      ? 'bg-[#EF4F5F] text-white rounded-br-none'
                      : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.sender === currentUserId ? 'text-white/70' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                    {msg.sender === currentUserId && msg.read && ' ✓✓'}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {othersTyping && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-gray-200 px-4 py-2 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border-2 border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#EF4F5F] transition-colors"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-6 py-2 rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
