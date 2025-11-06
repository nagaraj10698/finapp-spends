
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getIconByName } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ReactNode, useState } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { Switch } from '@/components/ui/switch';
import { useFirebase, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Budget, Category } from '@/lib/types';
import { format } from 'date-fns';


const formSchema = z.object({
  name: z.string().min(1, 'Budget name is required.'),
  budgetAmount: z.coerce.number().positive('Amount must be positive.'),
  category: z.string().min(1, 'Please select a category.'),
  budgetStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start date is required.",
  }),
  budgetEndDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End date is required.",
  }),
  isRecurring: z.boolean(),
  type: z.enum(['Bills', 'Subscription', 'Expense'], { required_error: 'Please select a type.' }),
});

export default function AddBudgetDialog({children}: {children: ReactNode}) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);

  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      budgetAmount: 0,
      category: '',
      budgetStartDate: format(new Date(), 'yyyy-MM-dd'),
      budgetEndDate: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
      type: 'Expense',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to add a budget."
        });
        return;
    }
    
    const selectedCategory = categories?.find(c => c.name === values.category);

    const budgetCollection = collection(firestore, 'users', user.uid, 'budgets');
    const newBudget: Omit<Budget, 'id'> = {
        name: values.name,
        budgetAmount: values.budgetAmount,
        budgetStartDate: new Date(values.budgetStartDate),
        budgetEndDate: new Date(values.budgetEndDate),
        isRecurring: values.isRecurring,
        type: values.type,
        categoryId: selectedCategory?.id,
        category: values.category,
    };

    await addDocumentNonBlocking(budgetCollection, newBudget);
    
    toast({
      title: 'Budget Added',
      description: (
        <span className="flex items-center gap-1">
          A budget for {values.name} of <DhiramSymbol />
          {values.budgetAmount} has been set.
        </span>
      ),
    });
    form.reset();
    setOpen(false);
  }

  const expenseCategories = categories?.filter(c => c.type === 'expense');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Budget</DialogTitle>
          <DialogDescription>
            Set a planned expense for forecasting.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Netflix Subscription" {...field} />
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
              name="budgetAmount"
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
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="budgetStartDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                     <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="budgetEndDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                     <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a budget type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bills">Bills</SelectItem>
                      <SelectItem value="Subscription">Subscription</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Recurring Budget</FormLabel>
                     <p className="text-xs text-muted-foreground">
                      Is this a recurring budget?
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
            <DialogFooter>
              <Button type="submit">Save Budget</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
