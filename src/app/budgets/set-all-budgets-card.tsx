
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useState, useMemo, useEffect } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useFirebase } from '@/firebase';
import type { Budget, Category } from '@/lib/types';
import { createBudgets } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  budgets: z.record(z.coerce.number().min(0, 'Must be positive').optional()),
});

interface SetAllBudgetsCardProps {
  categories: Category[];
}

export default function SetAllBudgetsCard({ categories }: SetAllBudgetsCardProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo(() => {
      const budgetMap: Record<string, number> = {};
      categories.forEach(cat => {
          budgetMap[cat.id] = 500;
      });
      return { budgets: budgetMap };
  }, [categories]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [categories, defaultValues, form]);


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
        form.reset(); // Reset form after successful submission
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
    <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Set New Budgets</CardTitle>
          <CardDescription>
            Quickly set a budget for your unbudgeted expense categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            {categories.length > 0 ? (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
                    <ScrollArea className='flex-grow pr-4 -mr-4'>
                        <div className='space-y-4'>
                        {categories.map((cat) => {
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
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className='animate-spin mr-2'/>}
                            Save Budgets
                        </Button>
                    </div>
                </form>
                </Form>
            ) : (
                <div className='py-8 text-center text-muted-foreground h-full flex items-center justify-center'>
                    All your expense categories already have a budget!
                </div>
            )}
        </CardContent>
    </Card>
  );
}
    