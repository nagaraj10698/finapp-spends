
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ICONS } from '@/lib/data';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';


const iconNames = Object.keys(ICONS);
const colorClasses = [
    "text-slate-500", "text-gray-500", "text-zinc-500", "text-neutral-500", "text-stone-500",
    "text-red-500", "text-orange-500", "text-amber-500", "text-yellow-500", "text-lime-500",
    "text-green-500", "text-emerald-500", "text-teal-500", "text-cyan-500", "text-sky-500",
    "text-blue-500", "text-indigo-500", "text-violet-500", "text-purple-500", "text-fuchsia-500",
    "text-pink-500", "text-rose-500"
];


const formSchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  type: z.enum(['expense', 'income'], { required_error: 'Please select a type.' }),
  icon: z.string().min(1, 'Please select an icon.'),
  color: z.string().min(1, 'Please select a color.'),
});

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCategoryDialog({ isOpen, onClose }: AddCategoryDialogProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', type: 'expense', icon: 'Shapes', color: 'text-slate-500' },
  });
  
  const selectedIcon = form.watch('icon');
  const SelectedIcon = ICONS[selectedIcon];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const newCategory: Omit<Category, 'id'> = {
        name: values.name,
        type: values.type,
        icon: values.icon,
        color: values.color,
    };
    const categoriesCollection = collection(firestore, 'users', user.uid, 'categories');
    await addDocumentNonBlocking(categoriesCollection, newCategory);
    toast({ title: 'Category Added', description: `Category "${values.name}" has been created.` });
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>Create a new category to organize your transactions.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Groceries" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="expense" /></FormControl><FormLabel className="font-normal">Expense</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="income" /></FormControl><FormLabel className="font-normal">Income</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select an icon" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconNames.map(iconName => {
                          const Icon = ICONS[iconName];
                          return <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><Icon /> {iconName}</div></SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-full", field.value.replace('text-', 'bg-'))}></div>
                                <span>{field.value.split('-')[1]}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorClasses.map(colorClass => (
                          <SelectItem key={colorClass} value={colorClass}>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-full", colorClass.replace('text-', 'bg-'))}></div>
                                <span>{colorClass.split('-')[1]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
