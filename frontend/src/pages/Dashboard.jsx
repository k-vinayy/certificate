import React, { useEffect, useState } from 'react';
import { Users, FileCheck, Send, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    participants: 0,
    generated: 0,
    sent: 0,
    failed: 0,
  });
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await apiService.getHistory();
      const history = response.data;
      
      const generated = history.filter(h => h.status === 'Generated').length;
      const sent = history.filter(h => h.status === 'Sent').length;
      const failed = history.filter(h => h.status === 'Failed' || h.status === 'Failed Generation').length;
      
      setStats({
        participants: history.length,
        generated: generated + sent, // Sent implies generated
        sent,
        failed,
      });
    } catch (e) {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  const checkProgress = async () => {
    try {
      const response = await apiService.getSendStatus();
      if (response.data.status === 'sending') {
        setProgress(response.data);
      } else {
        setProgress(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 3 seconds for stats & send progress
    const interval = setInterval(() => {
      fetchStats();
      checkProgress();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: 'Total Participants', value: stats.participants, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { label: 'Generated Certificates', value: stats.generated, icon: FileCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { label: 'Emails Dispatched', value: stats.sent, icon: Send, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { label: 'Delivery Failures', value: stats.failed, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/10">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold md:text-3xl">Certificate Studio</h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Generate and dispatch premium participation certificates to Google Student Ambassador event attendees in a single click. Keep track of deliveries with live mail telemetry below.
          </p>
        </div>
      </div>

      {/* Progress telemetry banner (only visible during background dispatching) */}
      {progress && (
        <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950/40 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <h3 className="font-semibold text-sm">Sending Certificates...</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {progress.sent + progress.failed} / {progress.total} Completed
            </span>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Current: <strong className="text-slate-700 dark:text-slate-300">{progress.current_recipient || 'Preparing...'}</strong></span>
            <div className="flex gap-4">
              <span>Success: <strong className="text-emerald-600">{progress.sent}</strong></span>
              <span>Failed: <strong className="text-rose-600">{progress.failed}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all duration-200"
            >
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{card.label}</span>
                <h3 className="text-3xl font-bold">{loading ? '-' : card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl space-y-4">
          <h3 className="font-semibold text-lg">Generate Certificates</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Upload custom templates, signature files, font designs, and the excel spreadsheets to run a new batch generation workflow.
          </p>
          <button 
            onClick={() => setActiveTab('generator')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 group"
          >
            Open Generator
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl space-y-4">
          <h3 className="font-semibold text-lg">SMTP Configuration</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Configure host details, ports, auth settings, and secure app passwords to send certificates directly from your ambassador mail address.
          </p>
          <button 
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 group"
          >
            Configure SMTP Settings
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
