import React from 'react';
import { useLanguage } from '../LanguageContext';

export default function LandingPage({ onNavigate }) {
  const { t } = useLanguage();

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', width: '100%' }}>
      
      {/* ── HERO SECTION (Deep Blue) ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2b00ff 0%, #17008a 100%)', 
        minHeight: 'calc(100vh - 76px)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract background graphics */}
        <div style={{ position: 'absolute', right: '5%', top: '10%', opacity: 0.2 }}>
           <svg width="400" height="400" viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#fff" strokeWidth="2"/></svg>
        </div>

        <div className="main-container" style={{ padding: '0 40px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 60, position: 'relative', zIndex: 10, width: '100%' }}>
          
          {/* Left Column: Text */}
          <div style={{ flex: 1.2, paddingRight: 40 }}>
            <h1 style={{ 
              color: 'white',
              fontSize: '64px', 
              fontWeight: 700, 
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '24px'
            }}>
              {t('hero.title')}
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)',
              fontSize: '20px', 
              lineHeight: 1.6, 
              opacity: 0.9,
              marginBottom: '40px',
              maxWidth: '580px'
            }}>
              {t('hero.subtitle')}
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button 
                onClick={() => onNavigate('dashboard')}
                style={{ 
                  background: 'white', color: '#17008a', padding: '16px 32px', 
                  borderRadius: 30, fontSize: 16, fontWeight: 700, border: 'none', 
                  cursor: 'pointer', transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t('hero.signup')}
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                style={{ 
                  background: 'transparent', color: 'white', padding: '16px 32px', 
                  borderRadius: 30, fontSize: 16, fontWeight: 700, border: '2px solid white', 
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#17008a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'white'; }}
              >
                {t('hero.login')}
              </button>
            </div>
          </div>

          {/* Right Floating Image */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'flex-end',
            animation: 'fadeInUp 1s ease-out forwards'
          }}>
            <img src="/cyber_shield.png" alt="Cyber Shield" style={{ width: '100%', maxWidth: 500, objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }} />
          </div>
          
        </div>
      </div>

      {/* ── SECONDARY CONTENT (White) ── */}
      <div className="main-container" style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', gap: 100 }}>
        
        {/* Purpose Section */}
        <div style={{ maxWidth: 800 }}>
          <div style={{ width: 40, height: 2, background: '#4a90e2', marginBottom: 20 }} />
          <h2 style={{ fontSize: 36, fontWeight: 300, color: '#4a4a4a', marginBottom: 24 }}>
            Our Purpose in Action
          </h2>
          <p style={{ fontSize: 16, color: '#4a4a4a', lineHeight: 1.8 }}>
            To build a resilient and future-ready cyber workforce, it starts with empowering the leaders and system administrators who will shape it. Across networks, endpoints, and cloud infrastructure, many institutions lack automated tools with the precision, expertise, or speed to effectively neutralize threats. CyberSentinel, the academic initiative of secure operations, bridges that gap.
          </p>
        </div>

        {/* Video Series Section (Side-by-side) */}
        <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
          
          {/* Graphic Side */}
          <div style={{ flex: 1, position: 'relative' }}>
            <img src="/cyber_network.png" alt="Cyber Network" style={{ width: '100%', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
          </div>

          {/* Text/List Side */}
          <div style={{ flex: 1.2 }}>
            <h2 style={{ fontSize: 36, fontWeight: 300, color: '#4a4a4a', marginBottom: 24 }}>
              Cyber Safety Series
            </h2>
            <p style={{ fontSize: 15, color: '#4a4a4a', lineHeight: 1.6, marginBottom: 32 }}>
              Short, high-fidelity modules that break down important cybersecurity concepts that administrators should know to protect digital assets.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                'URL & Network Call Safety',
                'Authentication Endpoint Scans',
                'Making Strong Passwords',
                'Phishing Detection Models',
                'Ransomware OCR Analysis',
                'Social Media Impersonation'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#4a4a4a', fontSize: 15 }}>
                  <div style={{ width: 4, height: 4, background: '#34c759', borderRadius: '50%' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
