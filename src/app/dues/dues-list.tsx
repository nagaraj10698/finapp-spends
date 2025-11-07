
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Due, Category } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getIconByName, toDate } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';

interface DuesListProps {
    dues: Due[];
    categories: Category[];
    onEdit: (due: Due) => void;
    onDelete: (due: Due) => void;
}

export default function DuesList({ dues, categories, onEdit, onDelete }: DuesListProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Your Dues</CardTitle>
            <CardDescription>A list of all your upcoming and past dues.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                {dues.map((due) => {
                const category = categories.find(c => c.id === due.categoryId);
                const Icon = category ? getIconByName(category.icon) : null;
                const dueDate = toDate(due.dueDate);
                return (
                    <div key={due.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="grid grid-cols-4 md:grid-cols-6 items-center gap-4 flex-grow">
                        <div className="col-span-2 flex items-center gap-3">
                            {category && Icon && <Icon className={cn('h-6 w-6 hidden sm:block', category.color)} />}
                            <div className="flex flex-col">
                                <span className="font-semibold">{due.dueName}</span>
                                <span className="text-sm text-muted-foreground">{category?.name}</span>
                            </div>
                        </div>
                        <div className="text-muted-foreground flex items-baseline gap-1 font-semibold">
                            <DhiramSymbol />
                            {due.dueAmount.toFixed(2)}
                        </div>
                        <div>
                             <Badge variant={due.isRecurring ? 'default' : 'secondary'}>{due.isRecurring ? `Recurring` : 'One-time'}</Badge>
                        </div>
                        <div className="hidden md:block">
                           {due.isRecurring && due.frequency && (
                                <span className="text-sm capitalize text-muted-foreground">{due.frequency}</span>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <span className="text-sm text-muted-foreground">
                                {due.isRecurring ? 'Starts' : 'Due on'} {format(dueDate, 'do MMM, yyyy')}
                            </span>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(due)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(due)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                );
                })}
            </div>
        </CardContent>
    </Card>
  );
}
