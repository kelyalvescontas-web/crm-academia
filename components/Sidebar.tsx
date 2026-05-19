"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  const [cargo, setCargo] = useState("");

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (usuarioSalvo) {
      const usuario = JSON.parse(usuarioSalvo);
      setCargo(usuario.cargo);
    }
  }, []);

  function sair() {
    localStorage.removeItem("usuario");
    router.push("/login");
  }

  return (
    <aside className="w-full md:w-64 bg-blue-900 text-white md:min-h-screen p-6 md:p-8 flex md:flex-col flex-row md:justify-between items-center md:items-start gap-6 overflow-x-auto">
      <div className="flex md:block items-center gap-8">
        <h1 className="text-2xl md:text-4xl font-bold md:mb-16 whitespace-nowrap">
          CRM Academia
        </h1>

        <nav className="flex md:flex-col flex-row gap-6 md:gap-8 text-lg md:text-2xl whitespace-nowrap">
          <a href="/">Dashboard</a>

          <a href="/aulas">Aulas</a>

          <a href="/diarias">Diárias</a>
      
          <a href="/calendario">Calendário</a>

          {cargo === "ADMIN" && <a href="/cadastro">Usuários</a>}

          {cargo === "ADMIN" && <a href="/relatorios">Relatórios</a>}

          {(cargo === "ADMIN" || cargo === "FINANCEIRO") && (
            <a href="/configuracoes">Configurações</a>
          )}
        </nav>
      </div>

      <button
        onClick={sair}
        className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold whitespace-nowrap"
      >
        Sair
      </button>
    </aside>
  );
}