import { PageHeader } from "@/components/layout/page-header";
import { ProfileContent } from "@/components/profile/profile-content";

export default function ProfilePage() { return <div className="space-y-6"><PageHeader title="My profile" description="Your reusable citizen information shared with your consent." /><ProfileContent /></div>; }
