import React, { useState, useEffect } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { Globe, Cloudy, Cloud, FileUp, FileDown, Plus, FolderPlus, Info, ChevronRight, Zap, X, Edit3 } from 'lucide-react';
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
        const checkInlineView = async () => {
            // If window width is small (likely in chrome://extensions modal)
            // or if explicitly requested via search params
            const isSmall = window.innerWidth < 640;
            const urlParams = new URLSearchParams(window.location.search);
            const isForced = urlParams.get('view') === 'inline';

            if (isSmall && !isForced) {
                // Redirect to full tab
                await browser.tabs.create({
                    url: browser.runtime.getURL('/options.html')
                });
                // Close the current inline window/modal if possible
                window.close();
            }
        };

        const loadConfig = async () => {
            const savedConfig = await storage.getItem<AppConfig>('sync:appConfig');
            if (savedConfig) {
                setConfig(savedConfig);
            }
        };

        checkInlineView();
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

                        // Check if it's a full config (has browserSync or both settings and cloudEnvironments)
                        const isFullConfig = imported.browserSync !== undefined ||
                            (imported.settings && imported.cloudEnvironments);

                        // Check if it's a config group export (only has settings)
                        const isGroupExport = imported.settings && !imported.cloudEnvironments && !imported.browserSync;

                        // Check if it's a cloud provider export (only has cloudEnvironments)
                        const isCloudExport = imported.cloudEnvironments && !imported.settings && !imported.browserSync;

                        if (isFullConfig) {
                            // Full config import - require confirmation
                            if (confirm("This will overwrite all your current settings. Continue?")) {
                                saveConfig({ ...DEFAULT_CONFIG, ...imported });
                            }
                        } else if (isGroupExport) {
                            // Config group export - append to existing settings
                            const newSettings = [...config.settings, ...imported.settings];
                            saveConfig({ ...config, settings: newSettings });
                            alert(`Imported ${imported.settings.length} config group(s).`);
                        } else if (isCloudExport) {
                            // Cloud provider export - append to existing cloudEnvironments
                            const newEnvs = [...(config.cloudEnvironments || []), ...imported.cloudEnvironments];
                            saveConfig({ ...config, cloudEnvironments: newEnvs });
                            alert(`Imported ${imported.cloudEnvironments.length} cloud provider(s).`);
                        } else {
                            alert("Invalid config file format.");
                        }
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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40 dark:selection:text-blue-200">
            {/* Sidebar */}
            <aside className="w-80 border-r dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 space-y-12 h-screen sticky top-0 overflow-y-auto flex flex-col scrollbar-thin">
                <div className="space-y-10">
                    {/* Sidebar Header Removed as per request */}
                    <div className="h-4" />

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="p-5 bg-gray-50 dark:bg-slate-800/40 rounded-[2rem] space-y-4 border border-gray-100 dark:border-slate-800 transition-all hover:border-gray-200 dark:hover:border-slate-700">
                                <Switch
                                    label="Browser Sync"
                                    checked={config.browserSync}
                                    onChange={(checked) => saveConfig({ ...config, browserSync: checked })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-3">
                                {config.defaultColors.map((color, idx) => (
                                    <div key={idx} className="relative aspect-square group rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-all hover:ring-4 hover:ring-blue-500/10">
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => {
                                                const newColors = [...config.defaultColors];
                                                newColors[idx] = e.target.value.toUpperCase();
                                                saveConfig({ ...config, defaultColors: newColors });
                                            }}
                                            className="absolute inset-0 w-full h-full cursor-pointer transition-transform group-hover:scale-110 z-10 rounded-full overflow-hidden"
                                            style={{ backgroundColor: color }}
                                        />

                                        {/* Edit Icon Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit3 className="w-4 h-4 text-white drop-shadow-md" />
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (config.defaultColors.length <= 1) return alert("Keep at least one color.");
                                                const newColors = config.defaultColors.filter((_, i) => i !== idx);
                                                saveConfig({ ...config, defaultColors: newColors });
                                            }}
                                            className="absolute -top-2.5 -right-2.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-red-600 active:scale-95 shadow-md border-2 border-white dark:border-slate-800"
                                            title="Remove color"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const vibrantPool = ['#4a9eff', '#4CAF50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#e91e63', '#607d8b'];
                                        const currentColors = new Set(config.defaultColors.map(c => c.toLowerCase()));
                                        const nextColor = vibrantPool.find(c => !currentColors.has(c.toLowerCase())) ||
                                            `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

                                        saveConfig({ ...config, defaultColors: [...config.defaultColors, nextColor.toUpperCase()] });
                                    }}
                                    className="aspect-square border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:scale-110"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t dark:border-slate-800 space-y-3 mt-auto">
                    <button
                        onClick={importConfig}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/60 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <div className="flex items-center gap-3"><FileUp className="w-4 h-4" /> Import</div>
                        <ChevronRight className="w-4 h-4 opacity-30" />
                    </button>
                    <button
                        onClick={exportConfig}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/60 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <div className="flex items-center gap-3"><FileDown className="w-4 h-4" /> Export</div>
                        <ChevronRight className="w-4 h-4 opacity-30" />
                    </button>
                </div>

                <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 dark:bg-slate-800/80 rounded-full text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] shadow-inner transition-colors">
                        Build v1.{new Date().toISOString().split('T')[0].replace(/-/g, '')}.{new Date().toTimeString().split(' ')[0].replace(/:/g, '')}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-12 lg:p-16 max-w-[1400px] mx-auto w-full relative h-screen overflow-y-auto scrollbar-thin">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-[150px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-400/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                    <div className="flex items-center gap-8 mb-12">
                        <TabList className="flex-1 flex gap-2 bg-gray-200/50 dark:bg-slate-800/50 p-2 rounded-2xl backdrop-blur-md border border-white/20 dark:border-slate-800">
                            <Tab className={({ selected }) => clsx(
                                'flex-1 flex items-center justify-center gap-2.5 px-12 py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl outline-none transition-all',
                                selected
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xl shadow-blue-500/10 ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                            )}>
                                <Globe className="w-4 h-4" /> Site Configurations
                            </Tab>
                            <Tab className={({ selected }) => clsx(
                                'flex-1 flex items-center justify-center gap-2.5 px-12 py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl outline-none transition-all',
                                selected
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xl shadow-blue-500/10 ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                            )}>
                                <Cloudy className="w-4 h-4" /> Cloud Environments
                            </Tab>
                        </TabList>

                        <button
                            onClick={() => {
                                if (activeTab === 0) setIsGroupModalOpen(true);
                                else setIsEnvModalOpen(true);
                            }}
                            className="flex-none w-64 group flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 hover:shadow-blue-600/40"
                        >
                            {activeTab === 0 ? (
                                <><FolderPlus className="w-4 h-4 transition-transform group-hover:scale-125" /> Add Group</>
                            ) : (
                                <><Plus className="w-4 h-4 transition-transform group-hover:scale-125" /> Add Provider</>
                            )}
                        </button>
                    </div>

                    <TabPanels>
                        <TabPanel className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {config.settings.length === 0 ? (
                                <div className="text-center py-32 bg-white dark:bg-slate-900 border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-[3rem]">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-slate-700">
                                        <FolderPlus className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Config Groups</h3>
                                    <p className="text-gray-400 dark:text-slate-500 max-w-xs mx-auto text-sm">Create your first group to start organizing your environment indicators.</p>
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
                                <div className="text-center py-32 bg-white dark:bg-slate-900 border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-[3rem]">
                                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-200 dark:text-blue-800">
                                        <Cloud className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Cloud Highlights</h3>
                                    <p className="text-gray-400 dark:text-slate-500 max-w-xs mx-auto text-sm">Visualize different cloud accounts and roles automatically.</p>
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
                                        onExport={() => {
                                            const data = JSON.stringify({ cloudEnvironments: [env] }, null, 2);
                                            const blob = new Blob([data], { type: 'application/json' });
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(blob);
                                            a.download = `enveil-cloud-${env.name}.json`;
                                            a.click();
                                        }}
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
