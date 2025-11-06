
"use client"

import * as React from "react"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { getIconByName } from "@/lib/data"
import type { Category } from "@/lib/types"

interface DataTableToolbarProps<TData> {
  table?: Table<TData>
  categories: Category[];
}

export function DataTableToolbar<TData>({
  table,
  categories,
}: DataTableToolbarProps<TData>) {
  if (!table) {
    return null;
  }
  const isFiltered = table.getState().columnFilters.length > 0
  
  const categoryOptions = categories.map(c => {
    const Icon = getIconByName(c.icon);
    return { value: c.name, label: c.name, icon: Icon };
  });

  const statusOptions = [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'paid', label: 'Paid' },
  ]
  

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter dues..."
          value={(table.getColumn("dueName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("dueName")?.setFilterValue(event.target.value)
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
        {table.getColumn("status") && (
            <DataTableFacetedFilter
                column={table.getColumn("status")}
                title="Status"
                options={statusOptions}
            />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
