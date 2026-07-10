import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    // Read from localStorage on mount
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.body;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
      >
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'generator' && <Generator />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </Layout>
    </>
  );
}
