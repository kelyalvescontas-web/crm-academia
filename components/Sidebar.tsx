"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [logo, setLogo] = useState("");
  const [corSistema, setCorSistema] = useState("#1e3a8a");

  useEffect(() => {
    carregarConfiguracoes();

    window.addEventListener(
      "unidadeAlterada",
      carregarConfiguracoes
    );

    return () => {
      window.removeEventListener(
        "unidadeAlterada",
        carregarConfiguracoes
      );
    };
  }, []);

  async function carregarConfiguracoes() {
    const usuarioSalvo =
      localStorage.getItem("usuario");

    if (!usuarioSalvo) return;

    const usuario = JSON.parse(usuarioSalvo);

    const unidadeId =
      usuario.cargo === "ADMIN_GERAL"
        ? localStorage.getItem(
            "unidadeSelecionadaId"
          )
        : String(usuario.unidadeId || "");

    if (!unidadeId) return;

    const response = await fetch(
      `/api/configuracoes?unidadeId=${unidadeId}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    setLogo(data.logo || "");
    setCorSistema(
      data.corSistema || "#1e3a8a"
    );
  }

  function sair() {
    localStorage.removeItem("usuario");
    localStorage.removeItem(
      "unidadeSelecionadaId"
    );

    router.push("/login");
  }

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
    <div
      className="min-h-screen text-white flex flex-col p-6"
      style={{
        width: "320px",
        background: corSistema,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "45px",
          marginTop: "15px",
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt="Logo"
            style={{
              width: "230px",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <h1 className="text-4xl font-bold text-center">
            CRM Academia
          </h1>
        )}
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {menu.map((item) => (
          <Link
            key={item.rota}
            href={item.rota}
            className={`text-2xl px-4 py-4 rounded-xl transition-all duration-200 ${
              pathname === item.rota
                ? "bg-white font-bold"
                : "hover:bg-blue-800"
            }`}
            style={{
              color:
                pathname === item.rota
                  ? corSistema
                  : "white",
            }}
          >
            {item.nome}
          </Link>
        ))}
      </div>

      <button
        onClick={sair}
        style={{
          marginTop: "25px",
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "16px",
          borderRadius: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        Sair
      </button>
    </div>
  );
}