'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { processTransactionsAction } from '../actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { DataTable } from './data-table';
import { columns } from './columns';
import type { ProcessTransactionsOutput } from '@/lib/types';

export default function TransactionUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessTransactionsOutput | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target?.result as string;
      const response = await processTransactionsAction(fileContent);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error ?? 'An unknown error occurred.');
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`flex justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 text-center transition-colors ${
              isDragActive ? 'bg-accent' : 'bg-transparent'
            } ${file ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2 text-foreground">
                <File className="h-10 w-10" />
                <p>{file.name}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="mt-2"
                >
                  <X className="mr-2 h-4 w-4" /> Remove
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 flex justify-center text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-primary">
                    Upload a file
                  </span>
                  <span className="pl-1">or drag and drop</span>
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  CSV, TXT, or PDF up to 10MB
                </p>
              </div>
            )}
          </div>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Process Transactions
          </Button>
        </CardContent>
      </Card>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && result.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={result.transactions.map(t => ({...t, amount: t.amount, date: new Date(t.date), id: t.description + t.date}))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
