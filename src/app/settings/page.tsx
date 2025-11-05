'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="space-y-4">
            <h1 className="font-headline text-2xl font-semibold">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>This page is under construction.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Settings functionality will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    )
}