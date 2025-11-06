
'use client';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Due } from '@/lib/types';
import DueCard from './due-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddDueDialog from './add-due-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DuesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const duesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'dues') : null, [firestore, user]);
  const { data: dues, isLoading } = useCollection<Due>(duesCollection);

  const handleTogglePaid = async (due: Due) => {
    if (!user || !firestore) return;
    const dueRef = doc(firestore, 'users', user.uid, 'dues', due.id);
    try {
      await updateDoc(dueRef, { isPaid: !due.isPaid });
      toast({
        title: 'Due Updated',
        description: `${due.dueName} marked as ${!due.isPaid ? 'paid' : 'unpaid'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the due.',
      });
    }
  };

  if (isLoading) {
    return <div>Loading dues...</div>;
  }

  const sortedDues = dues
    ? [...dues]
        .map(r => ({...r, dueDate: (r.dueDate as any).toDate()}))
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .sort((a,b) => (a.isPaid === b.isPaid) ? 0 : a.isPaid ? 1 : -1)
    : [];

  return (
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

      {sortedDues.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedDues.map(due => (
                <DueCard key={due.id} due={due} onTogglePaid={handleTogglePaid} />
            ))}
        </div>
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
  );
}
