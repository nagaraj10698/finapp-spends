
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
import { updateTransactionStatus } from '../actions';
import type { Transaction } from '@/lib/types';


export default function StatusDropdown({ transaction }: { transaction: Transaction }) {
    const { user } = useFirebase();
    const { toast } = useToast();
  
    const handleStatusChange = async (status: 'Paid' | 'Un-paid') => {
      if (!user) {
         toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to change the status.",
        });
        return
      };
      
      const result = await updateTransactionStatus(transaction.id, status, user.uid);
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Transaction status changed to ${status}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.error,
        });
      }
    };
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button
            variant="outline"
            size="sm"
            className={cn(
                "h-8 capitalize w-24 justify-start",
                transaction.status === 'Paid' 
                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' 
                : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800'
            )}
            >
            <span className='flex items-center gap-2'>
                {transaction.status === 'Paid' ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {transaction.status}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => handleStatusChange('Paid')}>
            <Check className="mr-2 h-4 w-4" />
            Paid
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleStatusChange('Un-paid')}>
            <Circle className="mr-2 h-4 w-4" />
            Un-paid
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
};
