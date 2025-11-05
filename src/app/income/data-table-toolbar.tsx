
"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table?: Table<TData>
  onDelete: (transactionsToDelete: TData[]) => void;
}

export function DataTableToolbar<TData>({
  table,
  onDelete
}: DataTableToolbarProps<TData>) {
  if (!table) return null;
  
  const isFiltered = table.getState().columnFilters.length > 0
  const statusOptions = [{ value: 'Received', label: 'Received' }, { value: 'Pending', label: 'Pending' }];
  
  const handleDeleteSelected = () => {
    const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(row => row.original);
    onDelete(selectedRowsData);
    table.resetRowSelection();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter income..."
          value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
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
       {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
      )}
    </div>
  )
}
