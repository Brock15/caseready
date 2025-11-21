// Redirect old Stealth landing to the new redaction flow.
import { redirect } from "next/navigation";

export default function StealthRedirect() {
  redirect("/redact");
}
