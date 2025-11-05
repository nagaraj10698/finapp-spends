
import ProfileSettings from "../settings/profile-settings";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-2xl font-semibold">Profile</h1>
      <ProfileSettings />
    </div>
  );
}
