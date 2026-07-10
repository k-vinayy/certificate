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
  const [config, setConfig] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await apiService.getConfig();
      setConfig(res.data);
    } catch (e) {
      console.error("Failed to load positioning config", e);
    }
  };

  useEffect(() => {
    fetchConfig();
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
        setPreviewUrl(`http://localhost:8000/api/download/template.png?t=${Date.now()}`);
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
      window.open(`http://localhost:8000${res.data.url}`, '_blank');
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
    if (!filesState.excel.uploaded || participants.length === 0) {
      return toast.error("Please upload an Excel list containing participants.");
    }
    
    setGenerating(true);
    try {
      const res = await apiService.generateCertificates(eventDate, participants);
      toast.success(`Successfully generated ${res.data.generated} certificates!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation workflow failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Uploaders Zone */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="font-semibold text-lg">1. File Workspace Setup</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <DragDropZone
            label="Participants Excel (.xlsx)"
            accept=".xlsx, .xls"
            isUploaded={filesState.excel.uploaded}
            loading={filesState.excel.loading}
            error={filesState.excel.error}
            onUpload={(file) => handleFileUpload('excel', file, apiService.uploadExcel)}
          />
        </div>
      </div>

      {/* Meta Input parameters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">2. Event Context Details</h3>
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
              disabled={generating || !filesState.template.uploaded || !filesState.excel.uploaded}
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
          <h3 className="font-semibold text-lg">3. Adjust Elements Layout</h3>
          <PositionEditor
            imageUrl={filesState.template.uploaded ? `http://localhost:8000/api/download/template.png?t=${Date.now()}` : null}
            config={config}
            onSaveConfig={handleSaveConfig}
          />
        </div>
      )}
    </div>
  );
}
