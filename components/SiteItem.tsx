import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Switch } from './Switch';
import { SiteConfig } from '../entrypoints/options/types';
import { clsx } from 'clsx';

interface SiteItemProps {
    site: SiteConfig;
    onToggle: (enabled: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}

const patternMap: Record<string, string> = {
    'everything': 'Everything',
    'url': 'Full URL',
    'urlPrefix': 'Starts with',
    'domain': 'Domain',
    'regex': 'Regex Match'
};

const positionMap: Record<string, string> = {
    'leftTop': 'Top Left',
    'rightTop': 'Top Right',
    'leftBottom': 'Bottom Left',
    'rightBottom': 'Bottom Right',
};

export const SiteItem: React.FC<SiteItemProps> = ({ site, onToggle, onEdit, onDelete }) => {
    return (
        <div className={clsx(
            "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
            site.enable
                ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm"
                : "bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 opacity-75"
        )}>
            <Switch checked={site.enable} onChange={onToggle} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider text-white shadow-sm ring-1 ring-white/20"
                        style={{ backgroundColor: site.color }}
                    >
                        {site.envName}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                        {patternMap[site.matchPattern] || site.matchPattern}: {site.matchValue}
                    </span>
                </div>
                <div className="flex gap-3 text-[10px] font-medium text-gray-500 dark:text-slate-400 tracking-tight">
                    <span className="flex items-center gap-1">
                        <div className={clsx("w-1.5 h-1.5 rounded-full", site.backgroudEnable ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700")} />
                        Background Effect: {site.backgroudEnable ? 'On' : 'Off'}
                    </span>
                    <span className="flex items-center gap-1">
                        <div className={clsx("w-1.5 h-1.5 rounded-full", site.flagEnable ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700")} />
                        Corner Banner: {site.flagEnable ? 'On: ' + positionMap[site.Position] : 'Off'}
                    </span>
                </div>
            </div>

            <div className="flex gap-1">
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
