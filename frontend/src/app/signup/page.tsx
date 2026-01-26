"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import "../login/login.css";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  return (
    <div className="login-container">
      <div className="logo-container">
        <Image
          src="/icons/icon.jpg"
          alt="Capybara Logo"
          width={120}
          height={120}
          className="login-logo"
        />
      </div>
      <h1 className="app-title">Sign-ups Unavailable</h1>
      <p className="info-text">
        Account creation is handled by an administrator. Please reach out to your team lead to request access.
      </p>
      <Button
        variant="info"
        onClick={() => router.push("/login")}
        className="login-btn"
      >
        Go to Login
      </Button>
    </div>
  );
}
