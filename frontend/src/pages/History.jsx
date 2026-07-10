import React, { useEffect, useState } from 'react';
import { Search, Download, Send, RefreshCw, Check, AlertTriangle, FileDown, MailWarning } from 'lucide-react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

export default function History() {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMails, setSendingMails] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await apiService.getHistory();
      setHistory(response.data);
    } catch (e) {
      toast.error("Failed to load history records");
    } finally {
      setLoading(false);
    }
  };

  const checkSendStatus = async () => {
    try {
      const response = await apiService.getSendStatus();
      setSendStatus(response.data);
      if (response.data.status === 'sending') {
        setSendingMails(true);
      } else {
        setSendingMails(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
    checkSendStatus();
    // Poll every 3 seconds for updates
    const interval = setInterval(() => {
      fetchHistory();
      checkSendStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendEmails = async (retryFailedOnly = false) => {
    setSendingMails(true);
    try {
      await apiService.sendMails(retryFailedOnly);
      toast.success(retryFailedOnly ? "Retrying failed emails..." : "Started sending certificates...");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to trigger email job.");
      setSendingMails(false);
    }
  };

  const handleResendIndividual = async (email) => {
    try {
      await apiService.resendMail(email);
      toast.success(`Successfully resent email to ${email}`);
      fetchHistory();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to send individual mail.");
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) return toast.error("No records available to export");
    
    const headers = ["Name", "Email", "Status", "Date Sent", "Filename"];
    const rows = history.map(item => [
      item.name,
      item.email,
      item.status,
      item.date_sent,
      item.filename
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "certificate_delivery_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants or status..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
          
          <a
            href={apiService.downloadZipUrl()}
            className="px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Download ZIP
          </a>

          <button
            onClick={() => handleSendEmails(true)}
            disabled={sendingMails || history.filter(h => h.status === 'Failed').length === 0}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            <MailWarning className="w-4 h-4" />
            Retry Failed
          </button>

          <button
            onClick={() => handleSendEmails(false)}
            disabled={sendingMails || history.length === 0}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {sendingMails ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Certificates
          </button>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Participant Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Sent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-3" />
                    Loading delivery logs...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No matching participant records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => {
                  const statusColors = {
                    'Sent': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                    'Generated': 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
                    'Failed': 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
                    'Failed Generation': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
                  };
                  return (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          {item.status === 'Sent' && <Check className="w-3.5 h-3.5" />}
                          {item.status.includes('Failed') && <AlertTriangle className="w-3.5 h-3.5" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {item.date_sent ? new Date(item.date_sent).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <a
                          href={apiService.downloadPdfUrl(item.filename)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleResendIndividual(item.email)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Resend Email"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
