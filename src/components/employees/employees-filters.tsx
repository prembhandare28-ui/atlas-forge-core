import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiFilterOption {
  value: string;
  label: string;
  hint?: string;
}

interface MultiFilterProps {
  label: string;
  options: MultiFilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
}

export function MultiFilter({ label, options, value, onChange }: MultiFilterProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          {label}
          {value.length > 0 ? (
            <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
              {value.length}
            </Badge>
          ) : null}
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Filter ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No options</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const active = value.includes(opt.value);
                return (
                  <CommandItem key={opt.value} onSelect={() => toggle(opt.value)}>
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        active ? "bg-primary text-primary-foreground border-primary" : "opacity-50",
                      )}
                    >
                      {active ? <Check className="h-3 w-3" /> : null}
                    </div>
                    <span className="truncate">{opt.label}</span>
                    {opt.hint ? (
                      <span className="ml-auto text-xs text-muted-foreground">{opt.hint}</span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 ? (
              <div className="border-t p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={() => onChange([])}
                >
                  <X className="mr-2 h-3 w-3" /> Clear
                </Button>
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}