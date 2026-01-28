import React, { useState, useEffect } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { Settings, Cloud, FileUp, FileDown, Plus, FolderPlus, Info, ChevronRight } from 'lucide-react';
import { Switch } from '../../components/Switch';
import { ConfigGroup } from '../../components/ConfigGroup';
import { CloudEnvironmentItem } from '../../components/CloudEnvironmentItem';
import { AddSiteModal } from '../../components/AddSiteModal';
import { AddGroupModal } from '../../components/AddGroupModal';
import { AddCloudEnvironmentModal } from '../../components/AddCloudEnvironmentModal';
import { AddCloudAccountModal } from '../../components/AddCloudAccountModal';
import { AppConfig, Setting, GroupDefaults, SiteConfig, CloudEnvironment, CloudAccount } from './types';
import { storage } from 'wxt/utils/storage';
import { clsx } from 'clsx';

const DEFAULT_CONFIG: AppConfig = {
    browserSync: false,
    defaultColors: ['#4a9eff', '#4CAF50', '#ff9800', '#f44336', '#9c27b0'],
    settings: [
        {
            name: 'default',
            enable: true,
            sites: [],
            defaults: {
                envName: 'dev',
                backgroundEnable: false,
                flagEnable: false,
                color: '#4a9eff'
            }
        }
    ],
    cloudEnvironments: []
};

const App: React.FC = () => {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [activeTab, setActiveTab] = useState(0);

    // Modal states
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    // Selection states for editing
    const [editingSite, setEditingSite] = useState<{ groupIdx: number, siteIdx: number } | null>(null);
    const [editingGroupIdx, setEditingGroupIdx] = useState<number | null>(null);
    const [editingEnv, setEditingEnv] = useState<CloudEnvironment | null>(null);
    const [editingAccount, setEditingAccount] = useState<{ envId: string, account: CloudAccount } | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            const savedConfig = await storage.getItem<AppConfig>('sync:appConfig');
            if (savedConfig) {
                setConfig(savedConfig);
            }
        };
        loadConfig();
    }, []);

    const saveConfig = async (newConfig: AppConfig) => {
        setConfig(newConfig);
        await storage.setItem('sync:appConfig', newConfig);

        // Broadcast message to background/content scripts if needed
        // chrome.runtime.sendMessage({ type: 'CONFIG_UPDATED', config: newConfig });
    };

    // --- Handlers for Config Groups & Sites ---

    const handleToggleGroup = (idx: number, enabled: boolean) => {
        const newSettings = [...config.settings];
        newSettings[idx].enable = enabled;
        saveConfig({ ...config, settings: newSettings });
    };

    const handleDeleteGroup = (idx: number) => {
        if (config.settings.length <= 1) return alert("Cannot delete the only group.");
        if (confirm("Delete this group and all its sites?")) {
            const newSettings = config.settings.filter((_, i) => i !== idx);
            saveConfig({ ...config, settings: newSettings });
        }
    };

    const handleSaveGroup = (name: string, defaults: GroupDefaults) => {
        if (editingGroupIdx !== null) {
            const newSettings = [...config.settings];
            newSettings[editingGroupIdx] = { ...newSettings[editingGroupIdx], name, defaults };
            saveConfig({ ...config, settings: newSettings });
        } else {
            const newGroup: Setting = { name, enable: true, sites: [], defaults };
            saveConfig({ ...config, settings: [...config.settings, newGroup] });
        }
        setEditingGroupIdx(null);
    };

    const handleSaveSite = (siteData: SiteConfig) => {
        const newSettings = [...config.settings];
        if (editingSite) {
            newSettings[editingSite.groupIdx].sites[editingSite.siteIdx] = siteData;
        } else {
            // Add to first group by default as per legacy logic
            if (newSettings.length === 0) {
                newSettings.push({ ...DEFAULT_CONFIG.settings[0], sites: [siteData] });
            } else {
                newSettings[0].sites.push(siteData);
            }
        }
        saveConfig({ ...config, settings: newSettings });
        setEditingSite(null);
    };

    const handleToggleSite = (groupIdx: number, siteIdx: number, enabled: boolean) => {
        const newSettings = [...config.settings];
        newSettings[groupIdx].sites[siteIdx].enable = enabled;
        saveConfig({ ...config, settings: newSettings });
    };

    const handleDeleteSite = (groupIdx: number, siteIdx: number) => {
        if (confirm("Delete this site configuration?")) {
            const newSettings = [...config.settings];
            newSettings[groupIdx].sites.splice(siteIdx, 1);
            saveConfig({ ...config, settings: newSettings });
        }
    };

    // --- Handlers for Cloud Environments & Accounts ---

    const handleSaveEnv = (env: CloudEnvironment) => {
        const envs = [...(config.cloudEnvironments || [])];
        const idx = envs.findIndex(e => e.id === env.id);
        if (idx >= 0) {
            envs[idx] = env;
        } else {
            envs.push(env);
        }
        saveConfig({ ...config, cloudEnvironments: envs });
        setEditingEnv(null);
    };

    const handleToggleEnv = (envId: string, enabled: boolean) => {
        const envs = (config.cloudEnvironments || []).map(e => e.id === envId ? { ...e, enable: enabled } : e);
        saveConfig({ ...config, cloudEnvironments: envs });
    };

    const handleDeleteEnv = (envId: string) => {
        if (confirm("Delete this cloud environment and all its accounts?")) {
            const envs = (config.cloudEnvironments || []).filter(e => e.id !== envId);
            saveConfig({ ...config, cloudEnvironments: envs });
        }
    };

    const handleSaveAccount = (account: CloudAccount) => {
        if (!editingAccount) return;
        const envs = [...(config.cloudEnvironments || [])];
        const envIdx = envs.findIndex(e => e.id === editingAccount.envId);
        if (envIdx < 0) return;

        const accIdx = envs[envIdx].accounts.findIndex(a => a.id === account.id);
        if (accIdx >= 0) {
            envs[envIdx].accounts[accIdx] = account;
        } else {
            envs[envIdx].accounts.push(account);
        }
        saveConfig({ ...config, cloudEnvironments: envs });
        setEditingAccount(null);
    };

    const handleToggleAccount = (envId: string, accId: string, enabled: boolean) => {
        const envs = (config.cloudEnvironments || []).map(e => {
            if (e.id !== envId) return e;
            return {
                ...e,
                accounts: e.accounts.map(a => a.id === accId ? { ...a, enable: enabled } : a)
            };
        });
        saveConfig({ ...config, cloudEnvironments: envs });
    };

    const handleDeleteAccount = (envId: string, accId: string) => {
        if (confirm("Delete this cloud account?")) {
            const envs = (config.cloudEnvironments || []).map(e => {
                if (e.id !== envId) return e;
                return {
                    ...e,
                    accounts: e.accounts.filter(a => a.id !== accId)
                };
            });
            saveConfig({ ...config, cloudEnvironments: envs });
        }
    };

    const exportConfig = () => {
        const data = JSON.stringify(config, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enveil-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importConfig = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target?.result as string);
                        saveConfig({ ...DEFAULT_CONFIG, ...imported });
                    } catch (err) {
                        alert("Invalid config file.");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 border-r bg-white p-6 space-y-8 h-screen sticky top-0 overflow-y-auto">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-600" /> General
                        </h2>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                        <Switch
                            label="Sync enabled"
                            checked={config.browserSync}
                            onChange={(checked) => saveConfig({ ...config, browserSync: checked })}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Colors</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {config.defaultColors.map((color, idx) => (
                            <div key={idx} className="relative aspect-square">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                        const newColors = [...config.defaultColors];
                                        newColors[idx] = e.target.value.toUpperCase();
                                        saveConfig({ ...config, defaultColors: newColors });
                                    }}
                                    className="absolute inset-0 w-full h-full rounded-xl cursor-pointer border-2 border-white shadow-sm"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => saveConfig({ ...config, defaultColors: [...config.defaultColors, '#4A9EFF'] })}
                            className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all hover:bg-blue-50"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="pt-8 space-y-2">
                    <button
                        onClick={importConfig}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                        <div className="flex items-center gap-3"><FileUp className="w-4 h-4 text-orange-500" /> Import</div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                    <button
                        onClick={exportConfig}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                        <div className="flex items-center gap-3"><FileDown className="w-4 h-4 text-green-500" /> Export</div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                </div>

                <div className="mt-auto pt-10 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-tighter shadow-inner">
                        Enveil v1.0.0
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 max-w-6xl mx-auto w-full">
                <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-10">
                        <TabList className="flex gap-2 bg-gray-200/40 p-1.5 rounded-2xl backdrop-blur-sm">
                            <Tab className={({ selected }) => clsx(
                                'flex items-center gap-2.5 px-8 py-2.5 text-sm font-black uppercase tracking-widest rounded-xl outline-none transition-all',
                                selected ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-gray-400 hover:text-gray-600'
                            )}>
                                <Settings className="w-4 h-4" /> Configs
                            </Tab>
                            <Tab className={({ selected }) => clsx(
                                'flex items-center gap-2.5 px-8 py-2.5 text-sm font-black uppercase tracking-widest rounded-xl outline-none transition-all',
                                selected ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-gray-400 hover:text-gray-600'
                            )}>
                                <Cloud className="w-4 h-4" /> Cloud
                            </Tab>
                        </TabList>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (activeTab === 0) setIsGroupModalOpen(true);
                                    else setIsEnvModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 active:scale-95"
                            >
                                {activeTab === 0 ? (
                                    <><FolderPlus className="w-4 h-4" /> Add Group</>
                                ) : (
                                    <><Plus className="w-4 h-4" /> Add Env</>
                                )}
                            </button>
                            {activeTab === 0 && config.settings.length > 0 && (
                                <button
                                    onClick={() => setIsSiteModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-50 text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Add Site
                                </button>
                            )}
                        </div>
                    </div>

                    <TabPanels>
                        <TabPanel className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {config.settings.length === 0 ? (
                                <div className="text-center py-32 bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                                        <FolderPlus className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">No Config Groups</h3>
                                    <p className="text-gray-400 max-w-xs mx-auto text-sm">Create your first group to start organizing your environment indicators.</p>
                                </div>
                            ) : (
                                config.settings.map((setting, idx) => (
                                    <ConfigGroup
                                        key={idx}
                                        setting={setting}
                                        onToggle={(enabled) => handleToggleGroup(idx, enabled)}
                                        onAddSite={() => {
                                            setEditingSite(null);
                                            setIsSiteModalOpen(true);
                                        }}
                                        onEditGroup={() => {
                                            setEditingGroupIdx(idx);
                                            setIsGroupModalOpen(true);
                                        }}
                                        onDeleteGroup={() => handleDeleteGroup(idx)}
                                        onExportGroup={() => {
                                            const data = JSON.stringify({ settings: [setting] }, null, 2);
                                            const blob = new Blob([data], { type: 'application/json' });
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(blob);
                                            a.download = `enveil-group-${setting.name}.json`;
                                            a.click();
                                        }}
                                        onToggleSite={(siteIdx, enabled) => handleToggleSite(idx, siteIdx, enabled)}
                                        onEditSite={(siteIdx) => {
                                            setEditingSite({ groupIdx: idx, siteIdx });
                                            setIsSiteModalOpen(true);
                                        }}
                                        onDeleteSite={(siteIdx) => handleDeleteSite(idx, siteIdx)}
                                    />
                                ))
                            )}
                        </TabPanel>

                        <TabPanel className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {(config.cloudEnvironments || []).length === 0 ? (
                                <div className="text-center py-32 bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-200">
                                        <Cloud className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">Cloud Highlights</h3>
                                    <p className="text-gray-400 max-w-xs mx-auto text-sm">Visualize different cloud accounts and roles automatically.</p>
                                </div>
                            ) : (
                                (config.cloudEnvironments || []).map((env) => (
                                    <CloudEnvironmentItem
                                        key={env.id}
                                        environment={env}
                                        onToggle={(enabled) => handleToggleEnv(env.id, enabled)}
                                        onAddAccount={() => {
                                            setEditingAccount({ envId: env.id, account: undefined as any });
                                            setIsAccountModalOpen(true);
                                        }}
                                        onEdit={() => {
                                            setEditingEnv(env);
                                            setIsEnvModalOpen(true);
                                        }}
                                        onDelete={() => handleDeleteEnv(env.id)}
                                        onToggleAccount={(accId, enabled) => handleToggleAccount(env.id, accId, enabled)}
                                        onEditAccount={(acc) => {
                                            setEditingAccount({ envId: env.id, account: acc });
                                            setIsAccountModalOpen(true);
                                        }}
                                        onDeleteAccount={(accId) => handleDeleteAccount(env.id, accId)}
                                    />
                                ))
                            )}
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </main>

            {/* Modals */}
            <AddSiteModal
                isOpen={isSiteModalOpen}
                onClose={() => {
                    setIsSiteModalOpen(false);
                    setEditingSite(null);
                }}
                onSave={handleSaveSite}
                site={editingSite ? config.settings[editingSite.groupIdx].sites[editingSite.siteIdx] : undefined}
                defaultColors={config.defaultColors}
            />

            <AddGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => {
                    setIsGroupModalOpen(false);
                    setEditingGroupIdx(null);
                }}
                onSave={handleSaveGroup}
                group={editingGroupIdx !== null ? config.settings[editingGroupIdx] : undefined}
                defaultColors={config.defaultColors}
            />

            <AddCloudEnvironmentModal
                isOpen={isEnvModalOpen}
                onClose={() => {
                    setIsEnvModalOpen(false);
                    setEditingEnv(null);
                }}
                onSave={handleSaveEnv}
                environment={editingEnv || undefined}
            />

            {editingAccount && (
                <AddCloudAccountModal
                    isOpen={isAccountModalOpen}
                    onClose={() => {
                        setIsAccountModalOpen(false);
                        setEditingAccount(null);
                    }}
                    onSave={handleSaveAccount}
                    environment={config.cloudEnvironments!.find(e => e.id === editingAccount.envId)!}
                    account={editingAccount.account}
                    defaultColors={config.defaultColors}
                />
            )}
        </div>
    );
};

export default App;
