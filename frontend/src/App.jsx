import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import AdminPage from './components/AdminPage';
import TopNavbar from './components/TopNavbar';
import Dashboard from './components/Dashboard';
import TextScanner from './components/TextScanner';
import UrlScanner from './components/UrlScanner';
import ScreenshotScanner from './components/ScreenshotScanner';
import AwarenessCenter from './components/AwarenessCenter';
import ApiSandbox from './components/ApiSandbox';
import Chatbot from './components/Chatbot';
import SubscribeModal from './components/SubscribeModal';
import GuidelinesPage from './components/GuidelinesPage';
import SettingsPanel from './components/SettingsPanel';
import IncidentInbox from './components/IncidentInbox';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('landing'); // Default is landing page
  const [pendingTab, setPendingTab] = useState(null); // Save redirection target
  
  // Modal visibility
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [authTab, setAuthTab] = useState('login');

  const openAuth = (tab) => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [triggerScanRefetch, setTriggerScanRefetch] = useState(0);

  const handleScanCompleted = () => {
    setTriggerScanRefetch(prev => prev + 1);
  };

  // Auth gate navigation helper
  const handleNavigate = (tabId) => {
    if (tabId === 'landing' || tabId === 'settings') {
      setActiveTab(tabId);
      return;
    }
    
    // Scanners, Dashboard, Quiz, Inbox require login
    if (!user) {
      setPendingTab(tabId);
      setAuthTab('login');
      setShowAuthModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  // Redirect to pending tab after successful login, or landing page after logout
  React.useEffect(() => {
    if (user) {
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
    } else {
      setActiveTab('landing');
      setPendingTab(null);
    }
  }, [user, pendingTab]);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('cs_theme') || 'light';
    document.body.className = '';
    if (savedTheme !== 'amber') {
      document.body.classList.add(`theme-${savedTheme}`);
    }
    const savedGlow = localStorage.getItem('cs_glow_intensity') || '75';
    document.documentElement.style.setProperty('--border-glow', `rgba(255, 90, 31, ${parseInt(savedGlow, 10) / 100 * 0.45})`);
  }, []);

  // Loading state — verify token
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        background: 'var(--bg-primary)',
      }}>
        <div className="cyber-bg" />
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, animation: 'float 2s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(59,130,246,0.5)',
        }}>🛡️</div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading CyberSentinel...</p>
      </div>
    );
  }

  // Admin control desk view
  if (showAdmin) {
    if (!isAdmin) {
      setShowAdmin(false);
      return null;
    }
    return (
      <>
        <div className="cyber-bg" />
        <div className="cyber-grid" style={{ opacity: 0.04 }} />
        <AdminPage onBack={() => setShowAdmin(false)} />
        {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
        <Chatbot />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* iOS Styled Top Navigation Bar */}
      <TopNavbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onSubscribe={() => setShowSubscribe(true)}
        onShowAdmin={() => setShowAdmin(true)}
        onAuth={openAuth}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'landing' ? (
          <LandingPage onNavigate={handleNavigate} />
        ) : (
          <div className="main-container">
            {activeTab === 'dashboard' && <Dashboard triggerScanRefetch={triggerScanRefetch} />}
            {activeTab === 'text' && <TextScanner onScanComplete={handleScanCompleted} />}
            {activeTab === 'url' && <UrlScanner onScanComplete={handleScanCompleted} />}
            {activeTab === 'screenshot' && <ScreenshotScanner onScanComplete={handleScanCompleted} />}
            {activeTab === 'quiz' && <AwarenessCenter />}
            {activeTab === 'api-sandbox' && <ApiSandbox />}
            {activeTab === 'guidelines' && <GuidelinesPage />}
            {activeTab === 'settings' && <SettingsPanel />}
            {activeTab === 'inbox' && <IncidentInbox />}
          </div>
        )}
      </main>

      {/* Auth overlay popup */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialTab={authTab} />

      {/* Alerts & assist bots */}
      {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
      <Chatbot onNavigate={handleNavigate} />
    </div>
  );
}

import { LanguageProvider } from './LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
