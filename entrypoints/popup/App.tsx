import React, { useState, useEffect } from 'react';
import { Settings, Plus, Globe, Layout, ChevronRight } from 'lucide-react';
import { Switch } from '../../components/Switch';
import { storage } from 'wxt/utils/storage';
import { Matcher } from '../../utils/matcher';
import { AppConfig, SiteConfig } from '../options/types';
import { clsx } from 'clsx';

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

const App: React.FC = () => {
    const [matchingSites, setMatchingSites] = useState<{ site: SiteConfig, groupIdx: number, siteIdx: number }[]>([]);
    const [currentHost, setCurrentHost] = useState('');

    useEffect(() => {
        const init = async () => {
            // Get current tab URL
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.url) {
                try {
                    const urlObj = new URL(tab.url);
                    setCurrentHost(urlObj.hostname);
                } catch (e) { }
            }

            // Load config and find matches
            await refreshMatches();
        };

        init();
    }, []);

    const refreshMatches = async () => {
        const config = await storage.getItem<AppConfig>('sync:appConfig');
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (config && tab?.url) {
            const url = tab.url;
            let host = '';
            try { host = new URL(url).hostname; } catch (e) { }

            const matches: { site: SiteConfig, groupIdx: number, siteIdx: number }[] = [];
            config.settings.forEach((group, gIdx) => {
                group.sites.forEach((site, sIdx) => {
                    if (Matcher.isMatch(site, url, host, true)) {
                        matches.push({ site, groupIdx: gIdx, siteIdx: sIdx });
                    }
                });
            });
            setMatchingSites(matches);
        }
    };

    const toggleSite = async (groupIdx: number, siteIdx: number, enabled: boolean) => {
        const config = await storage.getItem<AppConfig>('sync:appConfig');
        if (config) {
            config.settings[groupIdx].sites[siteIdx].enable = enabled;
            await storage.setItem('sync:appConfig', config);
            await refreshMatches();
        }
    };

    const openOptions = async (params = '') => {
        await browser.tabs.create({
            url: browser.runtime.getURL(`/options.html${params}`)
        });
    };

    const addSite = async () => {
        if (currentHost) {
            openOptions(`?action=addSite&domain=${encodeURIComponent(currentHost)}&pattern=domain`);
        } else {
            openOptions();
        }
    };

    return (
        <div className="w-80 bg-white dark:bg-slate-900 p-5 space-y-5 transition-colors duration-300">
            {/* Matching Sites */}
            {matchingSites.length > 0 && (
                <div className="space-y-3">
                    <div className="px-1 flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Active Site Configs</span>
                    </div>
                    <div className="space-y-2">
                        {matchingSites.map(({ site, groupIdx, siteIdx }, idx) => (
                            <div
                                key={idx}
                                className={clsx(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                                    site.enable
                                        ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm"
                                        : "bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 opacity-75"
                                )}
                            >
                                <Switch
                                    checked={site.enable}
                                    onChange={(val) => toggleSite(groupIdx, siteIdx, val)}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider text-white shadow-sm ring-1 ring-white/20"
                                            style={{ backgroundColor: site.color }}
                                        >
                                            {site.envName}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                                            {patternMap[site.matchPattern] || site.matchPattern}: {site.matchValue}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] font-medium text-gray-500 dark:text-slate-400 tracking-tight">
                                        <span className="flex items-center gap-1">
                                            <div className={clsx("w-1.5 h-1.5 rounded-full", site.backgroudEnable ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700")} />
                                            Background: {site.backgroudEnable ? 'On' : 'Off'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className={clsx("w-1.5 h-1.5 rounded-full", site.flagEnable ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700")} />
                                            Banner: {site.flagEnable ? 'On' : 'Off'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <button
                    onClick={addSite}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] text-sm"
                >
                    <div className="flex items-center gap-3"><Plus className="w-4 h-4" /> Add This Site</div>
                    <Globe className="w-4 h-4 opacity-50" />
                </button>
                <button
                    onClick={() => openOptions()}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-100 dark:border-slate-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold shadow-sm active:scale-[0.98] text-sm"
                >
                    <div className="flex items-center gap-3"><Settings className="w-4 h-4 text-gray-400" /> Configure</div>
                    <ChevronRight className="w-4 h-4 opacity-30" />
                </button>
            </div>

        </div>
    );
};

export default App;
