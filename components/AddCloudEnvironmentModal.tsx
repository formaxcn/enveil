import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CloudEnvironment, CloudProvider, CloudTemplate } from '../entrypoints/options/types';
import { getCloudTemplate, getCloudTemplateNames } from '../utils/cloudTemplates';
import { Switch } from './Switch';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

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
    const [samlUrl, setSamlUrl] = useState('');
    const [consolePattern, setConsolePattern] = useState('');
    const [accountUrl, setAccountUrl] = useState('');
    const [accountContainers, setAccountContainers] = useState<string[]>([]);
    const [roleElements, setRoleElements] = useState<string[]>([]);
    const [consoleAccountContainers, setConsoleAccountContainers] = useState<string[]>([]);
    const [consoleRoleElements, setConsoleRoleElements] = useState<string[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Track if values were auto-filled from template
    const [isAutoFilled, setIsAutoFilled] = useState(false);

    useEffect(() => {
        if (environment) {
            setName(environment.name);
            setEnabled(environment.enable);
            setProvider(environment.provider);
            setSamlUrl(environment.template.samlUrl || '');
            setConsolePattern(environment.template.consoleDomainPattern);
            setAccountUrl(environment.template.accountSelectionUrl);
            setAccountContainers(environment.template.selectors.accountSelection.accountContainers);
            setRoleElements(environment.template.selectors.accountSelection.roleElements);
            setConsoleAccountContainers(environment.template.selectors.console.accountContainers);
            setConsoleRoleElements(environment.template.selectors.console.roleElements);
            setIsAutoFilled(false);
        } else {
            setName('');
            setEnabled(true);
            setProvider(CloudProvider.AWS_GLOBAL);
            setSamlUrl('');
            const template = getCloudTemplate(CloudProvider.AWS_GLOBAL);
            setConsolePattern(template.consoleDomainPattern);
            setAccountUrl(template.accountSelectionUrl);
            setAccountContainers(template.selectors.accountSelection.accountContainers);
            setRoleElements(template.selectors.accountSelection.roleElements);
            setConsoleAccountContainers(template.selectors.console.accountContainers);
            setConsoleRoleElements(template.selectors.console.roleElements);
            setIsAutoFilled(true);
        }
    }, [environment, isOpen]);

    // Auto-fill template values when provider changes (only for non-custom providers)
    useEffect(() => {
        if (provider !== CloudProvider.CUSTOM && isAutoFilled) {
            const template = getCloudTemplate(provider);
            setConsolePattern(template.consoleDomainPattern);
            setAccountUrl(template.accountSelectionUrl);
            setAccountContainers(template.selectors.accountSelection.accountContainers);
            setRoleElements(template.selectors.accountSelection.roleElements);
            setConsoleAccountContainers(template.selectors.console.accountContainers);
            setConsoleRoleElements(template.selectors.console.roleElements);
        }
    }, [provider]);

    const handleProviderChange = (newProvider: CloudProvider) => {
        setProvider(newProvider);
        setIsAutoFilled(true);
    };

    const handleTemplateValueChange = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string
    ) => {
        setter(value);
        // Switch to custom provider when user modifies template values
        if (provider !== CloudProvider.CUSTOM) {
            setProvider(CloudProvider.CUSTOM);
        }
        setIsAutoFilled(false);
    };

    const handleArrayValueChange = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        index: number,
        value: string
    ) => {
        setter(prev => {
            const newArray = [...prev];
            newArray[index] = value;
            return newArray;
        });
        if (provider !== CloudProvider.CUSTOM) {
            setProvider(CloudProvider.CUSTOM);
        }
        setIsAutoFilled(false);
    };

    const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, '']);
        if (provider !== CloudProvider.CUSTOM) {
            setProvider(CloudProvider.CUSTOM);
        }
        setIsAutoFilled(false);
    };

    const removeArrayItem = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        index: number
    ) => {
        setter(prev => prev.filter((_, i) => i !== index));
        if (provider !== CloudProvider.CUSTOM) {
            setProvider(CloudProvider.CUSTOM);
        }
        setIsAutoFilled(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const template: CloudTemplate = {
            provider,
            name: getCloudTemplateNames()[provider] || 'Custom',
            accountSelectionUrl: accountUrl,
            consoleDomainPattern: consolePattern,
            samlUrl,
            selectors: {
                accountSelection: {
                    accountContainers: accountContainers.filter(Boolean),
                    roleElements: roleElements.filter(Boolean)
                },
                console: {
                    accountContainers: consoleAccountContainers.filter(Boolean),
                    roleElements: consoleRoleElements.filter(Boolean)
                }
            }
        };

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
                    {/* Row 1: Cloud Provider + Environment Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group font-bold">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Cloud Provider</label>
                            <select
                                value={provider}
                                onChange={(e) => handleProviderChange(e.target.value as CloudProvider)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none border transition-colors"
                            >
                                {Object.entries(providerNames).map(([id, name]) => (
                                    <option key={id} value={id} className="bg-white dark:bg-slate-900">{name}</option>
                                ))}
                            </select>
                        </div>

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
                    </div>

                    {/* Row 2: SAML URL */}
                    <div className="form-group font-bold">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">SAML URL</label>
                        <input
                            type="url"
                            value={samlUrl}
                            onChange={(e) => setSamlUrl(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Template Values Section */}
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest">
                            <Terminal className="w-4 h-4" /> Template Values
                        </div>
                        
                        {/* Console Pattern + Account URL */}
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-tight">
                            <div>
                                <label className="block text-gray-400 dark:text-slate-500 mb-1">Console Pattern</label>
                                <input
                                    type="text"
                                    value={consolePattern}
                                    onChange={(e) => handleTemplateValueChange(setConsolePattern, e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg font-mono text-[11px] text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="*://*.example.com/*"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 dark:text-slate-500 mb-1">Account URL</label>
                                <input
                                    type="text"
                                    value={accountUrl}
                                    onChange={(e) => handleTemplateValueChange(setAccountUrl, e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg font-mono text-[11px] text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://signin.example.com/saml"
                                />
                            </div>
                        </div>

                        {/* Advanced Settings Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2"
                        >
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Advanced Settings
                        </button>

                        {/* Advanced Settings Content */}
                        {showAdvanced && (
                            <div className="space-y-4 mt-2 pt-4 border-t border-blue-200 dark:border-blue-800">
                                {/* Account Selection Selectors */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                        Account Selection Selectors
                                    </label>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 mb-1 block">Account Containers</span>
                                            {accountContainers.map((item, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={item}
                                                        onChange={(e) => handleArrayValueChange(setAccountContainers, index, e.target.value)}
                                                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg font-mono text-[11px] text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="CSS selector"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArrayItem(setAccountContainers, index)}
                                                        className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addArrayItem(setAccountContainers)}
                                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                                            >
                                                + Add selector
                                            </button>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 mb-1 block">Role Elements</span>
                                            {roleElements.map((item, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={item}
                                                        onChange={(e) => handleArrayValueChange(setRoleElements, index, e.target.value)}
                                                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg font-mono text-[11px] text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="CSS selector"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArrayItem(setRoleElements, index)}
                                                        className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addArrayItem(setRoleElements)}
                                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                                            >
                                                + Add selector
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Console Selectors */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                        Console Selectors
                                    </label>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 mb-1 block">Account Containers</span>
                                            {consoleAccountContainers.map((item, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={item}
                                                        onChange={(e) => handleArrayValueChange(setConsoleAccountContainers, index, e.target.value)}
                                                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg font-mono text-[11px] text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="CSS selector"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArrayItem(setConsoleAccountContainers, index)}
                                                        className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addArrayItem(setConsoleAccountContainers)}
                                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                                            >
                                                + Add selector
                                            </button>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 mb-1 block">Role Elements</span>
                                            {consoleRoleElements.map((item, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={item}
                                                        onChange={(e) => handleArrayValueChange(setConsoleRoleElements, index, e.target.value)}
                                                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg font-mono text-[11px] text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="CSS selector"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArrayItem(setConsoleRoleElements, index)}
                                                        className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addArrayItem(setConsoleRoleElements)}
                                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                                            >
                                                + Add selector
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
