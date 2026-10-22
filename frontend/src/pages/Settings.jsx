import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Server, ShieldAlert, Key, Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        const response = await apiService.getSmtpConfig();
        const data = response.data;
        setValue('host', data.SMTP_HOST || 'smtp.gmail.com');
        setValue('port', data.SMTP_PORT || 587);
        setValue('email', data.SMTP_EMAIL || '');
        setValue('password', '');
        setValue('sendgrid_api_key', data.SENDGRID_API_KEY ? '' : '');
        setValue('resend_api_key', data.RESEND_API_KEY ? '' : '');
      } catch (e) {
        toast.error("Failed to load email configuration");
      } finally {
        setFetching(false);
      }
    };
    fetchSmtpConfig();
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await apiService.saveSmtpConfig({
        host: data.host,
        port: parseInt(data.port) || 587,
        email: data.email,
        password: data.password,
        sendgrid_api_key: data.sendgrid_api_key,
        resend_api_key: data.resend_api_key,
      });
      toast.success("Email configurations updated successfully!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update configurations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Email Dispatch Settings</h3>
            <p className="text-xs text-slate-500">Configure SendGrid API (recommended for Render & personal Gmail) or standard SMTP.</p>
          </div>
        </div>

        {fetching ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            Fetching current parameters...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Primary Recommended: SendGrid HTTPS API */}
            <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                    Recommended for Render (Personal Gmail)
                  </span>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">SendGrid API Key</label>
                </div>
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Get free key on sendgrid.com &rarr;
                </a>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                SendGrid allows you to verify your personal Gmail in 1 click (Single Sender Verification) and send up to 100 emails/day to any participant over HTTPS without Render port blocks.
              </p>
              <div className="relative">
                <Key className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  {...register('sendgrid_api_key')}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Sender Email Address */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Sender Email Address (Your Verified Gmail)</label>
              <input
                type="email"
                placeholder="e.g. yourname@gmail.com"
                {...register('email')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">Must match the email you verify in SendGrid (or your Gmail for SMTP).</p>
            </div>

            {/* Alternative: SMTP Settings */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Or Use Standard SMTP (Local / Unblocked Servers)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">SMTP Host</label>
                  <div className="relative">
                    <Server className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. smtp.gmail.com"
                      {...register('host')}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">SMTP Port</label>
                  <input
                    type="number"
                    placeholder="e.g. 587 or 465"
                    {...register('port')}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Gmail App Password (If using SMTP)</label>
                  <div className="relative">
                    <Key className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      placeholder="Enter 16-char App Password"
                      {...register('password')}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Configuration Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
