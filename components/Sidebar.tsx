"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [logo, setLogo] = useState("");
  const [corSistema, setCorSistema] = useState("#1e3a8a");
  const [usuario, setUsuario] = useState<any>(null);
  const [logoKedialErro, setLogoKedialErro] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }

    carregarConfiguracoes();

    window.addEventListener("unidadeAlterada", carregarConfiguracoes);

    return () => {
      window.removeEventListener("unidadeAlterada", carregarConfiguracoes);
    };
  }, []);

  async function carregarConfiguracoes() {
    const usuarioSalvo = localStorage.getItem("usuario");
    if (!usuarioSalvo) return;

    const usuarioAtual = JSON.parse(usuarioSalvo);

    const unidadeId =
      usuarioAtual.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : String(usuarioAtual.unidadeId || "");

    if (!unidadeId) return;

    const response = await fetch(`/api/configuracoes?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    if (!response.ok) return;

    const data = await response.json();

    setLogo(data.logo || "");
    setCorSistema(data.corSistema || "#1e3a8a");
  }

  function sair() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("unidadeSelecionadaId");
    router.push("/login");
  }

  const cargo = String(usuario?.cargo || "").toUpperCase();

  const menuAdmin = [
    { nome: "Dashboard", rota: "/" },
    { nome: "Aulas Agendadas", rota: "/aulas" },
    { nome: "Diárias", rota: "/diarias" },
    { nome: "Calendário", rota: "/calendario" },
    { nome: "Usuários", rota: "/usuarios" },
    { nome: "Relatórios", rota: "/relatorios" },
    { nome: "Configurações", rota: "/configuracoes" },
  ];

  const menuAdminGeral = [
    { nome: "Dashboard", rota: "/" },
    { nome: "Aulas Agendadas", rota: "/aulas" },
    { nome: "Diárias", rota: "/diarias" },
    { nome: "Calendário", rota: "/calendario" },
    { nome: "Usuários", rota: "/usuarios" },
    { nome: "Relatórios", rota: "/relatorios" },
    { nome: "Histórico", rota: "/historico" },
    { nome: "Configurações", rota: "/configuracoes" },
  ];

  const menuInstrutor = [
    { nome: "Calendário", rota: "/calendario" },
    { nome: "Usuários", rota: "/usuarios" },
  ];

  const menu =
    cargo === "INSTRUTOR"
      ? menuInstrutor
      : cargo === "ADMIN_GERAL"
      ? menuAdminGeral
      : menuAdmin;

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        width: "190px",
        background: corSistema,
        padding: "18px 12px",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "28px",
          marginTop: "8px",
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt="Logo"
            style={{
              width: "130px",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <h1 className="text-xl font-bold text-center">CRM Academia</h1>
        )}
      </div>

      <div className="flex flex-col flex-1" style={{ gap: "8px" }}>
        {menu.map((item) => (
          <Link
            key={item.rota}
            href={item.rota}
            className={`rounded-xl transition-all duration-200 ${
              pathname === item.rota ? "bg-white font-bold" : "hover:bg-blue-800"
            }`}
            style={{
              color: pathname === item.rota ? corSistema : "white",
              fontSize: "15px",
              padding: "10px 12px",
              lineHeight: "1.2",
            }}
          >
            {item.nome}
          </Link>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.25)",
          paddingTop: "12px",
          marginTop: "12px",
          textAlign: "center",
        }}
      >
        {!logoKedialErro ? (
          <img
            src="/kedial-logo.png"
            alt="KediAl Tecnologia"
            onError={() => setLogoKedialErro(true)}
            style={{
              width: "135px",
              height: "auto",
              objectFit: "contain",
              margin: "0 auto",
              display: "block",
            }}
          />
        ) : (
          <div>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>KediAl</div>
            <div style={{ fontSize: "14px" }}>Tecnologia</div>
          </div>
        )}
      </div>

      <button
        onClick={sair}
        style={{
          marginTop: "18px",
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "10px",
          borderRadius: "12px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Sair
      </button>
    </div>
  );
}