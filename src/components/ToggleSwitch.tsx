'use client';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
    icon?: string;
}

export default function ToggleSwitch({ label, checked, onChange, ariaLabel, icon }: ToggleSwitchProps) {
    return (
        <label className="mb-0 flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-bold text-purple-600">{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                    aria-label={ariaLabel}
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out flex items-center ${checked ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ml-0.5 ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                </div>
            </div>
            {icon && (
                <span className="text-xs text-gray-500">
                    {icon}
                </span>
            )}
        </label>
    );
}