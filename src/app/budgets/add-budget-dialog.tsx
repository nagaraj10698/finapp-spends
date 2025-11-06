
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
import { ReactNode, useState, useEffect } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useFirebase, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Budget, Category } from '@/lib/types';
import { startOfMonth, endOfMonth } from 'date-fns';


const formSchema = z.object({
  budgetAmount: z.coerce.number().positive('Amount must be positive.'),
  categoryId: z.string().min(1, 'Please select a category.'),
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
      budgetAmount: 0,
      categoryId: '',
    },
  });

  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    if (selectedCategory) {
      form.setValue('name', selectedCategory.name);
    }
  }, [selectedCategory, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user || !selectedCategory) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in and select a category to add a budget."
        });
        return;
    }
    
    const budgetCollection = collection(firestore, 'users', user.uid, 'budgets');
    
    const newBudget: Omit<Budget, 'id'> = {
        name: selectedCategory.name,
        budgetAmount: values.budgetAmount,
        budgetStartDate: startOfMonth(new Date()),
        budgetEndDate: endOfMonth(new Date()),
        isRecurring: false, // Simplified to monthly, not recurring in this context
        type: 'Expense', // All user-set budgets are for expenses
        categoryId: values.categoryId,
        category: selectedCategory.name,
    };

    await addDocumentNonBlocking(budgetCollection, newBudget);
    
    toast({
      title: 'Budget Added',
      description: (
        <span className="flex items-center gap-1">
          A budget for {selectedCategory.name} of <DhiramSymbol />
          {values.budgetAmount} has been set for this month.
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
            Set a monthly budget for an expense category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="categoryId"
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
                          <SelectItem key={cat.id} value={cat.id}>
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
                  <FormLabel>Budget Amount</FormLabel>
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
            <DialogFooter>
              <Button type="submit">Save Budget</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
