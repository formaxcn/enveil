import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { PreviewEditor } from './PreviewEditor';
import { SiteConfig } from '../entrypoints/options/types';
import { Switch } from './Switch';

interface AddSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (site: SiteConfig) => void;
    site?: SiteConfig;
    defaultColors: string[];
}

const INITIAL_SITE: SiteConfig = {
    enable: true,
    matchPattern: 'domain',
    matchValue: '',
    envName: 'dev',
    color: '#4a9eff',
    backgroudEnable: false,
    Position: 'leftTop',
    flagEnable: false,
};

export const AddSiteModal: React.FC<AddSiteModalProps> = ({
    isOpen,
    onClose,
    onSave,
    site,
    defaultColors,
}) => {
    const [formData, setFormData] = useState<SiteConfig>(INITIAL_SITE);

    useEffect(() => {
        if (site) {
            setFormData(site);
        } else {
            // Pick a color from defaultColors for new sites - try to be different from the first one
            const colorOptions = defaultColors.length > 0 ? defaultColors : ['#4a9eff', '#4CAF50', '#ff9800', '#f44336', '#9c27b0'];
            // Simple rotation or better random selection logic can be added if we tracked state, 
            // but for now let's just ensure it's a random pick from the full list.
            const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

            setFormData({
                ...INITIAL_SITE,
                color: randomColor
            });
        }
    }, [site, isOpen, defaultColors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={site ? 'Edit Site Configuration' : 'Add New Site Configuration'}
            width="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Status</span>
                    <Switch
                        checked={formData.enable}
                        onChange={(checked) => setFormData({ ...formData, enable: checked })}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Match Pattern</label>
                        <select
                            value={formData.matchPattern}
                            onChange={(e) => setFormData({ ...formData, matchPattern: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl text-sm p-2 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors border"
                        >
                            <option value="everything" className="bg-white dark:bg-slate-900">Everything</option>
                            <option value="url" className="bg-white dark:bg-slate-900">Full URL</option>
                            <option value="urlPrefix" className="bg-white dark:bg-slate-900">Starts with</option>
                            <option value="domain" className="bg-white dark:bg-slate-900">Domain</option>
                            <option value="regex" className="bg-white dark:bg-slate-900">Regex Match</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Match Value</label>
                        <input
                            type="text"
                            required
                            value={formData.matchValue}
                            onChange={(e) => setFormData({ ...formData, matchValue: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            placeholder="e.g. google.com"
                        />
                    </div>
                </div>

                <PreviewEditor
                    config={formData}
                    onChange={(updates) => setFormData({ ...formData, ...updates })}
                    defaultColors={defaultColors}
                />

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border dark:border-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                        {site ? 'Update Changes' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
