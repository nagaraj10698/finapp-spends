
'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { updateIncomeStatus } from '../actions';


export default function StatusDropdown({ transaction }: { transaction: Transaction }) {
    const { user } = useFirebase();
    const { toast } = useToast();
  
    const handleStatusChange = async (status: 'Received' | 'Pending') => {
      if (!user) {
         toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to change the status.",
        });
        return
      };
      
      const result = await updateIncomeStatus(transaction.id, status, user.uid);
      if (result.success) {
        toast({
            title: "Status Updated",
            description: `Transaction status changed to ${status}.`,
        });
      } else {
         toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update transaction status.",
        });
        console.error("Error updating status:", result.error);
      }
    };
    
    const currentStatus = transaction.status === 'Received' || transaction.status === 'Pending' ? transaction.status : 'Received';
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button
            variant="outline"
            size="sm"
            className={cn(
                "h-8 capitalize w-28 justify-start",
                currentStatus === 'Received' 
                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' 
                : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800'
            )}
            >
            <span className='flex items-center gap-2'>
                {currentStatus === 'Received' ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {currentStatus}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => handleStatusChange('Received')}>
            <Check className="mr-2 h-4 w-4" />
            Received
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleStatusChange('Pending')}>
            <Circle className="mr-2 h-4 w-4" />
            Pending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
};
