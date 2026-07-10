import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function DragDropZone({ label, accept, onUpload, isUploaded, error, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] relative ${
        dragActive 
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
          : isUploaded 
            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      
      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Uploading...</p>
        </div>
      ) : isUploaded ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{label} Uploaded</h4>
            <p className="text-xs text-slate-400">Click or drag another to replace</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</h4>
            <p className="text-xs text-slate-400 mt-0.5">Drag & drop or click to browse</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
