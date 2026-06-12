"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function CompartilhadosAgendaPessoalPage() {
  return (
    <main className="min-h-screen flex bg-slate-100 text-slate-900">
      <Sidebar />
      <section className="flex-1 p-6">
        <div className="rounded-3xl bg-white p-8 shadow">
          <h1 className="text-3xl font-black">Compartilhados da Agenda Pessoal</h1>
          <p className="mt-2 text-slate-500">
            Os eventos e tarefas compartilhados já aparecem na tela principal.
          </p>
          <Link
            href="/agenda-pessoal"
            className="mt-6 inline-block rounded-2xl bg-blue-600 px-6 py-3 font-black text-white"
          >
            Voltar para Agenda Pessoal
          </Link>
        </div>
      </section>
    </main>
  );
}
