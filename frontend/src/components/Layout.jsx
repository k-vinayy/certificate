import React from 'react';
import { LayoutDashboard, Award, History, Settings, Sun, Moon } from 'lucide-react';

export default function Layout({ children, activeTab, setActiveTab, darkMode, setDarkMode }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generator', label: 'Certificate Generator', icon: Award },
    { id: 'history', label: 'Email History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight">Certificate Hub</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Student Ambassador</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dark Mode Toggle & Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : ''}`} />
            </div>
          </button>
          
          <div className="text-center text-xs text-slate-400 dark:text-slate-500">
            v1.0.0 &bull; Google Ambassador
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="font-semibold text-lg capitalize">
            {menuItems.find(item => item.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium">
              API Status: Connected
            </span>
          </div>
        </header>

        {/* Active Page View */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
