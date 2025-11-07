
'use client';
import { useEffect, useMemo, useState } from 'react';
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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DhiramSymbol } from '@/components/ui/dhiram-symbol';
import { useFirebase } from '@/firebase';
import type { Due, Category } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { saveDue } from '@/app/actions';
import { Loader2 } from 'lucide-react';


const formSchema = z.object({
  dueName: z.string().min(2, 'Name must be at least 2 characters.'),
  dueAmount: z.coerce.number().positive('Amount must be positive.'),
  categoryId: z.string().min(1, 'Please select a category.'),
  dueDate: z.date({ required_error: 'A date is required.'}),
  isRecurring: z.boolean(),
  frequency: z.enum(['', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrenceEndDate: z.date().optional().nullable(),
}).refine(data => {
    return !data.isRecurring || !!data.frequency;
}, {
    message: "Frequency is required for recurring dues.",
    path: ["frequency"],
});

interface DueFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    due: Due | null;
    categories: Category[];
}

export default function DueFormDialog({ isOpen, onClose, due, categories }: DueFormDialogProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!due;

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        dueName: due?.dueName ?? '',
        dueAmount: due?.dueAmount ?? 0,
        categoryId: due?.categoryId ?? '',
        dueDate: due ? toDate(due.dueDate) : new Date(),
        isRecurring: due?.isRecurring ?? false,
        frequency: due?.frequency ?? '',
        recurrenceEndDate: due?.recurrenceEndDate ? toDate(due.recurrenceEndDate) : null,
      });
    }
  }, [isOpen, due, form]);

  const isRecurring = form.watch('isRecurring');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }
    setIsSubmitting(true);
    try {
        const selectedCategory = categories.find(c => c.id === values.categoryId);
        if (!selectedCategory) {
            throw new Error("Selected category not found.");
        }

        const dueData: Partial<Due> = {
            id: due?.id,
            userId: user.uid, // Ensure userId is always included
            dueName: values.dueName,
            dueAmount: values.dueAmount,
            dueDate: values.dueDate,
            isRecurring: values.isRecurring,
            category: selectedCategory.name,
            categoryId: selectedCategory.id,
            frequency: values.isRecurring ? values.frequency as Due['frequency'] : undefined,
            recurrenceEndDate: values.isRecurring ? values.recurrenceEndDate : undefined,
        };

        await saveDue(user.uid, dueData);
        
        toast({
            title: isEditing ? 'Due Updated' : 'Due Created',
            description: `Your due "${values.dueName}" has been saved.`,
        });
        onClose();
    } catch(e) {
        console.error("Failed to save due:", e);
        toast({ variant: 'destructive', title: 'Save Failed', description: e instanceof Error ? e.message : 'An unknown error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Due' : 'Add New Due'}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of your due." : "Enter the details for a new bill, subscription, or loan."}
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
             <div className="grid grid-cols-2 gap-4">
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
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {expenseCategories.map((cat) => {
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
            </div>
             <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{isRecurring ? 'First Due Date' : 'Due Date'}</FormLabel>
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
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Payment</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Is this a recurring bill or subscription?
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                     <FormField
                        control={form.control}
                        name="recurrenceEndDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>End Date (Optional)</FormLabel>
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
                                    {field.value ? format(field.value, 'PPP') : <span>No end date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}


            <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                    {isEditing ? 'Save Changes' : 'Create Due'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
