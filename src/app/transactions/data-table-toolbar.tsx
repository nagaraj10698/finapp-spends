
"use client"

import * as React from "react"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { getIconByName } from "@/lib/data"
import { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, addDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isSameDay } from "date-fns"
import type { Category } from "@/lib/types"

interface DataTableToolbarProps<TData> {
  table?: Table<TData>
  onDelete: (transactionsToDelete: TData[]) => void;
  categories: Category[];
}

const PRESET_RANGES = [
    { label: 'Today', getRange: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Last 7 days', getRange: () => ({ from: addDays(new Date(), -6), to: new Date() }) },
    { label: 'Last 30 days', getRange: () => ({ from: addDays(new Date(), -29), to: new Date() }) },
    { label: 'This Month', getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Last Month', getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }},
    { label: 'This Quarter', getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
    { label: 'This Year', getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    { label: 'All Time', getRange: () => undefined },
];


export function DataTableToolbar<TData>({
  table,
  onDelete,
  categories,
}: DataTableToolbarProps<TData>) {
  if (!table) return null;
  
  const [date, setDate] = React.useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [activePreset, setActivePreset] = React.useState<string | null>('This Month');
  const [isDatePopoverOpen, setDatePopoverOpen] = React.useState(false);


  React.useEffect(() => {
    if (date?.from && date.to) {
        // The dates from the picker are at midnight, so we extend the 'to' date to the end of the day
        const toDate = new Date(date.to);
        toDate.setHours(23, 59, 59, 999);
        table.getColumn('date')?.setFilterValue([date.from, toDate]);
        
        const matchedPreset = PRESET_RANGES.find(p => {
            if (!p.getRange) return false;
            const range = p.getRange();
            return range?.from && range?.to && date.from && date.to && isSameDay(range.from, date.from) && isSameDay(range.to, date.to)
          });
        setActivePreset(matchedPreset ? matchedPreset.label : 'Custom');
    } else {
        table.getColumn('date')?.setFilterValue(undefined);
        if (!date) {
            setActivePreset('All Time');
        }
    }
  }, [date, table]);

  const handlePresetClick = (label: string, getRange?: () => DateRange | undefined) => {
        if (getRange) {
            setDate(getRange());
        } else {
            setDate(undefined);
        }
        setActivePreset(label);
  }

  const isFiltered = table.getState().columnFilters.length > 0
  const categoryOptions = categories.map(c => {
      const Icon = getIconByName(c.icon);
      return { value: c.name, label: c.name, icon: Icon };
  });
  const typeOptions = [{value: 'income', label: 'Credit'}, {value: 'expense', label: 'Debit'}];
  

  const handleDeleteSelected = () => {
    const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(row => row.original);
    onDelete(selectedRowsData);
    table.resetRowSelection();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter transactions..."
          value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("category") && (
          <DataTableFacetedFilter
            column={table.getColumn("category")}
            title="Category"
            options={categoryOptions}
          />
        )}
        {table.getColumn("type") && (
            <DataTableFacetedFilter
                column={table.getColumn("type")}
                title="Type"
                options={typeOptions}
            />
        )}
         <Popover open={isDatePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
            <Button
                id="date"
                variant={"outline"}
                className={cn(
                "w-[260px] justify-start text-left font-normal h-8",
                !date && "text-muted-foreground"
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                date.to ? (
                    <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                    </>
                ) : (
                    format(date.from, "LLL dd, y")
                )
                ) : (
                <span>All Time</span>
                )}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                <div className='flex'>
                    <div className="flex flex-col space-y-1 p-2 border-r">
                        {PRESET_RANGES.map(({label, getRange}) => (
                            <Button 
                                key={label}
                                variant={activePreset === label ? 'default': 'ghost'} 
                                className="justify-start" 
                                onClick={() => handlePresetClick(label, getRange)}
                            >
                                {label}
                            </Button>
                        ))}
                         <Button
                            variant={activePreset === 'Custom' ? 'default': 'ghost'}
                            className="justify-start"
                            onClick={() => handlePresetClick('Custom')}
                        >
                            Custom
                        </Button>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </div>
                 <div className="flex justify-end p-2 border-t">
                    <Button size="sm" onClick={() => setDatePopoverOpen(false)}>Apply</Button>
                </div>
            </PopoverContent>
        </Popover>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
                table.resetColumnFilters()
                setDate(undefined)
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
      )}
    </div>
  )
}
