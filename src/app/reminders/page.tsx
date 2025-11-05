
'use client';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Reminder } from '@/lib/types';
import ReminderCard from './reminder-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddReminderDialog from './add-reminder-dialog';
import { useToast } from '@/hooks/use-toast';

export default function RemindersPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const remindersCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'reminders') : null, [firestore, user]);
  const { data: reminders, isLoading } = useCollection<Reminder>(remindersCollection);

  const handleTogglePaid = async (reminder: Reminder) => {
    if (!user || !firestore) return;
    const reminderRef = doc(firestore, 'users', user.uid, 'reminders', reminder.id);
    try {
      await updateDoc(reminderRef, { isPaid: !reminder.isPaid });
      toast({
        title: 'Reminder Updated',
        description: `${reminder.reminderName} marked as ${!reminder.isPaid ? 'paid' : 'unpaid'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the reminder.',
      });
    }
  };

  if (isLoading) {
    return <div>Loading reminders...</div>;
  }

  const sortedReminders = reminders
    ? [...reminders]
        .map(r => ({...r, reminderDate: (r.reminderDate as any).toDate()}))
        .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
        .sort((a,b) => (a.isPaid === b.isPaid) ? 0 : a.isPaid ? 1 : -1)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold">Reminders</h1>
            <p className="text-muted-foreground">Manage your upcoming bills and subscription reminders.</p>
        </div>
        <AddReminderDialog>
            <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Reminder
            </Button>
        </AddReminderDialog>
      </div>

      {sortedReminders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedReminders.map(reminder => (
                <ReminderCard key={reminder.id} reminder={reminder} onTogglePaid={handleTogglePaid} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">No reminders yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add a reminder to get started.</p>
          <AddReminderDialog>
            <Button className="mt-6">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Reminder
            </Button>
          </AddReminderDialog>
        </div>
      )}
    </div>
  );
}
