
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "./profile-settings";
import CategorySettings from "./category-settings";


export default function SettingsPage() {
    return (
        <div className="space-y-4">
            <h1 className="font-headline text-2xl font-semibold">Settings</h1>
            <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-4">
                    <ProfileSettings />
                </TabsContent>
                <TabsContent value="categories" className="mt-4">
                    <CategorySettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
