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
  const [templateNaturalWidth, setTemplateNaturalWidth] = useState(7370);
  const [containerWidth, setContainerWidth] = useState(700);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [imageUrl]);

  const handleMouseDown = (elementKey, e) => {
    e.preventDefault();
    setActiveElement(elementKey);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ 
      x: localConfig[elementKey]?.x || 50, 
      y: localConfig[elementKey]?.y || 50 
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

  // Accurate preview font-scale factor
  const scale = (containerWidth || 700) / (templateNaturalWidth || 7370);
  const previewNameFontSize = Math.max(11, Math.round((localConfig?.name?.font_size || 210) * scale));
  const previewDateFontSize = Math.max(9, Math.round((localConfig?.date?.font_size || 92) * scale));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Visual Workspace Canvas */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Live Position Workspace</h3>
        <p className="text-xs text-slate-400">Drag the labeled target items inside the template below to adjust placement positions.</p>
        
        <div 
          className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-xl select-none flex items-center justify-center"
          style={{ minHeight: !imageUrl ? '300px' : 'auto' }}
        >
          {imageUrl ? (
            <div 
              ref={containerRef}
              className="relative w-full"
            >
              <img 
                src={imageUrl} 
                alt="Certificate Template" 
                className="w-full h-auto block pointer-events-none"
                onLoad={(e) => {
                  if (e.target.naturalWidth) {
                    setTemplateNaturalWidth(e.target.naturalWidth);
                  }
                }}
              />

              {localConfig && (
                <>
                  {/* Name Overlay */}
                  <div
                    style={{ 
                      left: `${localConfig.name?.x ?? 50.3}%`, 
                      top: `${localConfig.name?.y ?? 49.0}%`,
                      color: localConfig.name?.color || '#000000',
                      fontSize: `${previewNameFontSize}px`
                    }}
                    onMouseDown={(e) => handleMouseDown('name', e)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-blue-500 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-lg select-none whitespace-nowrap"
                  >
                    <Move className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Awarded To (Name)</span>
                  </div>

                  {/* Date Overlay */}
                  <div
                    style={{ 
                      left: `${localConfig.date?.x ?? 18.4}%`, 
                      top: `${localConfig.date?.y ?? 82.5}%`,
                      color: localConfig.date?.color || '#000000',
                      fontSize: `${previewDateFontSize}px`
                    }}
                    onMouseDown={(e) => handleMouseDown('date', e)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-amber-500 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium shadow-lg select-none whitespace-nowrap"
                  >
                    <Move className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Date</span>
                  </div>

                  {/* Signature Overlay */}
                  <div
                    style={{ 
                      left: `${localConfig.signature?.x ?? 81.4}%`, 
                      top: `${localConfig.signature?.y ?? 79.2}%`,
                      width: `${localConfig.signature?.width || 15}%`,
                      height: `${localConfig.signature?.height || 10}%`
                    }}
                    onMouseDown={(e) => handleMouseDown('signature', e)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-emerald-500 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-medium shadow-lg text-xs md:text-sm select-none"
                  >
                    <Move className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Signature</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full py-20 flex items-center justify-center text-slate-500 text-sm">
              Please upload a template to enable canvas preview
            </div>
          )}
        </div>
      </div>

      {/* Editor Parameters Pane */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-semibold text-base">Position & Sizing Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure font sizes, coordinates, and color styling.</p>
          </div>

          {localConfig && (
            <div className="space-y-6">
              {/* Name controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Name Settings</h4>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded font-mono font-medium">
                    {localConfig.name?.font_size || 210}px
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">X Position (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={localConfig.name?.x ?? 50.3} 
                      onChange={(e) => handleSliderChange('name', 'x', parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Y Position (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={localConfig.name?.y ?? 49.0} 
                      onChange={(e) => handleSliderChange('name', 'y', parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-500">Font Size (px)</label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={localConfig.name?.font_size || 210}
                      onChange={(e) => handleSliderChange('name', 'font_size', parseInt(e.target.value) || 20)}
                      className="w-20 px-2 py-0.5 text-xs text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="350"
                    step="2"
                    value={localConfig.name?.font_size || 210} 
                    onChange={(e) => handleSliderChange('name', 'font_size', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-slate-500">Name Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={localConfig.name?.color || '#000000'} 
                      onChange={(e) => handleSliderChange('name', 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{localConfig.name?.color || '#000000'}</span>
                  </div>
                </div>
              </div>

              {/* Date controls */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">Date Settings</h4>
                  <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 rounded font-mono font-medium">
                    {localConfig.date?.font_size || 92}px
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">X Position (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={localConfig.date?.x ?? 18.4} 
                      onChange={(e) => handleSliderChange('date', 'x', parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Y Position (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={localConfig.date?.y ?? 82.5} 
                      onChange={(e) => handleSliderChange('date', 'y', parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-500">Font Size (px)</label>
                    <input
                      type="number"
                      min="15"
                      max="250"
                      value={localConfig.date?.font_size || 92}
                      onChange={(e) => handleSliderChange('date', 'font_size', parseInt(e.target.value) || 15)}
                      className="w-20 px-2 py-0.5 text-xs text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="200"
                    step="2"
                    value={localConfig.date?.font_size || 92} 
                    onChange={(e) => handleSliderChange('date', 'font_size', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-slate-500">Date Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={localConfig.date?.color || '#000000'} 
                      onChange={(e) => handleSliderChange('date', 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{localConfig.date?.color || '#000000'}</span>
                  </div>
                </div>
              </div>

              {/* Signature controls */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Signature Dimensions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Width (%)</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="35"
                      value={localConfig.signature?.width || 15} 
                      onChange={(e) => handleSliderChange('signature', 'width', parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mt-3"
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
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mt-3"
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
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99]"
        >
          <Save className="w-5 h-5" />
          Save Configurations
        </button>
      </div>
    </div>
  );
}
