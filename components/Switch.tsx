import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SwitchProps {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
    label,
    checked,
    onChange,
    className,
}) => {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <HeadlessSwitch
                checked={checked}
                onChange={onChange}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                    checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
                )}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-100 shadow ring-0 transition duration-200 ease-in-out',
                        checked ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </HeadlessSwitch>
            {label && (
                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{label}</span>
            )}
        </div>
    );
};
