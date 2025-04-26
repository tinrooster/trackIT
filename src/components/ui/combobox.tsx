"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  label: string
  value: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  allowCustomValue?: boolean
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyText = "No options found.",
  allowCustomValue = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Reset input value when options or value changes
  React.useEffect(() => {
    const option = options.find(opt => opt.value === value)
    setInputValue(option?.label ?? value ?? "")
  }, [value, options])

  const filteredOptions = React.useMemo(() => {
    const search = inputValue.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(search)
    )
  }, [options, inputValue])

  const handleSelect = React.useCallback((selectedValue: string) => {
    const option = options.find(opt => opt.value === selectedValue || opt.label === selectedValue)
    if (option) {
      onChange(option.value)
    } else if (allowCustomValue) {
      onChange(selectedValue)
    }
    setOpen(false)
  }, [options, onChange, allowCustomValue])

  const handleInputChange = React.useCallback((input: string) => {
    setInputValue(input)
  }, [])

  const displayValue = React.useMemo(() => {
    const option = options.find(opt => opt.value === value)
    return option?.label ?? value ?? ""
  }, [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandEmpty>
            {allowCustomValue ? (
              <CommandItem
                value={inputValue}
                onSelect={() => handleSelect(inputValue)}
                className="cursor-pointer"
              >
                Add "{inputValue}"
              </CommandItem>
            ) : (
              emptyText
            )}
          </CommandEmpty>
          <CommandGroup>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}