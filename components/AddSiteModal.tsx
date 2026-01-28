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
            setFormData({
                ...INITIAL_SITE,
                color: defaultColors[0] || '#4a9eff'
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
            width="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-700">Status</span>
                    <Switch
                        checked={formData.enable}
                        onChange={(checked) => setFormData({ ...formData, enable: checked })}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Match Pattern</label>
                        <select
                            value={formData.matchPattern}
                            onChange={(e) => setFormData({ ...formData, matchPattern: e.target.value })}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="everything">Everything</option>
                            <option value="url">Full URL</option>
                            <option value="urlPrefix">Starts with</option>
                            <option value="domain">Domain</option>
                            <option value="regex">Regex Match</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Match Value</label>
                        <input
                            type="text"
                            required
                            value={formData.matchValue}
                            onChange={(e) => setFormData({ ...formData, matchValue: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        {site ? 'Update Changes' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
