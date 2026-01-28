import React from 'react';
import { Plus, Edit3, Trash2, Cloud, ChevronRight, ChevronDown } from 'lucide-react';
import { Switch } from './Switch';
import { CloudEnvironment, CloudAccount } from '../entrypoints/options/types';
import { clsx } from 'clsx';

interface CloudEnvironmentProps {
    environment: CloudEnvironment;
    onToggle: (enabled: boolean) => void;
    onAddAccount: () => void;
    onEdit: () => void;
    onDelete: () => void;
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
    onToggleAccount,
    onEditAccount,
    onDeleteAccount
}) => {
    return (
        <div className={clsx(
            "bg-white rounded-2xl border transition-all overflow-hidden shadow-sm",
            environment.enable ? "border-gray-200" : "border-gray-100 opacity-75 grayscale-[0.5]"
        )}>
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Switch checked={environment.enable} onChange={onToggle} />
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{environment.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {environment.provider} • {environment.accounts.length} accounts
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddAccount}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Account
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-3">
                {environment.accounts.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">No accounts configured for this environment.</p>
                    </div>
                ) : (
                    environment.accounts.map((account) => (
                        <div
                            key={account.id}
                            className={clsx(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                account.enable ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-75"
                            )}
                        >
                            <Switch checked={account.enable} onChange={(enabled) => onToggleAccount(account.id, enabled)} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div
                                        className="w-3 h-3 rounded-full shadow-sm"
                                        style={{ backgroundColor: account.color }}
                                    />
                                    <span className="text-sm font-bold text-gray-900 truncate">
                                        {account.name}
                                    </span>
                                </div>
                                <div className="flex gap-3 text-xs text-gray-500 font-medium">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded leading-none">{account.matchValue}</span>
                                    <span>{account.roles.length} roles</span>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEditAccount(account)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDeleteAccount(account.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
