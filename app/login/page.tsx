"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function entrar() {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify(data)
      );

      router.push("/");
    } catch (error) {
      alert("Erro ao fazer login");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow w-[450px]">
        <h1 className="text-4xl font-bold text-center mb-8">
          Login CRM Academia
        </h1>

        <div className="space-y-5">

          <div>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full border p-3 rounded-xl"
            />
          </div>

          <div>
            <label>Senha</label>

            <input
              type="password"
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              className="w-full border p-3 rounded-xl"
            />
          </div>

          <button
            onClick={entrar}
            className="w-full bg-blue-900 text-white p-4 rounded-xl font-bold"
          >
            Entrar
          </button>

        </div>
      </div>
    </main>
  );
}