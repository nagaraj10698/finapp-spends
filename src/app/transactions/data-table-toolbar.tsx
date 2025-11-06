
"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { getIconByName } from "@/lib/data"
import { DateRange } from "react-day-picker"
import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Category } from "@/lib/types"

interface DataTableToolbarProps<TData> {
  table?: Table<TData>
  onDelete: (transactionsToDelete: TData[]) => void;
  categories: Category[];
}

export function DataTableToolbar<TData>({
  table,
  onDelete,
  categories,
}: DataTableToolbarProps<TData>) {
  if (!table) return null;
  
  const [date, setDate] = React.useState<DateRange | undefined>();

  React.useEffect(() => {
    if (date?.from && date?.to) {
        // The dates from the picker are at midnight, so we extend the 'to' date to the end of the day
        const toDate = new Date(date.to);
        toDate.setHours(23, 59, 59, 999);
        table.getColumn('date')?.setFilterValue([date.from, toDate]);
    } else {
        table.getColumn('date')?.setFilterValue(undefined);
    }
  }, [date, table]);

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
         <Popover>
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
                <span>Pick a date range</span>
                )}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
            />
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
