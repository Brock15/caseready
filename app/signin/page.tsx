import { Suspense } from "react";
import SigninForm from "./SigninForm";

export default function SigninPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SigninForm />
    </Suspense>
  );
}
