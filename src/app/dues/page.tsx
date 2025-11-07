
'use client';
import { useState, useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Due, Category } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import DuesList from './dues-list';
import DueFormDialog from './due-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/data';

export default function DuesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [isFormOpen, setFormOpen] = useState(false);
  const [dueToEdit, setDueToEdit] = useState<Due | null>(null);
  const [dueToDelete, setDueToDelete] = useState<Due | null>(null);

  const duesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'dues') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);

  const { data: dues, isLoading: duesLoading } = useCollection<Due>(duesCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const handleEditRequest = (due: Due) => {
    setDueToEdit(due);
    setFormOpen(true);
  };
  
  const handleAddRequest = () => {
    setDueToEdit(null);
    setFormOpen(true);
  }

  const handleDeleteRequest = (due: Due) => {
    setDueToDelete(due);
  };
  
  const sortedDues = useMemo(() => {
    if (!dues) return [];
    return [...dues].map(d => ({...d, dueDate: toDate(d.dueDate)})).sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [dues]);

  const handleDeleteConfirm = async () => {
    if (!dueToDelete || !user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'dues', dueToDelete.id));
      toast({
        title: 'Due Deleted',
        description: `The due "${dueToDelete.dueName}" has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the due.",
      });
    } finally {
      setDueToDelete(null);
    }
  };


  if (duesLoading || categoriesLoading) {
    return <div>Loading dues...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-semibold">Dues</h1>
            <p className="text-muted-foreground">Manage your one-time and recurring bills, subscriptions, and EMIs.</p>
          </div>
          <Button onClick={handleAddRequest}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Due
          </Button>
        </div>
        
        {sortedDues && sortedDues.length > 0 ? (
          <DuesList 
            dues={sortedDues} 
            categories={categories ?? []}
            onEdit={handleEditRequest}
            onDelete={handleDeleteRequest}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No dues created yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add a due to get started with tracking your bills.</p>
             <Button className="mt-6" onClick={handleAddRequest}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Due
            </Button>
          </div>
        )}
      </div>

      <DueFormDialog
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        due={dueToEdit}
        categories={categories ?? []}
      />
      
      <AlertDialog open={!!dueToDelete} onOpenChange={(open) => !open && setDueToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this due?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the due for 
                    <span className="font-bold"> &quot;{dueToDelete?.dueName}&quot;</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDueToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({variant: 'destructive'}))}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
