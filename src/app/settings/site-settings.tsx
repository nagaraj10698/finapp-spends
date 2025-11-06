
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import type { AppSettings } from '@/lib/types';
import Image from 'next/image';

const formSchema = z.object({
  logo: z.instanceof(File).optional(),
});

export default function SiteSettings() {
  const { toast } = useToast();
  const { firestore, firebaseApp } = useFirebase();
  const [isUploading, setIsUploading] = useState(false);
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'branding') : null, [firestore]);
  const { data: appSettings } = useDoc<AppSettings>(settingsDocRef);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firebaseApp || !firestore) return;

    setIsUploading(true);
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `site/logo`);

    try {
      await uploadBytes(storageRef, file);
      const newLogoUrl = await getDownloadURL(storageRef);

      await setDoc(doc(firestore, 'settings', 'branding'), { logoUrl: newLogoUrl });
      
      toast({
        title: 'Logo Updated',
        description: 'The site logo has been changed.',
      });
    } catch (error) {
      console.error("Error uploading file: ", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload the new logo.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
        <CardDescription>Manage your site&apos;s branding and appearance. This is only visible to admins.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <label className="text-sm font-medium">Current Logo</label>
            <div className="flex items-center gap-4">
                {appSettings?.logoUrl ? (
                    <Image src={appSettings.logoUrl} alt="Site Logo" width={120} height={40} className="h-10 w-auto rounded-md border p-1" />
                ) : (
                    <p className="text-sm text-muted-foreground">No custom logo set.</p>
                )}
            </div>
        </div>
        <div className="space-y-2">
             <label htmlFor="logo-upload" className="text-sm font-medium">Change Logo</label>
             <div className="flex items-center gap-2">
                <Input
                    id="logo-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="max-w-xs"
                    accept="image/png, image/jpeg, image/svg+xml"
                    disabled={isUploading}
                />
                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
