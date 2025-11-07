
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef, useState, useTransition, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2 } from 'lucide-react';
import ImageCropperDialog from '@/app/profile/image-cropper-dialog';
import { Separator } from '@/components/ui/separator';
import { generateMockTransactionsForYear } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/lib/currencies';
import { useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useDoc, useMemoFirebase } from '@/firebase';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email(),
  currency: z.string().min(1, "Currency is required.")
});

export default function ProfileSettings() {
  const { toast } = useToast();
  const { user, auth, firestore, firebaseApp } = useFirebase();
  const [photoURL, setPhotoURL] = useState(user?.photoURL);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
        currency: 'AED',
    },
  });

  useEffect(() => {
    if (userProfile) {
        form.reset({
            firstName: userProfile.firstName || user?.displayName?.split(' ')[0] || '',
            lastName: userProfile.lastName || user?.displayName?.split(' ')[1] || '',
            email: userProfile.email || user?.email || '',
            currency: userProfile.currency || 'AED',
        })
    }
  }, [userProfile, user, form]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setCropperOpen(true);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCroppedImage = async (croppedImageBlob: Blob | null) => {
    if (!croppedImageBlob || !user || !firestore || !firebaseApp) {
        setCropperOpen(false);
        return;
    }
    setIsUploading(true);
    setCropperOpen(false);

    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    const imageFile = new File([croppedImageBlob], "profile_picture.jpeg", { type: "image/jpeg" });

    try {
        await uploadBytes(storageRef, imageFile);
        const newPhotoURL = await getDownloadURL(storageRef);
        setPhotoURL(newPhotoURL);
        
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
        }
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
        setSelectedImage(null);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: `${values.firstName} ${values.lastName}`,
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName: values.firstName,
        lastName: values.lastName,
        currency: values.currency,
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
  
  const handleGenerateMockData = () => {
    if (!user) return;
    startTransition(async () => {
        try {
            await generateMockTransactionsForYear(user.uid);
            toast({
                title: "Mock Data Generated",
                description: "A year's worth of mock transactions has been added to your account."
            });
        } catch (error) {
            console.error("Failed to generate mock data", error);
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: "Could not generate mock data.",
            });
        }
    })
  }

  return (
    <>
      <ImageCropperDialog 
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setSelectedImage(null);
        }}
        image={selectedImage}
        onSave={handleSaveCroppedImage}
      />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Save Changes</Button>
            </form>
            </Form>
        </CardContent>
         <Separator />
        <CardHeader>
            <CardTitle>Developer</CardTitle>
            <CardDescription>Actions for testing and development.</CardDescription>
        </CardHeader>
        <CardContent>
             <Button variant="secondary" onClick={handleGenerateMockData} disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : "Generate Mock Data"}
            </Button>
        </CardContent>
      </Card>
    </>
  );
}
