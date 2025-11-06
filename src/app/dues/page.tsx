
'use client';
import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Due, Category } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddDueDialog from './add-due-dialog';
import { useToast } from '@/hooks/use-toast';
import { generateDueInstances, toDate } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import EditDueDialog from './edit-due-dialog';
import { processDuePayment } from '@/app/actions';


export default function DuesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const duesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'dues') : null, [firestore, user]);
  const categoriesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);

  const { data: dues, isLoading: duesLoading } = useCollection<Due>(duesCollection);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesCollection);

  const [dueToPay, setDueToPay] = useState<Due | null>(null);
  const [dueToEdit, setDueToEdit] = useState<Due | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [dueToDelete, setDueToDelete] = useState<Due | null>(null);


  const handlePaymentRequest = (due: Due) => {
    const instanceDate = due.instanceDate ? toDate(due.instanceDate) : null;
    const instanceDateStr = instanceDate?.toISOString().split('T')[0];
    const isInstancePaid = !!(due.isRecurring && instanceDateStr && due.paidInstances?.[instanceDateStr]);

    if (due.isPaid || isInstancePaid) {
       toast({
        variant: 'destructive',
        title: 'Already Paid',
        description: 'This due has already been marked as paid.',
      });
      return;
    }
    setDueToPay(due);
  }

  const handleEditRequest = (due: Due) => {
    const originalDue = dues?.find(d => d.id === due.id);
    if (originalDue) {
      setDueToEdit(originalDue);
      setEditOpen(true);
    }
  }

  const handleDeleteRequest = (due: Due) => {
    setDueToDelete(due);
  }

  const handleConfirmPayment = async () => {
    if (!dueToPay || !user) return;

    try {
        await processDuePayment(user.uid, dueToPay);
        toast({
            title: 'Due Paid!',
            description: `${dueToPay.dueName} marked as paid and an expense has been logged.`,
        });
    } catch (error) {
      console.error("Error marking due as paid:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the due.',
      });
    } finally {
        setDueToPay(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!dueToDelete || !user || !firestore) return;

    const originalDueId = dueToDelete.id;

    try {
        await deleteDoc(doc(firestore, 'users', user.uid, 'dues', originalDueId));
        toast({
            title: 'Due Deleted',
            description: `The due "${dueToDelete.dueName}" has been permanently deleted.`,
        });
    } catch (error) {
        console.error("Error deleting due:", error);
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the due.',
        });
    } finally {
        setDueToDelete(null);
    }
  };
   const handleDeleteMany = async (duesToDelete: Due[]) => {
    if (!user || !firestore || duesToDelete.length === 0) return;

    const batch = writeBatch(firestore);
    const uniqueDueIds = new Set(duesToDelete.map(due => due.id));

    uniqueDueIds.forEach(dueId => {
      const docRef = doc(firestore, 'users', user.uid, 'dues', dueId);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      toast({
        title: "Dues Deleted",
        description: `${uniqueDueIds.size} due(s) have been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Deleting Dues",
        description: "An error occurred while deleting dues.",
      });
      console.error("Error deleting dues: ", error);
    }
  };
  
  const dueInstances = useMemo(() => {
    if (!dues) return [];
    return generateDueInstances(dues);
  }, [dues]);

  const tableColumns = useMemo(() => getColumns(categories ?? [], handlePaymentRequest, handleEditRequest, handleDeleteRequest), [categories]);


  if (duesLoading || categoriesLoading) {
    return <div>Loading dues...</div>;
  }

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold">Dues</h1>
            <p className="text-muted-foreground">Manage your upcoming bills and subscription dues.</p>
        </div>
        <AddDueDialog>
            <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Due
            </Button>
        </AddDueDialog>
      </div>

      {dueInstances.length > 0 ? (
        <DataTable columns={tableColumns} data={dueInstances} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">No dues yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add a due to get started.</p>
          <AddDueDialog>
            <Button className="mt-6">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Due
            </Button>
          </AddDueDialog>
        </div>
      )}
    </div>

     <AlertDialog open={!!dueToPay} onOpenChange={(open) => !open && setDueToPay(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                <AlertDialogDescription>
                    This will mark <span className='font-bold'>"'{dueToPay?.dueName}'"</span> as paid and create a corresponding expense entry. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDueToPay(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmPayment}>
                    Mark as Paid
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <AlertDialog open={!!dueToDelete} onOpenChange={(open) => !open && setDueToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the due <span className='font-bold'>"'{dueToDelete?.dueName}'"</span> and all its recurring instances. This action cannot be undone.
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

    {dueToEdit && (
        <EditDueDialog 
            isOpen={isEditOpen}
            onClose={() => {
                setEditOpen(false);
                setDueToEdit(null);
            }}
            due={dueToEdit}
        />
    )}
    </>
  );
}
