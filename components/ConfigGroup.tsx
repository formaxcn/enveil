import React from 'react';
import { Plus, Edit3, Download, Trash2, Folder } from 'lucide-react';
import { Switch } from './Switch';
import { SiteItem } from './SiteItem';
import { Setting, SiteConfig } from '../entrypoints/options/types';

interface ConfigGroupProps {
    setting: Setting;
    onToggle: (enabled: boolean) => void;
    onAddSite: () => void;
    onEditGroup: () => void;
    onDeleteGroup: () => void;
    onExportGroup: () => void;
    onToggleSite: (siteIndex: number, enabled: boolean) => void;
    onEditSite: (siteIndex: number) => void;
    onDeleteSite: (siteIndex: number) => void;
}

export const ConfigGroup: React.FC<ConfigGroupProps> = ({
    setting,
    onToggle,
    onAddSite,
    onEditGroup,
    onDeleteGroup,
    onExportGroup,
    onToggleSite,
    onEditSite,
    onDeleteSite
}) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Switch checked={setting.enable} onChange={onToggle} />
                    <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-gray-400" />
                        <h3 className="font-bold text-gray-900">{setting.name}</h3>
                        <span className="text-xs font-medium text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-full">
                            {setting.sites.length} sites
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddSite}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Config
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button onClick={onEditGroup} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors" title="Rename Group">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={onExportGroup} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors" title="Export Group">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={onDeleteGroup} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors" title="Delete Group">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-3">
                {setting.sites.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">No sites configured in this group.</p>
                    </div>
                ) : (
                    setting.sites.map((site, idx) => (
                        <SiteItem
                            key={idx}
                            site={site}
                            onToggle={(enabled) => onToggleSite(idx, enabled)}
                            onEdit={() => onEditSite(idx)}
                            onDelete={() => onDeleteSite(idx)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
