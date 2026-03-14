import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, X, User, Bot, Loader2 } from "lucide-react";

// Simple cn utility for class concatenation if Tailwind is available or just plain classes
const cn = (...classes) => classes.filter(Boolean).join(' ');

const ChatBox = ({ path, restaurantId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Xin chào! Tôi là trợ lý AI của FoodieHub. Tôi có thể giúp gì cho bạn hôm nay?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_BASE}/chatAI/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: inputValue,
          restaurantId: restaurantId 
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiResponse = {
          text: data.advice,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.message || "Lỗi khi nhận phản hồi từ AI");
      }
    } catch (error) {
      console.error("Chat AI error:", error);
      const errorMessage = {
        text: "Xin lỗi, trợ lý đang bận xử lý, vui lòng thử lại sau.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Ẩn chatbot trên trang quản trị
  if (path?.startsWith('/admin') || path?.startsWith('/brand') || path?.startsWith('/shipper')) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          marginBottom: '1rem',
          width: 'min(400px, 90vw)',
          height: '500px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
          animation: 'chatSlideIn 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #ee4d2d 0%, #ff6b35 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>FoodieHub AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fafafa' }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  maxWidth: '85%',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: msg.sender === 'user' ? '#ee4d2d' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : '#ee4d2d',
                  border: msg.sender === 'user' ? 'none' : '1px solid #f0f0f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  flexShrink: 0
                }}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  backgroundColor: msg.sender === 'user' ? '#ee4d2d' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : '#333',
                  border: msg.sender === 'user' ? 'none' : '1px solid #f0f0f0',
                  borderTopRightRadius: msg.sender === 'user' ? '2px' : '14px',
                  borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '85%', alignSelf: 'flex-start' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ee4d2d'
                }}>
                  <Bot size={16} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '14px', borderTopLeftRadius: '2px', background: '#fff', border: '1px solid #f0f0f0' }}>
                   <div style={{ display: 'flex', gap: '4px' }}>
                     <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ccc', animation: 'blink 1.4s infinite 0s' }}></span>
                     <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ccc', animation: 'blink 1.4s infinite 0.2s' }}></span>
                     <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ccc', animation: 'blink 1.4s infinite 0.4s' }}></span>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div style={{ padding: '1rem', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                placeholder="Tôi có thể làm gì cho bạn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '24px',
                  border: '1px solid #e0e0e0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#f9f9f9'
                }}
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#ee4d2d',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (isTyping || !inputValue.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isTyping || !inputValue.trim()) ? 0.6 : 1
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Button Launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#ee4d2d',
          color: '#fff',
          border: 'none',
          boxShadow: '0 6px 20px rgba(238, 77, 45, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
           <span style={{
             position: 'absolute', top: '0', right: '0', width: '12px', height: '12px',
             background: '#ffeb3b', borderRadius: '50%', border: '2px solid #ee4d2d'
           }}></span>
        )}
      </button>

      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default ChatBox;
