
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef, useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email(),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, auth, firestore } = useFirebase();
  const [photoURL, setPhotoURL] = useState(user?.photoURL);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
        firstName: user?.displayName?.split(' ')[0] || '',
        lastName: user?.displayName?.split(' ')[1] || '',
        email: user?.email || '',
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);

    const storage = getStorage();
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);

    try {
        await uploadBytes(storageRef, file);
        const newPhotoURL = await getDownloadURL(storageRef);
        setPhotoURL(newPhotoURL);
        
        await updateProfile(user, { photoURL: newPhotoURL });
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { photoURL: newPhotoURL });
        
        toast({
            title: 'Profile Picture Updated',
            description: 'Your new profile picture has been saved.',
        });

    } catch (error) {
        console.error("Error uploading file: ", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not upload your profile picture.",
        });
    } finally {
        setIsUploading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }

    try {
      // Update Firebase Auth display name
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });

      // Update Firestore user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName: values.firstName,
        lastName: values.lastName,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while updating your profile.',
      });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-headline text-2xl font-semibold">Profile</h1>
      <Card>
        <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and profile picture here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage src={photoURL || undefined} alt="User Avatar" />
                        <AvatarFallback>{(user?.displayName?.[0] || user?.email?.[0] || "U")}</AvatarFallback>
                    </Avatar>
                     {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    )}
                </div>

                <Button variant="outline" onClick={handleAvatarClick} disabled={isUploading}>
                    Change Picture
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
            </div>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                        <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                        disabled
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit">Save Changes</Button>
            </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
