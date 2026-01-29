import React from 'react';
import { Plus, Edit3, Trash2, Cloud, Download } from 'lucide-react';
import { Switch } from './Switch';
import { CloudEnvironment, CloudAccount } from '../entrypoints/options/types';
import { clsx } from 'clsx';

interface CloudEnvironmentProps {
    environment: CloudEnvironment;
    onToggle: (enabled: boolean) => void;
    onAddAccount: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onExport: () => void;
    onToggleAccount: (accountId: string, enabled: boolean) => void;
    onEditAccount: (account: CloudAccount) => void;
    onDeleteAccount: (accountId: string) => void;
}

export const CloudEnvironmentItem: React.FC<CloudEnvironmentProps> = ({
    environment,
    onToggle,
    onAddAccount,
    onEdit,
    onDelete,
    onExport,
    onToggleAccount,
    onEditAccount,
    onDeleteAccount
}) => {
    return (
        <div className={clsx(
            "bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden shadow-sm",
            environment.enable
                ? "border-gray-200 dark:border-slate-800"
                : "border-gray-100 dark:border-slate-800 opacity-75 grayscale-[0.5]"
        )}>
            <div className="bg-gray-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Switch checked={environment.enable} onChange={onToggle} />
                    <div className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <h3 className="font-bold text-gray-900 dark:text-slate-100">{environment.name}</h3>
                        <span className="text-xs font-medium text-gray-400 dark:text-slate-500 bg-gray-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-full border dark:border-slate-700">
                            {environment.accounts.length} accounts
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddAccount}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Account
                    </button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-1" />
                    <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-md transition-colors" title="Edit Provider">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={onExport} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-md transition-colors" title="Export Provider">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors" title="Delete Provider">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-3">
                {environment.accounts.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                        <p className="text-sm text-gray-400 dark:text-slate-500">No accounts configured for this environment.</p>
                    </div>
                ) : (
                    environment.accounts.map((account) => (
                        <div
                            key={account.id}
                            className={clsx(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                                account.enable
                                    ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm"
                                    : "bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 opacity-75"
                            )}
                        >
                            <Switch checked={account.enable} onChange={(enabled) => onToggleAccount(account.id, enabled)} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div
                                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20"
                                        style={{ backgroundColor: account.color }}
                                    />
                                    <span className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                                        {account.name}
                                    </span>
                                </div>
                                <div className="flex gap-3 text-xs text-gray-500 dark:text-slate-400 font-medium">
                                    <span className="bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded leading-none text-[10px] font-bold uppercase tracking-tight dark:text-slate-300">{account.matchValue}</span>
                                    <span className="text-[10px] uppercase tracking-tight flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                                        {account.roles.length} roles
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEditAccount(account)}
                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDeleteAccount(account.id)}
                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
