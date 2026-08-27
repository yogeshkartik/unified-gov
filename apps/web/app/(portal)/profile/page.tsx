import { PageHeader } from "@/components/layout/page-header";
import { ProfileContent } from "@/components/profile/profile-content";

export default function ProfilePage() { return <div className="space-y-6"><PageHeader title="My profile" description="Your reusable synthetic citizen information. Profile editing will be added in a later foundation slice." /><ProfileContent /></div>; }
