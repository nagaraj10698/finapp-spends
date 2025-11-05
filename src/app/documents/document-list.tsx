'use client';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { UploadedFile } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

export default function DocumentList() {
    const { firestore, user } = useFirebase();
    const fileUploadsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'fileUploads') : null, [firestore, user]);
    const { data: uploadedFiles, isLoading } = useCollection<UploadedFile>(fileUploadsCollection);

    const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(uploadedFiles?.map(f => f.id) ?? []);
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

  const handleDeleteSelected = async () => {
    if (!user || !firestore || selectedFiles.length === 0) return;
    const batch = writeBatch(firestore);
    selectedFiles.forEach(fileId => {
        const docRef = doc(firestore, 'users', user.uid, 'fileUploads', fileId);
        batch.delete(docRef);
    });
    await batch.commit();
    setSelectedFiles([]);
  };

  return (
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
                        checked={uploadedFiles && uploadedFiles.length > 0 && selectedFiles.length === uploadedFiles.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && uploadedFiles && uploadedFiles.length > 0 ? (
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
                        <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    !isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
  );
}
