import { redirect } from "next/navigation";

// Entry point → send everyone to the fake login (role picker).
export default function Home() {
  redirect("/login");
}
