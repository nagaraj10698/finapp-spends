'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X } from 'lucide-react';

export default function TransactionUpload() {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
  };

  const handleUpload = () => {
    if (file) {
      // Placeholder for upload logic
      console.log('Uploading file:', file.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Statement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`flex justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 text-center transition-colors ${
            isDragActive ? 'bg-accent' : 'bg-transparent'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-2 text-foreground">
                <File className="h-10 w-10" />
                <p>{file.name}</p>
                 <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); removeFile(); }} className="mt-2">
                    <X className="mr-2 h-4 w-4" /> Remove
                </Button>
            </div>
          ) : (
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 flex justify-center text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-primary">Upload a file</span>
                <span className="pl-1">or drag and drop</span>
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                CSV or PDF up to 10MB
              </p>
            </div>
          )}
        </div>
        <Button onClick={handleUpload} disabled={!file}>
          Process Transactions
        </Button>
      </CardContent>
    </Card>
  );
}
