import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-wrap">
          <p className="muted">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
