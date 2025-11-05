'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { processTransactionsAction } from '../actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ProcessTransactionsOutput, UploadedFile, Transaction } from '@/lib/types';

interface TransactionUploadProps {
  onProcess: (data: ProcessTransactionsOutput) => void;
}

export default function TransactionUpload({ onProcess }: TransactionUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    let allTransactions: ProcessTransactionsOutput['transactions'] = [];
    let filesProcessed = 0;
    const newUploadedFiles: UploadedFile[] = [];

    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await processTransactionsAction(formData);

            if (response.success && response.data) {
                allTransactions = [...allTransactions, ...response.data.transactions];
                filesProcessed++;

                const newFile: UploadedFile = {
                    id: `${file.name}-${new Date().toISOString()}`,
                    name: file.name,
                    uploadDate: new Date().toLocaleDateString(),
                };
                newUploadedFiles.push(newFile);
            } else {
                setError(response.error ?? `An unknown error occurred while processing ${file.name}.`);
                break; 
            }
        } catch (e: any) {
            setError(e.message || `Failed to process ${file.name}.`);
            break;
        }
    }
    
    if (filesProcessed > 0) {
        // Persist uploaded files history
        const storedFilesString = localStorage.getItem('uploadedFiles');
        const storedFiles: UploadedFile[] = storedFilesString ? JSON.parse(storedFilesString) : [];
        const updatedFiles = [...newUploadedFiles, ...storedFiles];
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
        
        // Persist processed transactions
        const storedTransactionsString = localStorage.getItem('processedTransactions');
        const storedTransactions: Transaction[] = storedTransactionsString ? JSON.parse(storedTransactionsString) : [];

        const newTxs: Transaction[] = allTransactions.map(t => ({
          id: `txn-${Date.now()}-${Math.random()}`,
          description: t.description,
          amount: Math.abs(t.amount),
          date: new Date(t.date),
          category: t.category,
          type: t.amount < 0 ? 'expense' : 'income'
        }));

        const updatedTransactions = [...newTxs, ...storedTransactions];
        localStorage.setItem('processedTransactions', JSON.stringify(updatedTransactions));

        onProcess({ transactions: allTransactions });
        setFiles([]);
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

            <Button onClick={handleUpload} disabled={files.length === 0 || loading}>
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
