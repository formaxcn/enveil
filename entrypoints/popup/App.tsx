import React, { useState, useEffect } from 'react';
import { Settings, Plus, Zap, Globe } from 'lucide-react';
import { Switch } from '../../components/Switch';
import { storage } from 'wxt/utils/storage';

const App: React.FC = () => {
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        const loadState = async () => {
            const val = await storage.getItem<boolean>('local:isEnabled');
            setIsEnabled(val ?? true);
        };
        loadState();
    }, []);

    const toggleEnable = async (val: boolean) => {
        setIsEnabled(val);
        await storage.setItem('local:isEnabled', val);
    };

    const openOptions = (params = '') => {
        window.open(browser.runtime.getURL(`/options.html${params}`));
    };

    const addSite = async () => {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            try {
                const url = new URL(tab.url);
                const domain = url.hostname;
                openOptions(`?action=addSite&domain=${encodeURIComponent(domain)}&pattern=domain`);
            } catch (err) {
                openOptions();
            }
        } else {
            openOptions();
        }
    };

    return (
        <div className="w-80 bg-white p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 rounded-xl">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">ENVEIL</h1>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                <Switch
                    label="Enable Enveil"
                    checked={isEnabled}
                    onChange={toggleEnable}
                />
            </div>

            <div className="space-y-2">
                <button
                    onClick={addSite}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200"
                >
                    <div className="flex items-center gap-3"><Plus className="w-4 h-4" /> Add This Site</div>
                    <Globe className="w-4 h-4 opacity-50" />
                </button>
                <button
                    onClick={() => openOptions()}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white text-gray-700 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-bold shadow-sm"
                >
                    <div className="flex items-center gap-3"><Settings className="w-4 h-4 text-gray-400" /> Configure</div>
                </button>
            </div>

            <div className="pt-2 text-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Environment Discovery</p>
            </div>
        </div>
    );
};

export default App;
