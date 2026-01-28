import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { PreviewEditor } from './PreviewEditor';
import { Setting, GroupDefaults } from '../entrypoints/options/types';

interface AddGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, defaults: GroupDefaults) => void;
    group?: Setting;
    defaultColors: string[];
}

const DEFAULT_DEFAULTS: GroupDefaults = {
    envName: 'dev',
    backgroundEnable: false,
    flagEnable: false,
    color: '#4a9eff',
};

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
    isOpen,
    onClose,
    onSave,
    group,
    defaultColors,
}) => {
    const [name, setName] = useState('');
    const [defaults, setDefaults] = useState<GroupDefaults>(DEFAULT_DEFAULTS);

    useEffect(() => {
        if (group) {
            setName(group.name);
            setDefaults(group.defaults || DEFAULT_DEFAULTS);
        } else {
            setName('');
            setDefaults({
                ...DEFAULT_DEFAULTS,
                color: defaultColors[0] || '#4a9eff'
            });
        }
    }, [group, isOpen, defaultColors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), defaults);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={group ? 'Edit Configuration Group' : 'Add New Configuration Group'}
            width="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="form-group font-bold">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Group Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Development Environment"
                        />
                    </div>

                    <div className="relative pt-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-100 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-slate-900 px-3 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Default Settings</span>
                        </div>
                    </div>

                    <PreviewEditor
                        config={defaults}
                        onChange={(updates) => setDefaults({ ...defaults, ...updates } as GroupDefaults)}
                        defaultColors={defaultColors}
                    />
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
                        {group ? 'Update Group' : 'Create Group'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
