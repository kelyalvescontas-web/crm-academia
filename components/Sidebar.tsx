"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    {
      nome: "Dashboard",
      rota: "/",
    },
    {
      nome: "Aulas Agendadas",
      rota: "/aulas",
    },
    {
      nome: "Diárias",
      rota: "/diarias",
    },
    {
      nome: "Calendário",
      rota: "/calendario",
    },
    {
      nome: "Usuários",
      rota: "/usuarios",
    },
    {
      nome: "Relatórios",
      rota: "/relatorios",
    },
    {
      nome: "Configurações",
      rota: "/configuracoes",
    },
  ];

  return (
    <div className="w-72 min-h-screen bg-blue-900 text-white flex flex-col p-6">
      <h1 className="text-4xl font-bold mb-12">
        CRM Academia
      </h1>

      <div className="flex flex-col gap-4">
        {menu.map((item) => (
          <Link
            key={item.rota}
            href={item.rota}
            className={`text-2xl px-4 py-4 rounded-xl transition-all duration-200 ${
              pathname === item.rota
                ? "bg-white text-blue-900 font-bold"
                : "hover:bg-blue-800"
            }`}
          >
            {item.nome}
          </Link>
        ))}
      </div>
    </div>
  );
}