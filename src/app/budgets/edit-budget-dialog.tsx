
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
import { getIconByName } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { CurrencySymbol } from '@/components/ui/dynamic-currency';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Budget, Category } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { useCurrency } from '@/components/providers/currency-provider';


const formSchema = z.object({
  budgetAmount: z.coerce.number().min(0, 'Amount must be non-negative.'),
});

interface EditBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget;
}

export default function EditBudgetDialog({ isOpen, onClose, budget }: EditBudgetDialogProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { currency } = useCurrency();

  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories } = useCollection<Category>(categoriesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budgetAmount: budget.budgetAmount,
    },
  });
  
  useEffect(() => {
    form.reset({
      budgetAmount: budget.budgetAmount,
    });
  }, [budget, form]);

  const category = categories?.find(c => c.id === budget.categoryId);
  const Icon = category ? getIconByName(category.icon) : null;


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user ) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to update a budget."
        });
        return;
    }
    
    const budgetRef = doc(firestore, 'users', user.uid, 'budgets', budget.id);
    
    try {
        await updateDoc(budgetRef, {
            budgetAmount: values.budgetAmount
        });

        toast({
        title: 'Budget Updated',
        description: `Your budget for ${budget.name} has been changed.`,
        });
        onClose();
    } catch (error) {
        console.error("Error updating budget:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the budget.",
        });
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Adjust the monthly budget for <span className='font-semibold'>{budget.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            <div className="flex items-center gap-2 p-4 rounded-md bg-muted">
                {Icon && <Icon className={cn("h-6 w-6", category?.color)} />}
                <span className="text-lg font-semibold">{budget.name}</span>
            </div>
            <FormField
              control={form.control}
              name="budgetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                        <div className="relative">
                            <CurrencySymbol className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={field.value}
                                onChange={field.onChange}
                                className="pl-12 text-lg font-bold" 
                            />
                        </div>
                         <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={5000}
                            step={50}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{currency.code} 0</span>
                            <span>{currency.code} 5,000</span>
                        </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
