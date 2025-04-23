"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onCreateNew?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyPlaceholder = "No options found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const handleCreateNew = () => {
    if (onCreateNew && searchValue) {
      onCreateNew(searchValue)
      setOpen(false)
      setSearchValue("")
    }
  }

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between", className)}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {value && selectedOption
          ? selectedOption.label
          : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background p-0 shadow-md">
          <div className="relative">
            <input
              className="flex h-10 w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <ul className="max-h-60 overflow-auto p-1">
            {options.length === 0 || (searchValue && !options.some(option =>
              option.label.toLowerCase().includes(searchValue.toLowerCase())
            )) ? (
              <li className="py-2 px-1">
                <p className="text-sm text-muted-foreground mb-2">{emptyPlaceholder}</p>
                {onCreateNew && searchValue && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center"
                    onClick={handleCreateNew}
                    type="button"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{searchValue}"
                  </Button>
                )}
              </li>
            ) : (
              options
                .filter(option =>
                  option.label.toLowerCase().includes(searchValue.toLowerCase())
                )
                .map((option) => (
                  <li
                    key={option.value}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === option.value ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </li>
                ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}