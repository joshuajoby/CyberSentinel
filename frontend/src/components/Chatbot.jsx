import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Sparkles, X, Send } from 'lucide-react';

import { useLanguage } from '../LanguageContext';

const API = 'http://localhost:8000/api';

const WELCOME_MSG = {
  id: 0,
  role: 'bot',
  text: "Hi! I'm CyberSentinel AI — your cybersecurity assistant.\n\nI can help you with:\n• Identifying phishing attacks\n• Password & account security\n• Safe browsing tips\n• Reporting scams\n• How to use our scanners\n\nWhat would you like to know?",
};

export default function Chatbot({ onNavigate }) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(1);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: language }),
      });
      const data = await res.json();
      const botMsg = { id: Date.now() + 1, role: 'bot', text: data.response || 'Sorry, I couldn\'t process that.' };
      setMessages(prev => [...prev, botMsg]);
      
      if (data.action && onNavigate) {
        if (data.action === 'navigate_settings') onNavigate('settings');
        if (data.action === 'navigate_url') onNavigate('url');
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: 'Connection error. Please check if the backend server is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const SUGGESTIONS = [
    'What is phishing?',
    'How to spot scams?',
    'Password tips',
    'Report phishing',
  ];

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--accent-orange)' }}>{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className="chatbot-bubble" style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
      {open && (
        <div className="chatbot-panel ios-glass" id="chatbot-panel" style={{
          width: 360,
          height: 500,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bot size={20} style={{ color: 'var(--accent-orange)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Intelligence Assistant</div>
                <div style={{ fontSize: 10, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulseGlow 1.5s infinite' }} />
                  ACTIVE STATE
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            ><X size={18} /></button>
          </div>

          {/* Messages scrollarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20, flex: 1, overflowY: 'auto' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'bot' && <div style={{ marginTop: 2 }}><Bot size={16} style={{ color: 'var(--text-secondary)' }} /></div>}
                
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  background: msg.role === 'user' ? 'var(--accent-orange)' : 'var(--bg-secondary)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  borderRadius: 16,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'bot' ? 4 : 16,
                }}>
                  {renderText(msg.text)}
                </div>

                {msg.role === 'user' && <div style={{ marginTop: 2 }}><User size={16} style={{ color: 'var(--text-secondary)' }} /></div>}
              </div>
            ))}
            
            {loading && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                 <div style={{ marginTop: 2 }}><Bot size={16} style={{ color: 'var(--text-secondary)' }} /></div>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 16, borderBottomLeftRadius: 4
                }}>
                  <div className="typing-indicator" style={{ padding: 0 }}>
                    <div className="typing-dot" style={{ backgroundColor: 'var(--accent-orange)' }} />
                    <div className="typing-dot" style={{ backgroundColor: 'var(--accent-orange)' }} />
                    <div className="typing-dot" style={{ backgroundColor: 'var(--accent-orange)' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: '6px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div style={{ padding: '14px 20px', background: 'var(--bg-secondary)', display: 'flex', gap: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <input
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: 'var(--text-primary)'
              }}
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: input.trim() ? 'var(--accent-orange)' : 'var(--text-muted)',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Open AI Chat Assistant"
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: 'var(--accent-orange)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px var(--accent-orange-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <X size={24} /> : <Sparkles size={24} />}
        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 14, height: 14, borderRadius: 7,
            background: '#EF4444', border: '2px solid var(--bg-primary)'
          }} />
        )}
      </button>
    </div>
  );
}
