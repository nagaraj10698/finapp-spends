
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getIconByName, toDate } from '@/lib/data';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { CurrencySymbol } from '@/components/ui/dynamic-currency';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteField } from 'firebase/firestore';
import type { Transaction, Category } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';


const formSchema = z.object({
    type: z.enum(['income', 'expense']),
    description: z.string().min(2, 'Description must be at least 2 characters.'),
    amount: z.coerce.number().positive('Amount must be positive.'),
    category: z.string().min(1, 'Please select a category.'),
    date: z.date(),
    isRecurring: z.boolean().default(false),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    recurrenceEndDate: z.date().optional(),
}).refine(data => {
    return !data.isRecurring || !!data.frequency;
}, {
    message: 'Frequency is required for recurring transactions.',
    path: ['frequency'],
});
  
interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export default function EditTransactionDialog({ isOpen, onClose, transaction }: EditTransactionDialogProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const isMobile = useIsMobile();

  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const transactionType = form.watch('type');
  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        category: transaction.category,
        date: toDate(transaction.date),
        isRecurring: transaction.isRecurring ?? false,
        frequency: transaction.frequency,
        recurrenceEndDate: transaction.recurrenceEndDate ? toDate(transaction.recurrenceEndDate) : undefined,
      });
    }
  }, [transaction, form]);

  useEffect(() => {
    // When type changes, we should reset the category if it's not a new transaction load
    if (transaction.type !== transactionType) {
        form.resetField('category', { defaultValue: '' });
    }
  }, [transactionType, form, transaction.type]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user ) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to edit a transaction."
        });
        return;
    }
    setIsSubmitting(true);
    
    try {
        const transactionRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
        
        const amount = values.type === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount);
        const selectedCategory = categories?.find(c => c.name === values.category);

        const updatedTransaction: Partial<Omit<Transaction, 'id'>> & { [key: string]: any } = {
            description: values.description,
            amount: amount,
            category: values.category,
            categoryId: selectedCategory?.id || null,
            date: values.date,
            type: values.type,
            isRecurring: values.isRecurring,
        };
        
        if (values.isRecurring) {
            updatedTransaction.frequency = values.frequency;
            updatedTransaction.recurrenceEndDate = values.recurrenceEndDate || deleteField();
        } else {
            updatedTransaction.isRecurring = deleteField();
            updatedTransaction.frequency = deleteField();
            updatedTransaction.recurrenceEndDate = deleteField();
        }
        
        await updateDoc(transactionRef, updatedTransaction);

        toast({
          title: 'Transaction Updated',
          description: "Your transaction has been successfully updated.",
        });
        onClose();
    } catch (error) {
        console.error("Error updating transaction:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update transaction. Please try again."
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const availableCategories = categories?.filter(c => c.type === transactionType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details of your transaction.
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
                      value={field.value}
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
                      <CurrencySymbol className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" placeholder="0.00" {...field} className="pl-12" />
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
                   {isMobile ? (
                    <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => field.onChange(parseISO(e.target.value))}
                        className="w-full"
                    />
                  ) : (
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                            )}
                            >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={(date) => {
                              if (!date) return;
                              field.onChange(date);
                              setDatePickerOpen(false);
                            }} 
                            initialFocus 
                          />
                        </PopoverContent>
                    </Popover>
                   )}
                  <FormMessage />
                </FormItem>
              )}
            />
             {transactionType === 'expense' && (
                <>
                <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Recurring Expense</FormLabel>
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
                    <div className="space-y-4 rounded-md border p-4">
                        <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
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
                        <FormField
                            control={form.control}
                            name="recurrenceEndDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>End Date</FormLabel>
                                {isMobile ? (
                                    <Input
                                        type="date"
                                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseISO(e.target.value) : undefined)}
                                        className="w-full"
                                    />
                                ) : (
                                <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                        )}
                                        >
                                        {field.value ? format(field.value, 'PPP') : <span>Pick an end date (Optional)</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar 
                                        mode="single" 
                                        selected={field.value} 
                                        onSelect={(date) => {
                                          if (!date) return;
                                          field.onChange(date);
                                          setEndDatePickerOpen(false);
                                        }} 
                                        initialFocus 
                                      />
                                    </PopoverContent>
                                </Popover>
                                )}
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                )}
                </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
