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
        setValue('host', data.SMTP_HOST || '');
        setValue('port', data.SMTP_PORT || 587);
        setValue('email', data.SMTP_EMAIL || '');
        // Do not auto-fill masked passwords directly into field to avoid submission errors
        setValue('password', '');
      } catch (e) {
        toast.error("Failed to load SMTP configuration");
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
        port: parseInt(data.port),
        email: data.email,
        password: data.password,
      });
      toast.success("SMTP configurations updated successfully!");
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
            <h3 className="font-semibold text-lg">SMTP Provider Settings</h3>
            <p className="text-xs text-slate-500">Configure outbound email host servers and authorization credentials.</p>
          </div>
        </div>

        {fetching ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            Fetching current parameters...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">SMTP Host</label>
                <div className="relative">
                  <Server className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. smtp.gmail.com"
                    {...register('host', { required: 'SMTP Host is required' })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                {errors.host && <p className="text-xs text-red-500 mt-1">{errors.host.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">SMTP Port</label>
                <input
                  type="number"
                  placeholder="e.g. 587 or 465"
                  {...register('port', { required: 'SMTP Port is required' })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
                {errors.port && <p className="text-xs text-red-500 mt-1">{errors.port.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ambassador@gmail.com"
                  {...register('email', { required: 'Email address is required' })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">App Password</label>
                <div className="relative">
                  <Key className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    placeholder="Enter App Password"
                    {...register('password', { required: 'App Password is required' })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl flex gap-3 text-xs text-blue-600 dark:text-blue-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold">Security Note:</h4>
                <p className="leading-relaxed">
                  For Google SMTP servers, you must generate a secure **App Password** from your Google account settings under security. Do not use your primary password.
                </p>
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
