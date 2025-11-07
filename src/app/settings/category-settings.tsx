
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { defaultCategories, getIconByName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AddCategoryDialog } from './add-category-dialog';
import { EditCategoryDialog } from './edit-category-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function CategoryList({ title, categories, onEdit, onDelete }: { title: string, categories: Category[], onEdit: (cat: Category) => void, onDelete: (cat: Category) => void }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <div className="rounded-md border">
        {categories.length > 0 ? categories.map((cat) => {
          const Icon = getIconByName(cat.icon);
          return (
            <div key={cat.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <Icon className={cn('h-5 w-5', cat.color)} />
                <span className="font-medium">{cat.name}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(cat)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(cat)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }) : (
          <div className="p-3 text-center text-sm text-muted-foreground">No categories found.</div>
        )}
      </div>
    </div>
  );
}

export default function CategorySettings() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories, isLoading } = useCollection<Category>(categoriesCollection);

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const incomeCategories = categories?.filter(c => c.type === 'income') ?? [];
  const expenseCategories = categories?.filter(c => c.type === 'expense') ?? [];

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setEditOpen(true);
  };
  
  const handleDeleteRequest = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete || !user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'categories', categoryToDelete.id));
      toast({
        title: 'Category Deleted',
        description: `The category "${categoryToDelete.name}" has been deleted.`,
      });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: "Could not delete the category.",
        })
    } finally {
        setCategoryToDelete(null);
    }
  }

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>Add, edit, or delete your income and expense categories.</CardDescription>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <CategoryList title="Expense Categories" categories={expenseCategories} onEdit={handleEdit} onDelete={handleDeleteRequest} />
        <CategoryList title="Income Categories" categories={incomeCategories} onEdit={handleEdit} onDelete={handleDeleteRequest} />
      </CardContent>
    </Card>

    <AddCategoryDialog isOpen={isAddOpen} onClose={() => setAddOpen(false)} />
    
    {categoryToEdit && (
        <EditCategoryDialog 
            isOpen={isEditOpen} 
            onClose={() => { setEditOpen(false); setCategoryToEdit(null); }} 
            category={categoryToEdit}
        />
    )}

    <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the 
                    <span className="font-bold"> &quot;{categoryToDelete?.name}&quot; </span> 
                    category. Any transactions associated with it will still exist but will be uncategorized.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({variant: 'destructive'}))}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
