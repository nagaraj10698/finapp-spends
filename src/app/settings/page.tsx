
'use client';

import ProfileSettings from "./profile-settings";
import CategorySettings from "./category-settings";


export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <h1 className="font-headline text-2xl font-semibold">Settings</h1>
            <div className="grid gap-8">
                <ProfileSettings />
                <CategorySettings />
            </div>
        </div>
    )
}
