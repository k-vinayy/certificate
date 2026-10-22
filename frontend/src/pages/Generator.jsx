import React, { useState, useEffect } from 'react';
import { Calendar, Layers, RefreshCw, Send, ArrowRight, Play, Eye } from 'lucide-react';
import DragDropZone from '../components/DragDropZone';
import PositionEditor from '../components/PositionEditor';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

export default function Generator() {
  const [eventDate, setEventDate] = useState('10 July 2026');
  const [filesState, setFilesState] = useState({
    template: { uploaded: false, filename: '', error: '', loading: false },
    signature: { uploaded: false, filename: '', error: '', loading: false },
    font: { uploaded: false, filename: '', error: '', loading: false },
    excel: { uploaded: false, filename: '', error: '', loading: false, count: 0 },
  });
  
  const [participants, setParticipants] = useState([]);
  const [inputMethod, setInputMethod] = useState('excel'); // 'excel' | 'manual'
  const [manualParticipants, setManualParticipants] = useState([
    { name: '', email: '' },
    { name: '', email: '' }
  ]);
  const [config, setConfig] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [configRes, assetRes] = await Promise.all([
        apiService.getConfig(),
        apiService.getAssetStatus()
      ]);
      
      setConfig(configRes.data);
      
      const assets = assetRes.data;
      if (assets) {
        setFilesState({
          template: { 
            uploaded: !!assets.template?.uploaded, 
            filename: assets.template?.filename || '', 
            error: '', 
            loading: false 
          },
          signature: { 
            uploaded: !!assets.signature?.uploaded, 
            filename: assets.signature?.filename || '', 
            error: '', 
            loading: false 
          },
          font: { 
            uploaded: !!assets.font?.uploaded, 
            filename: assets.font?.filename || '', 
            error: '', 
            loading: false 
          },
          excel: { 
            uploaded: !!assets.excel?.uploaded, 
            filename: assets.excel?.filename || '', 
            error: '', 
            loading: false, 
            count: assets.excel?.count || 0 
          },
        });
        
        if (assets.template?.uploaded) {
          setPreviewUrl(`${apiService.downloadPdfUrl('template.png')}?t=${Date.now()}`);
        }
        
        if (assets.excel?.participants && assets.excel.participants.length > 0) {
          setParticipants(assets.excel.participants);
        }
      }
    } catch (e) {
      console.error("Failed to load initial generator data", e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleFileUpload = async (type, file, serviceMethod) => {
    setFilesState(prev => ({
      ...prev,
      [type]: { ...prev[type], loading: true, error: '' }
    }));
    
    try {
      const response = await serviceMethod(file);
      setFilesState(prev => ({
        ...prev,
        [type]: {
          uploaded: true,
          filename: file.name,
          error: '',
          loading: false,
          count: type === 'excel' ? response.data.count : undefined
        }
      }));
      
      if (type === 'excel') {
        setParticipants(response.data.participants);
      }
      
      toast.success(`${type.toUpperCase()} file uploaded!`);
      // Trigger new preview if template/signature is updated
      if (type === 'template') {
        setPreviewUrl(`${apiService.downloadPdfUrl('template.png')}?t=${Date.now()}`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Upload failed. Verify file extension.";
      setFilesState(prev => ({
        ...prev,
        [type]: { ...prev[type], loading: false, error: errMsg, uploaded: false }
      }));
      toast.error(errMsg);
    }
  };

  const handleManualChange = (index, field, value) => {
    setManualParticipants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addManualRow = () => {
    setManualParticipants(prev => [...prev, { name: '', email: '' }]);
  };

  const removeManualRow = (index) => {
    setManualParticipants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveConfig = async (newConfig) => {
    try {
      const res = await apiService.updateConfig(newConfig);
      setConfig(res.data.config);
      toast.success("Position settings updated successfully!");
    } catch (e) {
      toast.error("Failed to save coordinate settings");
    }
  };

  const triggerPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await apiService.generatePreview(eventDate);
      // Backend returns preview.pdf. Direct user to open PDF preview or download
      toast.success("Preview generated successfully!");
      window.open(`${apiService.downloadPdfUrl(res.data.filename || 'preview.pdf')}?t=${Date.now()}`, '_blank');
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate preview PDF");
    } finally {
      setPreviewLoading(false);
    }
  };

  const triggerGeneration = async () => {
    if (!filesState.template.uploaded) {
      return toast.error("Please upload a certificate template.");
    }
    
    let activeParticipants = participants;
    if (inputMethod === 'manual') {
      activeParticipants = manualParticipants.filter(p => p.name.trim() && p.email.trim());
      if (activeParticipants.length === 0) {
        return toast.error("Please add at least one participant with both Name and Email.");
      }
    } else {
      if (!filesState.excel.uploaded || participants.length === 0) {
        return toast.error("Please upload an Excel list containing participants.");
      }
    }
    
    setGenerating(true);
    try {
      const res = await apiService.generateCertificates(eventDate, activeParticipants);
      toast.success(`Successfully generated ${res.data.generated} certificates!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation workflow failed.");
    } finally {
      setGenerating(false);
    }
  };

  const activeManualCount = manualParticipants.filter(p => p.name.trim() && p.email.trim()).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Setup Workspace Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Assets Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-semibold text-lg">1. Template Assets Setup</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DragDropZone
              label="Certificate Template (.png, .jpg)"
              accept="image/png, image/jpeg"
              isUploaded={filesState.template.uploaded}
              loading={filesState.template.loading}
              error={filesState.template.error}
              onUpload={(file) => handleFileUpload('template', file, apiService.uploadTemplate)}
            />
            <DragDropZone
              label="Signature Image (.png)"
              accept="image/png"
              isUploaded={filesState.signature.uploaded}
              loading={filesState.signature.loading}
              error={filesState.signature.error}
              onUpload={(file) => handleFileUpload('signature', file, apiService.uploadSignature)}
            />
            <DragDropZone
              label="TTF Font File (.ttf)"
              accept=".ttf"
              isUploaded={filesState.font.uploaded}
              loading={filesState.font.loading}
              error={filesState.font.error}
              onUpload={(file) => handleFileUpload('font', file, apiService.uploadFont)}
            />
          </div>
        </div>

        {/* Participants Setup Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">2. Participants</h3>
              {/* Tab Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setInputMethod('excel')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    inputMethod === 'excel'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Excel Upload
                </button>
                <button
                  onClick={() => setInputMethod('manual')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    inputMethod === 'manual'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Manual Entry
                </button>
              </div>
            </div>

            {inputMethod === 'excel' ? (
              <DragDropZone
                label="Participants Excel (.xlsx)"
                accept=".xlsx, .xls"
                isUploaded={filesState.excel.uploaded}
                loading={filesState.excel.loading}
                error={filesState.excel.error}
                onUpload={(file) => handleFileUpload('excel', file, apiService.uploadExcel)}
              />
            ) : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {manualParticipants.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Name"
                      value={p.name}
                      onChange={(e) => handleManualChange(idx, 'name', e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={p.email}
                      onChange={(e) => handleManualChange(idx, 'email', e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {manualParticipants.length > 1 && (
                      <button
                        onClick={() => removeManualRow(idx)}
                        className="text-red-500 hover:text-red-600 p-1 text-base font-bold"
                        title="Remove Participant"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addManualRow}
                  className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-all"
                >
                  + Add Participant
                </button>
              </div>
            )}
          </div>
          {inputMethod === 'excel' && filesState.excel.uploaded && (
            <div className="text-xs text-slate-450 font-medium">
              Found <span className="text-blue-600 dark:text-blue-400 font-semibold">{filesState.excel.count}</span> participants in Excel.
            </div>
          )}
          {inputMethod === 'manual' && (
            <div className="text-xs text-slate-450 font-medium">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {activeManualCount}
              </span> active manual entries.
            </div>
          )}
        </div>
      </div>

      {/* Meta Input parameters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">3. Event Context Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="text-sm font-medium text-slate-500 block mb-2">Event Date</label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. 10 July 2026"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={triggerPreview}
              disabled={previewLoading || !filesState.template.uploaded}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {previewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Generate Preview PDF
            </button>
            
            <button
              onClick={triggerGeneration}
              disabled={
                generating || 
                !filesState.template.uploaded || 
                (inputMethod === 'excel' && (!filesState.excel.uploaded || participants.length === 0)) ||
                (inputMethod === 'manual' && activeManualCount === 0)
              }
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate Certificates
            </button>
          </div>
        </div>
      </div>

      {/* Position canvas editor */}
      {config && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-semibold text-lg">4. Adjust Elements Layout</h3>
          <PositionEditor
            imageUrl={filesState.template.uploaded ? `${apiService.downloadPdfUrl('template.png')}?t=${Date.now()}` : null}
            config={config}
            onSaveConfig={handleSaveConfig}
          />
        </div>
      )}
    </div>
  );
}
