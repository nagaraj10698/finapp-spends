
'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ReactNode, useState } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Due, Category } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIconByName } from '@/lib/data';
import { saveDue } from '../actions';

const formSchema = z
  .object({
    dueName: z.string().min(1, 'Due name is required.'),
    dueAmount: z.coerce.number().positive('Amount must be positive.'),
    dueDate: z.string().refine((val) => val, { message: "Start date is required." }),
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


export default function AddDueDialog({children}: {children: ReactNode}) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);

  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dueName: '',
      dueAmount: 0,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
      category: '',
      recurrenceEndDate: null,
    },
  });

  const isRecurring = form.watch('isRecurring');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to add a due."
        });
        return;
    }
    
    const selectedCategory = categories?.find(c => c.name === values.category);

    const dueData: Partial<Due> = {
        dueName: values.dueName,
        dueAmount: values.dueAmount,
        dueDate: new Date(values.dueDate),
        isPaid: false,
        isRecurring: values.isRecurring,
        category: values.category,
        categoryId: selectedCategory?.id || null,
        frequency: values.frequency,
        recurrenceEndDate: values.recurrenceEndDate ? new Date(values.recurrenceEndDate) : null,
    };
    
    try {
        await saveDue(user.uid, dueData);
        toast({
          title: 'Due Added',
          description: `A due for ${values.dueName} has been set.`,
        });
        form.reset();
        setOpen(false);
    } catch (error) {
        console.error("Error saving due:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save due. Please try again."
        });
    }
  }

  const expenseCategories = categories?.filter(c => c.type === 'expense');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Due</DialogTitle>
          <DialogDescription>
            Set up a due for an upcoming bill or subscription.
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
                    defaultValue={field.value}
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
                     <p className="text-xs text-muted-foreground">
                      Is this a recurring payment?
                    </p>
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
                      defaultValue={field.value}
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
              <Button type="submit">Save Due</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
