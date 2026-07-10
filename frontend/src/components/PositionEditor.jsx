import React, { useRef, useState, useEffect } from 'react';
import { Save, Move } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PositionEditor({ imageUrl, config, onSaveConfig }) {
  const containerRef = useRef(null);
  
  // Local state for layout configuration
  const [localConfig, setLocalConfig] = useState(config);
  const [activeElement, setActiveElement] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleMouseDown = (elementKey, e) => {
    e.preventDefault();
    setActiveElement(elementKey);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ 
      x: localConfig[elementKey].x, 
      y: localConfig[elementKey].y 
    });
  };

  const handleMouseMove = (e) => {
    if (!activeElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert pixels to percentage offsets relative to container dimensions
    const pctDeltaX = (deltaX / rect.width) * 100;
    const pctDeltaY = (deltaY / rect.height) * 100;

    let newX = Math.min(Math.max(initialPos.x + pctDeltaX, 0), 100);
    let newY = Math.min(Math.max(initialPos.y + pctDeltaY, 0), 100);

    setLocalConfig(prev => ({
      ...prev,
      [activeElement]: {
        ...prev[activeElement],
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10
      }
    }));
  };

  const handleMouseUp = () => {
    setActiveElement(null);
  };

  useEffect(() => {
    if (activeElement) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeElement, dragStart, initialPos]);

  const handleSliderChange = (elementKey, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [elementKey]: {
        ...prev[elementKey],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Visual Workspace Canvas */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Live Position Workspace</h3>
        <p className="text-xs text-slate-400">Drag the labeled target items inside the template below to adjust placement positions.</p>
        
        <div 
          ref={containerRef}
          className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-xl select-none"
          style={{ aspectRatio: '16/10' }}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Certificate Template" 
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              Please upload a template to enable canvas preview
            </div>
          )}

          {imageUrl && localConfig && (
            <>
              {/* Name Overlay */}
              <div
                style={{ 
                  left: `${localConfig.name?.x}%`, 
                  top: `${localConfig.name?.y}%`,
                  color: localConfig.name?.color || '#000000',
                  fontSize: `${(localConfig.name?.font_size || 58) / 4}px` // Scale down for preview
                }}
                onMouseDown={(e) => handleMouseDown('name', e)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-blue-500 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-lg text-xs md:text-sm select-none"
              >
                <Move className="w-4 h-4 text-blue-500" />
                <span>Awarded To (Name)</span>
              </div>

              {/* Date Overlay */}
              <div
                style={{ 
                  left: `${localConfig.date?.x}%`, 
                  top: `${localConfig.date?.y}%`,
                  color: localConfig.date?.color || '#000000',
                  fontSize: `${(localConfig.date?.font_size || 24) / 2}px` // Scale down for preview
                }}
                onMouseDown={(e) => handleMouseDown('date', e)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-amber-500 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium shadow-lg text-xs md:text-sm select-none"
              >
                <Move className="w-4 h-4 text-amber-500" />
                <span>Date</span>
              </div>

              {/* Signature Overlay */}
              <div
                style={{ 
                  left: `${localConfig.signature?.x}%`, 
                  top: `${localConfig.signature?.y}%`,
                  width: `${localConfig.signature?.width || 15}%`,
                  height: `${localConfig.signature?.height || 10}%`
                }}
                onMouseDown={(e) => handleMouseDown('signature', e)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-emerald-500 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-medium shadow-lg text-xs md:text-sm select-none"
              >
                <Move className="w-4 h-4 text-emerald-500" />
                <span>Signature</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor Parameters Pane */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-semibold text-base">Position Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure sizing parameters and fonts details.</p>
          </div>

          {localConfig && (
            <div className="space-y-6">
              {/* Name controls */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Name Coordinates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">X Position (%)</label>
                    <input 
                      type="number" 
                      value={localConfig.name?.x || 50} 
                      onChange={(e) => handleSliderChange('name', 'x', parseFloat(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Y Position (%)</label>
                    <input 
                      type="number" 
                      value={localConfig.name?.y || 50} 
                      onChange={(e) => handleSliderChange('name', 'y', parseFloat(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-xs text-slate-500">Font Size (px)</label>
                    <input 
                      type="range" 
                      min="24" 
                      max="120"
                      value={localConfig.name?.font_size || 58} 
                      onChange={(e) => handleSliderChange('name', 'font_size', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer mt-3"
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">{localConfig.name?.font_size || 58}px</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Text Color</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color" 
                        value={localConfig.name?.color || '#000000'} 
                        onChange={(e) => handleSliderChange('name', 'color', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{localConfig.name?.color || '#000000'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date controls */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">Date Coordinates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">X Position (%)</label>
                    <input 
                      type="number" 
                      value={localConfig.date?.x || 20} 
                      onChange={(e) => handleSliderChange('date', 'x', parseFloat(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Y Position (%)</label>
                    <input 
                      type="number" 
                      value={localConfig.date?.y || 80} 
                      onChange={(e) => handleSliderChange('date', 'y', parseFloat(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Signature controls */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Signature Coordinates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Width (%)</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="35"
                      value={localConfig.signature?.width || 15} 
                      onChange={(e) => handleSliderChange('signature', 'width', parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer mt-3"
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">{localConfig.signature?.width || 15}%</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Height (%)</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="25"
                      value={localConfig.signature?.height || 10} 
                      onChange={(e) => handleSliderChange('signature', 'height', parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer mt-3"
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">{localConfig.signature?.height || 10}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <Save className="w-5 h-5" />
          Save Configurations
        </button>
      </div>
    </div>
  );
}
