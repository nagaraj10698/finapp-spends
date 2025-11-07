
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { User, updateProfile } from 'firebase/auth';
import Logo from '@/components/logo';
import { collection, doc, serverTimestamp, setDoc, writeBatch, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { defaultCategories } from '@/lib/data';
import { getCurrencyByCountry } from '@/lib/currencies';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.317-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.556,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [defaultCurrency, setDefaultCurrency] = useState('AED');

  useEffect(() => {
    // This runs on the client and will not cause a hydration mismatch.
    const userLocale = navigator.language;
    if (userLocale) {
        const countryCode = userLocale.split('-')[1];
        if (countryCode) {
            const currency = getCurrencyByCountry(countryCode);
            if (currency) {
                setDefaultCurrency(currency.code);
            }
        }
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const handleNewUserSetup = async (user: User) => {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return; // User already exists, no setup needed.
    }

    const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
    const lastName = lastNameParts.join(' ');
    
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      photoURL: user.photoURL,
      currency: defaultCurrency,
      mobileNumber: user.phoneNumber || '',
    });
  };

  const handleAuthError = (error: any, title: string) => {
      console.error(error);
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = 'The sign-in popup was closed before completion.';
            break;
          default:
            errorMessage = `Signup failed: ${error.message}`;
        }
      }
      toast({
        variant: 'destructive',
        title: title,
        description: errorMessage,
      });
  }
  
  const onGoogleSignIn = async () => {
    try {
      const userCredential = await initiateGoogleSignIn(auth);
      await handleNewUserSetup(userCredential.user);
      toast({
        title: 'Signup Successful',
        description: 'Your account has been created.',
      });
      router.push('/');
    } catch (error) {
      handleAuthError(error, 'Google Sign-Up Failed');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: 'Database service is not available.',
        });
        return;
    }
    try {
      const userCredential = await initiateEmailSignUp(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          firstName: values.firstName,
          lastName: values.lastName,
          photoURL: user.photoURL,
          currency: defaultCurrency,
          mobileNumber: '',
      });

      // Default categories are now created by the mock data generator if needed.

      toast({
        title: 'Signup Successful',
        description: 'Your account has been created.',
      });
      router.push('/');
    } catch (error) {
      handleAuthError(error, 'Signup Failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your information to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          </Form>
           <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={onGoogleSignIn}>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Sign up with Google
            </Button>
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
