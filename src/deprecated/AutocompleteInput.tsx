import * as React from 'react';
import { Input } from '../components/ui/input';
import { cn } from "@/lib/utils";

/**
 * @deprecated This component allows browser native autocomplete
 * Please use the updated AutocompleteInput component in src/components/AutocompleteInput.tsx
 * which has the autoComplete="off" attribute to prevent browser native autocomplete
 */
interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: string[];
  onSuggestionSelected?: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
}

export function AutocompleteInput({ 
  suggestions: rawSuggestions, 
  onSuggestionSelected, 
  className,
  ...props 
}: AutocompleteInputProps) {
  // Remove duplicates and empty/null values from suggestions
  const suggestions = React.useMemo(() => {
    return Array.from(new Set(rawSuggestions.filter(Boolean))).sort();
  }, [rawSuggestions]);

  const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [input, setInput] = React.useState(props.value?.toString() || '');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Update input when value prop changes
  React.useEffect(() => {
    setInput(props.value?.toString() || '');
  }, [props.value]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filterSuggestions = React.useCallback((userInput: string) => {
    const normalizedInput = userInput.toLowerCase().trim();
    
    if (!normalizedInput) {
      return suggestions.slice(0, 10); // Show first 10 suggestions when input is empty
    }

    return suggestions
      .filter(suggestion => 
        suggestion?.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(suggestion?.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 suggestions for better UX
  }, [suggestions]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    setInput(userInput);
    
    const filtered = filterSuggestions(userInput);
    setFilteredSuggestions(filtered);
    setShowSuggestions(true);

    if (props.onChange) {
      props.onChange(e);
    }
  };

  const onClick = (suggestion: string) => {
    setInput(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    
    const syntheticEvent = {
      target: { value: suggestion }
    } as React.ChangeEvent<HTMLInputElement>;
    
    if (props.onChange) {
      props.onChange(syntheticEvent);
    }
    
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        {...props}
        value={input}
        onChange={onChange}
        onFocus={() => {
          setShowSuggestions(true);
          if (input) {
            const filtered = filterSuggestions(input);
            setFilteredSuggestions(filtered);
          }
        }}
        className={cn("w-full", className)}
        // This component allows browser native autocomplete
        // Missing autoComplete="off" which would prevent it
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => onClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 