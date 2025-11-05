
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2, Trash2 } from 'lucide-react';
import { processTransactionsAction } from '../actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ProcessTransactionsOutput } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
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
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const { toast } = useToast();

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

    try {
        const formData = new FormData();
        formData.append('file', file);
      const response = await processTransactionsAction(formData);
      
      if (response.success && response.data) {
        onProcess(response.data);
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${response.data.transactions.length} transactions from ${file.name}.`,
        });

        // Add to historical list
        const newFile: UploadedFile = {
          id: `${file.name}-${new Date().toISOString()}`,
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(uploadedFiles.map(f => f.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSelectRow = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleDeleteSelected = () => {
    const updatedFiles = uploadedFiles.filter(f => !selectedFiles.includes(f.id));
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
    setSelectedFiles([]);
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
            <CardContent className="space-y-2 py-2">
              <div
                {...getRootProps()}
                className={`flex justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/25 px-1 py-1 text-center transition-colors ${
                  isDragActive ? 'bg-accent' : 'bg-transparent'
                } ${file ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center gap-2 text-foreground p-1">
                    <File className="h-6 w-6" />
                    <p className="text-xs">{file.name}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="mt-1 h-7"
                      disabled={loading}
                    >
                      <X className="mr-2 h-3 w-3" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 flex justify-center text-xs leading-6 text-muted-foreground">
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document History</CardTitle>
              {selectedFiles.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedFiles.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={uploadedFiles.length > 0 && selectedFiles.length === uploadedFiles.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedFiles.includes(doc.id)}
                            onCheckedChange={(checked) => handleSelectRow(doc.id, Boolean(checked))}
                            aria-label={`Select file ${doc.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
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
