
'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Due, Category } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIconByName, toDate } from '@/lib/data';
import { updateDue } from '../actions';


const formSchema = z
  .object({
    dueName: z.string().min(1, 'Due name is required.'),
    dueAmount: z.coerce.number().positive('Amount must be positive.'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Start date is required." }),
    category: z.string().min(1, 'Please select a category.'),
    isRecurring: z.boolean(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    recurrenceEndDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.frequency) {
        return false;
      }
      return true;
    },
    {
      message: 'Please select a frequency for recurring dues.',
      path: ['frequency'],
    }
  )
  .refine(data => !data.isRecurring || !data.recurrenceEndDate || new Date(data.recurrenceEndDate) > new Date(data.dueDate), {
    message: "End date must be after the start date.",
    path: ["recurrenceEndDate"],
  });


interface EditDueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  due: Due;
}

export default function EditDueDialog({isOpen, onClose, due}: EditDueDialogProps) {
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (due) {
        form.reset({
            dueName: due.dueName,
            dueAmount: due.dueAmount,
            dueDate: format(toDate(due.dueDate), 'yyyy-MM-dd'),
            category: due.category,
            isRecurring: due.isRecurring,
            frequency: due.frequency,
            recurrenceEndDate: due.recurrenceEndDate ? format(toDate(due.recurrenceEndDate), 'yyyy-MM-dd') : null,
        });
    }
  }, [due, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !due) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to edit a due.',
      });
      return;
    }

    const selectedCategory = categories?.find(c => c.name === values.category);

    const dataToUpdate: Partial<Due> = {
      dueName: values.dueName,
      dueAmount: values.dueAmount,
      dueDate: new Date(values.dueDate),
      category: values.category,
      categoryId: selectedCategory?.id || null,
      isRecurring: values.isRecurring,
      frequency: values.frequency,
      recurrenceEndDate: values.recurrenceEndDate ? new Date(values.recurrenceEndDate) : null,
    };
    
    try {
      await updateDue(user.uid, due.id, dataToUpdate);
      toast({
        title: 'Due Updated',
        description: `The due "${values.dueName}" has been updated.`,
      });
      onClose();
    } catch (error) {
      console.error('Error updating due:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while updating the due.',
      });
    }
  }


  const expenseCategories = categories?.filter(c => c.type === 'expense');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Due</DialogTitle>
          <DialogDescription>
            Update the details of your due.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="dueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Netflix Subscription" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger disabled={categoriesLoading}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories?.map((cat) => {
                        const Icon = getIconByName(cat.icon);
                        return (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn('h-4 w-4', cat.color)} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DhiramSymbol className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" placeholder="0.00" {...field} className="pl-12" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Due</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{isRecurring ? 'First Due Date' : 'Due Date'}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isRecurring && (
               <FormField
                control={form.control}
                name="recurrenceEndDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                     <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
