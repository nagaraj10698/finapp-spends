
'use client';

import ProfileSettings from "./profile-settings";
import CategorySettings from "./category-settings";
import SiteSettings from "./site-settings";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";


export default function SettingsPage() {
    const { firestore, user } = useFirebase();
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userDocRef);

    return (
        <div className="space-y-8">
            <h1 className="font-headline text-2xl font-semibold">Settings</h1>
            <div className="grid gap-8">
                {userProfile?.isAdmin && <SiteSettings />}
                <ProfileSettings />
                <CategorySettings />
            </div>
        </div>
    )
}
