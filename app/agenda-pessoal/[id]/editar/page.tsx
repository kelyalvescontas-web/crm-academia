"use client";

import { useEffect } from "react";

export default function EditarAgendaPessoalPage() {
  useEffect(() => {
    window.location.href = "/agenda-pessoal";
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="rounded-3xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-black">Abrindo edição...</h1>
        <p className="mt-2 text-slate-500">A edição é feita pela tela principal da Agenda Pessoal.</p>
      </div>
    </main>
  );
}
