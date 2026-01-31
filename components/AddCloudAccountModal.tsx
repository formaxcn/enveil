import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CloudAccount, CloudRole, CloudEnvironment, CloudAccountPattern } from '../entrypoints/options/types';
import { Switch } from './Switch';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface AddCloudAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: CloudAccount) => void;
    environment: CloudEnvironment;
    account?: CloudAccount;
    defaultColors: string[];
}

const INITIAL_ACCOUNT: Omit<CloudAccount, 'id' | 'created' | 'modified'> = {
    name: '',
    enable: true,
    backgroundEnable: true,
    backgroundColor: '#4a9eff',
    highlightEnable: true,
    highlightColor: '#ffeb3b',
    accountPatterns: [],
    roles: [],
};

const INITIAL_ROLE: Omit<CloudRole, 'id' | 'created' | 'modified'> = {
    enable: true,
    matchPattern: 'keyword',
    matchValue: '',
};

const INITIAL_ACCOUNT_PATTERN: Omit<CloudAccountPattern, 'id' | 'created' | 'modified'> = {
    enable: true,
    matchPattern: 'keyword',
    matchValue: '',
};

export const AddCloudAccountModal: React.FC<AddCloudAccountModalProps> = ({
    isOpen,
    onClose,
    onSave,
    environment,
    account,
    defaultColors,
}) => {
    const [formData, setFormData] = useState<CloudAccount>(account || { ...INITIAL_ACCOUNT, id: crypto.randomUUID(), created: Date.now(), modified: Date.now() } as CloudAccount);
    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
    const [editingPatternIndex, setEditingPatternIndex] = useState<number | null>(null);

    useEffect(() => {
        if (account) {
            setFormData(account);
        } else {
            const randomBgColor = defaultColors.length > 0
                ? defaultColors[Math.floor(Math.random() * defaultColors.length)]
                : '#4a9eff';

            setFormData({
                ...INITIAL_ACCOUNT,
                id: crypto.randomUUID(),
                created: Date.now(),
                modified: Date.now(),
                backgroundColor: randomBgColor
            } as CloudAccount);
        }
    }, [account, isOpen, defaultColors]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const addRole = () => {
        const newRole: CloudRole = {
            ...INITIAL_ROLE,
            id: crypto.randomUUID(),
            created: Date.now(),
            modified: Date.now()
        };
        const newRoles = [...formData.roles, newRole];
        setFormData({ ...formData, roles: newRoles });
        setEditingRoleIndex(newRoles.length - 1);
    };

    const updateRole = (index: number, updates: Partial<CloudRole>) => {
        const newRoles = [...formData.roles];
        newRoles[index] = { ...newRoles[index], ...updates };
        setFormData({ ...formData, roles: newRoles });
    };

    const deleteRole = (index: number) => {
        const newRoles = formData.roles.filter((_, i) => i !== index);
        setFormData({ ...formData, roles: newRoles });
        setEditingRoleIndex(null);
    };

    const addAccountPattern = () => {
        const newPattern: CloudAccountPattern = {
            ...INITIAL_ACCOUNT_PATTERN,
            id: crypto.randomUUID(),
            created: Date.now(),
            modified: Date.now()
        };
        const newPatterns = [...formData.accountPatterns, newPattern];
        setFormData({ ...formData, accountPatterns: newPatterns });
        setEditingPatternIndex(newPatterns.length - 1);
    };

    const updateAccountPattern = (index: number, updates: Partial<CloudAccountPattern>) => {
        const newPatterns = [...formData.accountPatterns];
        newPatterns[index] = { ...newPatterns[index], ...updates };
        setFormData({ ...formData, accountPatterns: newPatterns });
    };

    const deleteAccountPattern = (index: number) => {
        const newPatterns = formData.accountPatterns.filter((_, i) => i !== index);
        setFormData({ ...formData, accountPatterns: newPatterns });
        setEditingPatternIndex(null);
    };

    const patternMap: Record<string, string> = {
        'keyword': 'Keyword',
        'regex': 'Regex'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={account ? 'Edit Config' : 'Add New Config'}
            width="2xl"
        >
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Status</span>
                    <Switch
                        checked={formData.enable}
                        onChange={(checked) => setFormData({ ...formData, enable: checked })}
                    />
                </div>

                <div className="space-y-4">
                    <div className="form-group font-bold">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Config Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. My AWS Config"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Background</h4>
                                <Switch
                                    checked={formData.backgroundEnable}
                                    onChange={(checked) => setFormData({ ...formData, backgroundEnable: checked })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {defaultColors.map((color, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, backgroundColor: color })}
                                            className={clsx(
                                                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm ring-1 ring-black/5",
                                                formData.backgroundColor === color ? "border-blue-500 scale-110 ring-4 ring-blue-500/20" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Highlight</h4>
                                <Switch
                                    checked={formData.highlightEnable}
                                    onChange={(checked) => setFormData({ ...formData, highlightEnable: checked })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {['#ffeb3b', '#ff9800', '#f44336', '#4caf50', '#2196f3', '#9c27b0'].map((color, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, highlightColor: color })}
                                            className={clsx(
                                                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm ring-1 ring-black/5",
                                                formData.highlightColor === color ? "border-blue-500 scale-110 ring-4 ring-blue-500/20" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-slate-100">Account Matching Patterns</h4>
                        <button
                            type="button"
                            onClick={addAccountPattern}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 hover:bg-blue-100 dark:hover:bg-blue-400/20 rounded-lg transition-colors border border-blue-100 dark:border-blue-400/20"
                        >
                            <Plus className="w-4 h-4" /> Add Pattern
                        </button>
                    </div>

                    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest w-16">Enable</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Pattern</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Value</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {formData.accountPatterns.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400 dark:text-slate-600 italic">
                                            No account patterns configured.
                                        </td>
                                    </tr>
                                ) : (
                                    formData.accountPatterns.map((pattern, idx) => (
                                        <tr key={pattern.id} className={clsx("transition-all", editingPatternIndex === idx ? "bg-blue-50/30 dark:bg-blue-900/10" : "")}>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center">
                                                    <Switch
                                                        checked={pattern.enable}
                                                        onChange={(checked) => updateAccountPattern(idx, { enable: checked })}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingPatternIndex === idx ? (
                                                    <select
                                                        value={pattern.matchPattern}
                                                        onChange={(e) => updateAccountPattern(idx, { matchPattern: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors border"
                                                    >
                                                        <option value="keyword" className="bg-white dark:bg-slate-900">Keyword</option>
                                                        <option value="regex" className="bg-white dark:bg-slate-900">Regex</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                                                        {patternMap[pattern.matchPattern] || pattern.matchPattern}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingPatternIndex === idx ? (
                                                    <input
                                                        type="text"
                                                        value={pattern.matchValue}
                                                        onChange={(e) => updateAccountPattern(idx, { matchValue: e.target.value })}
                                                        placeholder={pattern.matchPattern === 'regex' ? 'Regex pattern' : 'Keyword'}
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-gray-900 dark:text-slate-100 transition-all"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-mono text-gray-600 dark:text-slate-400 truncate max-w-[150px] block">
                                                        {pattern.matchValue || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {editingPatternIndex === idx ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingPatternIndex(null)}
                                                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingPatternIndex(idx)}
                                                            className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteAccountPattern(idx)}
                                                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-slate-100">Role Specific Highlighting</h4>
                        <button
                            type="button"
                            onClick={addRole}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 hover:bg-blue-100 dark:hover:bg-blue-400/20 rounded-lg transition-colors border border-blue-100 dark:border-blue-400/20"
                        >
                            <Plus className="w-4 h-4" /> Add Role
                        </button>
                    </div>

                    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest w-16">Enable</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Pattern</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Value</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {formData.roles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400 dark:text-slate-600 italic">
                                            No specific roles configured.
                                        </td>
                                    </tr>
                                ) : (
                                    formData.roles.map((role, idx) => (
                                        <tr key={role.id} className={clsx("transition-all", editingRoleIndex === idx ? "bg-blue-50/30 dark:bg-blue-900/10" : "")}>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center">
                                                    <Switch
                                                        checked={role.enable}
                                                        onChange={(checked) => updateRole(idx, { enable: checked })}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingRoleIndex === idx ? (
                                                    <select
                                                        value={role.matchPattern}
                                                        onChange={(e) => updateRole(idx, { matchPattern: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors border"
                                                    >
                                                        <option value="keyword" className="bg-white dark:bg-slate-900">Keyword</option>
                                                        <option value="regex" className="bg-white dark:bg-slate-900">Regex</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                                                        {patternMap[role.matchPattern] || role.matchPattern}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingRoleIndex === idx ? (
                                                    <input
                                                        type="text"
                                                        value={role.matchValue}
                                                        onChange={(e) => updateRole(idx, { matchValue: e.target.value })}
                                                        placeholder={role.matchPattern === 'regex' ? 'Regex pattern' : 'Keyword'}
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-gray-900 dark:text-slate-100 transition-all"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-mono text-gray-600 dark:text-slate-400 truncate max-w-[150px] block">
                                                        {role.matchValue || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {editingRoleIndex === idx ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingRoleIndex(null)}
                                                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingRoleIndex(idx)}
                                                            className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteRole(idx)}
                                                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
                        {account ? 'Update Config' : 'Save Config'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
