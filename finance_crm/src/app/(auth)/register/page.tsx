"use client";

import { authClient } from "@/lib/auth-client";
import React from "react";

export default function page() {
  const handleRegister = async () => {
    const res = await authClient.signUp.email({
      email: "kush@gmail.com",
      password: "11111111",
      name: "Kush",
    });
    console.log(res);
  };
  return <div onClick={handleRegister}>page</div>;
}
