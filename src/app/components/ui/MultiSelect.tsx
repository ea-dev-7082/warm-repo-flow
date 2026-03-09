import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    themeColor?: "blue" | "green";
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Selecionar...",
    disabled = false,
    themeColor = "blue"
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const colors = {
        blue: {
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            activeBg: "bg-blue-600",
            activeText: "text-white",
            hoverBg: "hover:bg-blue-50"
        },
        green: {
            bg: "bg-green-50",
            text: "text-green-700",
            border: "border-green-200",
            activeBg: "bg-green-600",
            activeText: "text-white",
            hoverBg: "hover:bg-green-50"
        }
    };

    const currentTheme = colors[themeColor];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const removeOption = (e: React.MouseEvent, option: string) => {
        e.stopPropagation();
        onChange(selected.filter(item => item !== option));
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`min-h-[38px] w-full px-2 py-1 border border-gray-300 rounded text-xs flex flex-wrap gap-1 items-center cursor-pointer transition-all focus:ring-1 focus:ring-blue-500 ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white hover:border-gray-400"
                    }`}
            >
                {selected.length === 0 ? (
                    <span className="text-gray-400 ml-1">{placeholder}</span>
                ) : (
                    selected.map(item => (
                        <span
                            key={item}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} font-medium`}
                        >
                            {item}
                            {!disabled && (
                                <X
                                    size={10}
                                    className="hover:text-red-500 cursor-pointer"
                                    onClick={(e) => removeOption(e, item)}
                                />
                            )}
                        </span>
                    ))
                )}
                <div className="flex-grow"></div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto flex-grow py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const isSelected = selected.includes(option);
                                return (
                                    <div
                                        key={option}
                                        onClick={() => toggleOption(option)}
                                        className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${isSelected ? `${currentTheme.activeBg} ${currentTheme.activeText}` : currentTheme.hoverBg
                                            }`}
                                    >
                                        <span>{option}</span>
                                        {isSelected && <Check size={12} />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-3 py-4 text-xs text-gray-400 text-center">Nenhum item encontrado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
