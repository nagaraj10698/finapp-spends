
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { processTransactionsAction } from '../actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ProcessTransactionsOutput } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UploadedFile {
  name: string;
  uploadDate: string;
}

interface TransactionUploadProps {
  onProcess: (data: ProcessTransactionsOutput) => void;
}

export default function TransactionUpload({ onProcess }: TransactionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const storedFiles = localStorage.getItem('uploadedFiles');
    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles));
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
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
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const fileContent = event.target?.result as string;
            const response = await processTransactionsAction(fileContent);
            if (response.success && response.data) {
                onProcess(response.data);
                // Add to historical list
                const newFile: UploadedFile = {
                name: file.name,
                uploadDate: new Date().toLocaleDateString(),
                };
                const updatedFiles = [newFile, ...uploadedFiles];
                setUploadedFiles(updatedFiles);
                localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
                setFile(null); // Clear the file only after successful processing
            } else {
                setError(response.error ?? 'An unknown error occurred.');
            }
        } catch (e: any) {
             setError(e.message || 'Failed to process file.');
        } finally {
            setLoading(false);
        }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Tabs defaultValue="upload">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload & Process</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="upload">
        <div className="space-y-6 mt-4">
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
                      disabled={loading}
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
                      CSV, XLSX, or PDF up to 10MB
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
               {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="documents">
         <Card className="mt-4">
            <CardHeader>
              <CardTitle>Document History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </TabsContent>
    </Tabs>
  );
}
