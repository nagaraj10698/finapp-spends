
'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { processTransactionsAction } from '../actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ProcessTransactionsOutput, UploadedFile, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';

interface TransactionUploadProps {
  onProcess: (data: ProcessTransactionsOutput) => void;
}

export default function TransactionUpload({ onProcess }: TransactionUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => [...prev, ...acceptedFiles]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !firestore || !user) return;

    setLoading(true);
    setError(null);

    const errors: string[] = [];
    let totalProcessedCount = 0;
    
    const batch = writeBatch(firestore);

    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await processTransactionsAction(formData, user.uid);

            if (response.success && response.data) {
                totalProcessedCount += response.data.transactions.length;

                // Add file to fileUploads collection
                const fileUploadRef = doc(collection(firestore, 'users', user.uid, 'fileUploads'));
                const newFile: Omit<UploadedFile, 'id'> = {
                    name: file.name,
                    uploadDate: serverTimestamp(),
                    fileSize: file.size,
                    fileType: file.type,
                }
                batch.set(fileUploadRef, newFile);

                // Add transactions to transactions subcollection
                response.data.transactions.forEach(t => {
                    const transactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
                    const newTx: Omit<Transaction, 'id'> = {
                        description: t.description,
                        amount: t.amount,
                        date: new Date(t.date),
                        category: t.category,
                        type: t.amount < 0 ? 'expense' : 'income'
                    };
                    batch.set(transactionRef, newTx);
                });
                onProcess(response.data);

            } else {
                errors.push(response.error ?? `An unknown error occurred while processing ${file.name}.`);
            }
        } catch (e: any) {
            errors.push(e.message || `Failed to process ${file.name}.`);
        }
    }
    
    try {
        await batch.commit();
        if (totalProcessedCount > 0) {
             toast({
              title: "Processing Complete",
              description: `Successfully processed ${totalProcessedCount} transactions from ${files.length} file(s).`
            });
        }
        setFiles([]);
    } catch(e: any) {
        errors.push(e.message || 'Failed to save transactions to database.');
    }


    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    setLoading(false);
  };


  return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Upload Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`flex justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 text-center transition-colors ${
                isDragActive ? 'bg-accent' : 'bg-transparent'
              } ${files.length > 0 ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 flex justify-center text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-primary">
                    Upload a file
                  </span>
                  <span className="pl-1">or drag and drop</span>
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  CSV, XLSX, or PDF up to 10MB
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Selected Files</h3>
                <div className="rounded-md border">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file)}
                        className="h-6 w-6"
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleUpload} disabled={files.length === 0 || loading || !user}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Process Transactions
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
  );
}
