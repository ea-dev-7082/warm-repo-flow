import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    direction?: "up" | "down";
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Selecionar...",
    disabled = false,
    direction = "up",
    onKeyDown
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.key === "Enter") {
            if (!isOpen) {
                setIsOpen(true);
                e.preventDefault();
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }

        if (onKeyDown) onKeyDown(e);
    };

    return (
        <div 
            className="relative w-full outline-none" 
            ref={containerRef}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
        >
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`min-h-[30px] w-full px-2 py-1 border border-gray-300 rounded text-[10px] flex items-center justify-between cursor-pointer transition-all focus:ring-1 focus:ring-blue-500 ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white hover:border-gray-400"
                    } ${isOpen ? "ring-1 ring-blue-500 border-blue-500" : ""}`}
            >
                <span className={`truncate ${!value ? "text-gray-400" : "text-gray-900"}`}>
                    {value || placeholder}
                </span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && !disabled && (
                <div className={`absolute z-[110] w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col ${
                    direction === "up" ? "bottom-full mb-1" : "mt-1"
                }`}>
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (filteredOptions.length > 0) {
                                            handleSelect(filteredOptions[0]);
                                        } else {
                                            setIsOpen(false);
                                        }
                                        e.stopPropagation(); // Prevent bubbling to the container's handleKeyDown or global listener
                                    }
                                    e.stopPropagation();
                                }}
                                className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-grow py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const isSelected = value === option;
                                return (
                                    <div
                                        key={option}
                                        onClick={() => handleSelect(option)}
                                        className={`px-3 py-1.5 text-[10px] cursor-pointer flex items-center justify-between transition-colors ${isSelected ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                                            }`}
                                    >
                                        <span className="truncate">{option}</span>
                                        {isSelected && <Check size={10} />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-3 py-4 text-[10px] text-gray-400 text-center">Nenhum resultado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
