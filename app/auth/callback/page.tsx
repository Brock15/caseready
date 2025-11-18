import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">Redirecting…</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
