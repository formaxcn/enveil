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

export const SiteItem: React.FC<SiteItemProps> = ({ site, onToggle, onEdit, onDelete }) => {
    return (
        <div className={clsx(
            "flex items-center gap-4 p-4 rounded-xl border transition-all",
            site.enable ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-75"
        )}>
            <Switch checked={site.enable} onChange={onToggle} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: site.color }}
                    >
                        {site.envName}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                        {patternMap[site.matchPattern] || site.matchPattern}: {site.matchValue}
                    </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                    <span>Bg: {site.backgroudEnable ? 'On' : 'Off'}</span>
                    <span>Pos: {site.Position}</span>
                    <span>Flag: {site.flagEnable ? 'On' : 'Off'}</span>
                </div>
            </div>

            <div className="flex gap-1">
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
