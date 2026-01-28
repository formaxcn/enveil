import React, { useRef } from 'react';
import { Palette, Layout } from 'lucide-react';
import { Switch } from './Switch';
import { clsx } from 'clsx';
import { SiteConfig } from '../entrypoints/options/types';

interface PreviewEditorProps {
    config: Partial<SiteConfig>;
    onChange: (updates: Partial<SiteConfig>) => void;
    defaultColors: string[];
}

export const PreviewEditor: React.FC<PreviewEditorProps> = ({ config, onChange, defaultColors }) => {
    const pickerRef = useRef<HTMLInputElement>(null);

    const isDefaultColor = defaultColors.some(c => c.toLowerCase() === config.color?.toLowerCase());

    const getContrastColor = (hexColor: string) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 155 ? '#000000' : '#ffffff';
    };

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const ribbonClasses = {
        leftTop: 'top-2 left-[-2rem] -rotate-45',
        rightTop: 'top-2 right-[-2rem] rotate-45',
        leftBottom: 'bottom-2 left-[-2rem] rotate-45',
        rightBottom: 'bottom-2 right-[-2rem] -rotate-45',
    };

    return (
        <div className="space-y-6">
            <div className="form-group">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Environment Name</label>
                <input
                    type="text"
                    value={config.envName}
                    onChange={(e) => onChange({ envName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. Production"
                />
            </div>

            <div
                className="relative overflow-hidden rounded-3xl p-8 border-2 border-gray-200 dark:border-slate-800 transition-all duration-300"
                style={{
                    backgroundColor: config.backgroudEnable ? hexToRgba(config.color || '#4a9eff', 0.1) : 'transparent'
                }}
            >
                {/* Ribbon Preview */}
                {config.flagEnable && (
                    <div
                        className={clsx(
                            "absolute w-32 py-1 text-[10px] font-black uppercase tracking-widest text-center text-white shadow-lg pointer-events-none ring-1 ring-white/20",
                            ribbonClasses[config.Position as keyof typeof ribbonClasses] || ribbonClasses.leftTop
                        )}
                        style={{ backgroundColor: config.color }}
                    >
                        {config.envName || 'PREVIEW'}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm space-y-4">
                        <Switch
                            label="Background Effect"
                            checked={!!config.backgroudEnable}
                            onChange={(checked) => onChange({ backgroudEnable: checked })}
                        />
                        <Switch
                            label="Corner Banner"
                            checked={!!config.flagEnable}
                            onChange={(checked) => onChange({ flagEnable: checked })}
                        />
                    </div>

                    <div className={clsx(
                        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm transition-all",
                        config.flagEnable ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    )}>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Position</label>
                        <select
                            value={config.Position}
                            onChange={(e) => onChange({ Position: e.target.value })}
                            className="w-full bg-transparent border-none text-sm font-bold text-gray-900 dark:text-slate-100 focus:ring-0 cursor-pointer"
                        >
                            <option value="leftTop">Top Left</option>
                            <option value="rightTop">Top Right</option>
                            <option value="leftBottom">Bottom Left</option>
                            <option value="rightBottom">Bottom Right</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Theme Color</label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {defaultColors.map((color, idx) => (
                            <button
                                key={idx}
                                onClick={() => onChange({ color })}
                                className={clsx(
                                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm ring-1 ring-black/5",
                                    config.color?.toLowerCase() === color.toLowerCase() ? "border-blue-500 scale-110 ring-4 ring-blue-500/20" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <button
                            onClick={() => pickerRef.current?.click()}
                            className={clsx(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shadow-sm relative overflow-hidden",
                                !isDefaultColor ? "border-blue-500 scale-110" : "border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-400"
                            )}
                            style={!isDefaultColor ? { backgroundColor: config.color, color: getContrastColor(config.color || '#000') } : {}}
                        >
                            <Palette className="w-4 h-4" />
                            <input
                                ref={pickerRef}
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={config.color}
                                onChange={(e) => onChange({ color: e.target.value.toUpperCase() })}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
