
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
import { useState, useEffect, useMemo } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useFirebase } from '@/firebase';
import type { Budget, Category } from '@/lib/types';
import { createBudgets } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  budgets: z.record(z.coerce.number().min(0, 'Must be positive').optional()),
});

interface SetAllBudgetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  budgets: Budget[];
}

export default function SetAllBudgetsDialog({ isOpen, onClose, categories, budgets }: SetAllBudgetsDialogProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unbudgetedCategories = useMemo(() => {
    const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
    return categories.filter(c => c.type === 'expense' && !budgetedCategoryIds.has(c.id));
  }, [categories, budgets]);

  const defaultValues = useMemo(() => {
      const budgetMap: Record<string, number> = {};
      unbudgetedCategories.forEach(cat => {
          budgetMap[cat.id] = 500;
      });
      return { budgets: budgetMap };
  }, [unbudgetedCategories]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [isOpen, defaultValues, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }
    
    setIsSubmitting(true);
    
    const budgetsToCreate = Object.entries(values.budgets)
        .filter(([_, amount]) => amount !== undefined && amount > 0)
        .map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            return {
                categoryId,
                name: category!.name,
                amount: amount!,
            };
        });
        
    if (budgetsToCreate.length === 0) {
        toast({
            variant: 'default',
            title: 'No Budgets to Create',
            description: 'Please set an amount for at least one category.'
        });
        setIsSubmitting(false);
        return;
    }

    try {
        await createBudgets(user.uid, budgetsToCreate);
        toast({
            title: 'Budgets Created',
            description: `${budgetsToCreate.length} new budget(s) have been set.`
        });
        onClose();
    } catch(e) {
        console.error("Failed to create budgets:", e);
        toast({
            variant: 'destructive',
            title: 'Failed to create budgets'
        });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set All Budgets</DialogTitle>
          <DialogDescription>
            Quickly set a budget for all your unbudgeted expense categories.
          </DialogDescription>
        </DialogHeader>
        {unbudgetedCategories.length > 0 ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <ScrollArea className='h-72 pr-4'>
                    <div className='space-y-4'>
                    {unbudgetedCategories.map((cat) => {
                        const Icon = getIconByName(cat.icon);
                        return (
                        <FormField
                            key={cat.id}
                            control={form.control}
                            name={`budgets.${cat.id}`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className='sr-only'>{cat.name}</FormLabel>
                                <div className='flex items-center gap-4'>
                                    <div className='flex items-center gap-2 w-40'>
                                        <Icon className={cn('h-5 w-5', cat.color)} />
                                        <span>{cat.name}</span>
                                    </div>
                                    <FormControl>
                                        <div className="relative flex-1">
                                            <DhiramSymbol className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input 
                                                type="number" 
                                                placeholder="500.00" 
                                                {...field}
                                                className="pl-12 font-medium"
                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        )
                    })}
                    </div>
                </ScrollArea>
                <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className='animate-spin mr-2'/>}
                    Save Budgets
                </Button>
                </DialogFooter>
            </form>
            </Form>
        ) : (
            <div className='py-8 text-center text-muted-foreground'>
                All your expense categories already have a budget!
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
