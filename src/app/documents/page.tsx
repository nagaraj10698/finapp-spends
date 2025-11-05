import DocumentList from "./document-list";

export default function DocumentsPage() {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="font-headline text-2xl font-semibold">Documents</h1>
                <p className="text-muted-foreground">
                    View and manage your uploaded bank statements and documents.
                </p>
            </div>
            <DocumentList />
        </div>
    );
}
