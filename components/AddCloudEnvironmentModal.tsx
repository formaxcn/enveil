import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CloudEnvironment, CloudProvider, CloudTemplate } from '../entrypoints/options/types';
import { getCloudTemplate, getCloudTemplateNames } from '../utils/cloudTemplates';
import { Switch } from './Switch';
import { Globe, Shield, Terminal } from 'lucide-react';

interface AddCloudEnvironmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (environment: CloudEnvironment) => void;
    environment?: CloudEnvironment;
}

export const AddCloudEnvironmentModal: React.FC<AddCloudEnvironmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    environment,
}) => {
    const [name, setName] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [provider, setProvider] = useState<CloudProvider>(CloudProvider.AWS_GLOBAL);
    const [customTemplate, setCustomTemplate] = useState<CloudTemplate | null>(null);

    useEffect(() => {
        if (environment) {
            setName(environment.name);
            setEnabled(environment.enable);
            setProvider(environment.provider);
            if (environment.provider === CloudProvider.CUSTOM) {
                setCustomTemplate(environment.template);
            }
        } else {
            setName('');
            setEnabled(true);
            setProvider(CloudProvider.AWS_GLOBAL);
            setCustomTemplate(null);
        }
    }, [environment, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let template: CloudTemplate;
        if (provider === CloudProvider.CUSTOM && customTemplate) {
            template = customTemplate;
        } else {
            template = getCloudTemplate(provider);
        }

        const env: CloudEnvironment = environment ? {
            ...environment,
            name,
            enable: enabled,
            provider,
            template,
            modified: Date.now()
        } : {
            id: crypto.randomUUID(),
            name,
            enable: enabled,
            provider,
            template,
            accounts: [],
            created: Date.now(),
            modified: Date.now()
        };

        onSave(env);
        onClose();
    };

    const providerNames = getCloudTemplateNames();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={environment ? 'Edit Cloud Environment' : 'Add New Cloud Environment'}
            width="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Status</span>
                    <Switch checked={enabled} onChange={setEnabled} />
                </div>

                <div className="space-y-4">
                    <div className="form-group font-bold">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Environment Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. AWS Production"
                        />
                    </div>

                    <div className="form-group font-bold">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Cloud Provider</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value as CloudProvider)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none border transition-colors"
                        >
                            {Object.entries(providerNames).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {provider !== CloudProvider.CUSTOM && (
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest">
                                <Terminal className="w-4 h-4" /> Template Auto-filled
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-tight">
                                <div>
                                    <label className="block text-gray-400 dark:text-slate-500 mb-1">Console Pattern</label>
                                    <code className="block bg-white dark:bg-slate-900 p-2 rounded-lg font-mono truncate border dark:border-slate-800 lowercase text-gray-600 dark:text-slate-300">
                                        {getCloudTemplate(provider).consoleDomainPattern}
                                    </code>
                                </div>
                                <div>
                                    <label className="block text-gray-400 dark:text-slate-500 mb-1">Account URL</label>
                                    <code className="block bg-white dark:bg-slate-900 p-2 rounded-lg font-mono truncate border dark:border-slate-800 lowercase text-gray-600 dark:text-slate-300">
                                        {getCloudTemplate(provider).accountSelectionUrl}
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}

                    {provider === CloudProvider.CUSTOM && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-900 italic text-sm text-orange-800 dark:text-orange-400">
                            Custom configuration is advanced. For standard providers, please use the predefined templates.
                        </div>
                    )}
                </div>

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
                        {environment ? 'Update Environment' : 'Create Environment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
