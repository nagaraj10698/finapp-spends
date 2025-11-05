
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ReactNode, useState, useEffect } from 'react';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { Switch } from '@/components/ui/switch';
import { useFirebase, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction, Category } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const formSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    description: z.string().min(2, 'Description must be at least 2 characters.'),
    amount: z.coerce.number().positive('Amount must be positive.'),
    category: z.string().min(1, 'Please select a category.'),
    date: z.date(),
    isRecurring: z.boolean(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.frequency) {
        return false;
      }
      return true;
    },
    {
      message: 'Please select a frequency for recurring transactions.',
      path: ['frequency'],
    }
  );

export default function AddTransactionDialog({children}: {children: ReactNode}) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);

  const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
      isRecurring: false,
    },
  });
  
  const transactionType = form.watch('type');
  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    form.resetField('category', { defaultValue: '' });
  }, [transactionType, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to add a transaction."
        });
        return;
    }
    
    const transactionCollection = collection(firestore, 'users', user.uid, 'transactions');
    
    const amount = values.type === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount);

    const newTransaction: Omit<Transaction, 'id'> = {
        description: values.description,
        amount: amount,
        category: values.category,
        date: values.date,
        isRecurring: values.isRecurring,
        frequency: values.isRecurring ? values.frequency : undefined,
        type: values.type
    };

    await addDocumentNonBlocking(transactionCollection, newTransaction);

    toast({
      title: 'Transaction Added',
      description: (
        <span>
          {values.description} for <DhiramSymbol />
          {values.amount} has been added.
        </span>
      ),
    });
    form.reset();
    setOpen(false);
  }
  
  const availableCategories = categories?.filter(c => c.type === transactionType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your transaction. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Expense</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Income</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coffee with a friend" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DhiramSymbol className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" placeholder="0.00" {...field} className="pl-8" />
                    </div>
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
                      <SelectTrigger disabled={categoriesLoading || !availableCategories}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories?.map((cat) => {
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <FormLabel>Recurring Transaction</FormLabel>
                     <p className="text-xs text-muted-foreground">
                      Is this a recurring transaction?
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
            <DialogFooter>
              <Button type="submit">Save Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
