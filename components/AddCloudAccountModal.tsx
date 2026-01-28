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
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-700">Status</span>
                    <Switch
                        checked={formData.enable}
                        onChange={(checked) => setFormData({ ...formData, enable: checked })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="form-group font-bold">
                            <label className="block text-sm text-gray-700 mb-2">Account Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. My AWS Account"
                            />
                        </div>

                        <div className="form-group font-bold">
                            <label className="block text-sm text-gray-700 mb-2">Match Value</label>
                            <input
                                type="text"
                                required
                                value={formData.matchValue}
                                onChange={(e) => setFormData({ ...formData, matchValue: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                placeholder="e.g. 123456789012"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visual Feedback</h4>
                        <Switch
                            label="Background Highlighting"
                            checked={formData.backgroundEnable}
                            onChange={(checked) => setFormData({ ...formData, backgroundEnable: checked })}
                        />

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Theme Color</label>
                            <div className="flex flex-wrap gap-2">
                                {defaultColors.map((color, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={clsx(
                                            "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                            formData.color === color ? "border-blue-500 scale-110 ring-2 ring-blue-100" : "border-transparent"
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
                        <h4 className="text-sm font-bold text-gray-900">Role Specific Highlighting</h4>
                        <button
                            type="button"
                            onClick={addRole}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Role
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Role / Keywords</th>
                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase w-20">Color</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.roles.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                                            No specific roles configured.
                                        </td>
                                    </tr>
                                ) : (
                                    formData.roles.map((role, idx) => (
                                        <tr key={role.id} className={clsx("transition-all", editingRoleIndex === idx ? "bg-blue-50/30" : "")}>
                                            <td className="px-4 py-3">
                                                {editingRoleIndex === idx ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={role.name}
                                                            onChange={(e) => updateRole(idx, { name: e.target.value })}
                                                            placeholder="Role name"
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                                        />
                                                        <textarea
                                                            value={role.keywords.join(', ')}
                                                            onChange={(e) => updateRole(idx, { keywords: e.target.value.split(',').map(s => s.trim()) })}
                                                            placeholder="Keywords (comma separated)"
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="group">
                                                        <div className="font-bold text-gray-900">{role.name || 'Unnamed Role'}</div>
                                                        <div className="text-xs text-gray-400 truncate max-w-xs">{role.keywords.join(', ') || 'No keywords'}</div>
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
                                                        className="w-8 h-8 rounded cursor-pointer disabled:opacity-50"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {editingRoleIndex === idx ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingRoleIndex(null)}
                                                            className="p-1.5 text-blue-600 hover:bg-white rounded shadow-sm transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingRoleIndex(idx)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteRole(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
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
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        {account ? 'Update Account' : 'Save Account'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
