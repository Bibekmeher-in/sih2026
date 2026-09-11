import { redirect } from "next/navigation";

export default function ProfilePage() {
  redirect("/fpo?tab=profile");
}
