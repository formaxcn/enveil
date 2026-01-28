import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { CloudAccount, CloudRole, CloudEnvironment } from '../entrypoints/options/types';
import { Switch } from './Switch';
import { Plus, Trash2, Edit2, Check, X, Palette } from 'lucide-react';
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
    matchPattern: 'domain',
    matchValue: '',
    color: '#4a9eff',
    backgroundEnable: true,
    roles: [],
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
    const pickerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (account) {
            setFormData(account);
        } else {
            setFormData({
                ...INITIAL_ACCOUNT,
                id: crypto.randomUUID(),
                created: Date.now(),
                modified: Date.now(),
                color: defaultColors[0] || '#4a9eff'
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
            id: crypto.randomUUID(),
            name: '',
            enable: true,
            keywords: [],
            highlightColor: '#ffeb3b',
            highlightStyle: {
                textColor: '#000000',
                backgroundColor: '#ffeb3b',
                fontWeight: 'normal',
                textDecoration: 'none',
                border: 'none'
            },
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={account ? 'Edit Cloud Account' : 'Add New Cloud Account'}
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

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="form-group font-bold">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Account Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. My AWS Account"
                            />
                        </div>

                        <div className="form-group font-bold">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Match Value</label>
                            <input
                                type="text"
                                required
                                value={formData.matchValue}
                                onChange={(e) => setFormData({ ...formData, matchValue: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-900 dark:text-slate-100 transition-all border"
                                placeholder="e.g. 123456789012"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Visual Feedback</h4>
                        <Switch
                            label="Background Highlight"
                            checked={formData.backgroundEnable}
                            onChange={(checked) => setFormData({ ...formData, backgroundEnable: checked })}
                        />

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Theme Color</label>
                            <div className="flex flex-wrap gap-2">
                                {defaultColors.map((color, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={clsx(
                                            "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm ring-1 ring-black/5",
                                            formData.color === color ? "border-blue-500 scale-110 ring-4 ring-blue-500/20" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
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
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Role / Keywords</th>
                                    <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest w-20">Color</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {formData.roles.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-10 text-center text-gray-400 dark:text-slate-600 italic">
                                            No specific roles configured.
                                        </td>
                                    </tr>
                                ) : (
                                    formData.roles.map((role, idx) => (
                                        <tr key={role.id} className={clsx("transition-all", editingRoleIndex === idx ? "bg-blue-50/30 dark:bg-blue-900/10" : "")}>
                                            <td className="px-4 py-4">
                                                {editingRoleIndex === idx ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={role.name}
                                                            onChange={(e) => updateRole(idx, { name: e.target.value })}
                                                            placeholder="Role name"
                                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 dark:text-slate-100 transition-all"
                                                        />
                                                        <textarea
                                                            value={role.keywords.join(', ')}
                                                            onChange={(e) => updateRole(idx, { keywords: e.target.value.split(',').map(s => s.trim()) })}
                                                            placeholder="Keywords (comma separated)"
                                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-500 dark:text-slate-400 min-h-[60px]"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="group">
                                                        <div className="font-bold text-gray-900 dark:text-slate-100">{role.name || 'Unnamed Role'}</div>
                                                        <div className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-tight mt-1 truncate max-w-xs">{role.keywords.join(' • ') || 'No keywords'}</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    <input
                                                        type="color"
                                                        value={role.highlightColor}
                                                        onChange={(e) => updateRole(idx, { highlightColor: e.target.value, highlightStyle: { ...role.highlightStyle, backgroundColor: e.target.value } })}
                                                        disabled={editingRoleIndex !== idx}
                                                        className="w-8 h-8 rounded-lg cursor-pointer disabled:opacity-50 ring-1 ring-black/5 dark:ring-white/10"
                                                    />
                                                </div>
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
                        {account ? 'Update Account' : 'Save Account'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
