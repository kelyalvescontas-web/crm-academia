"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  MdDashboard,
  MdEventNote,
  MdCalendarMonth,
  MdPeopleAlt,
  MdSettings,
  MdHistory,
  MdLogout,
  MdFitnessCenter,
} from "react-icons/md";

import {
  FaBullseye,
  FaChartLine,
  FaTicketAlt,
} from "react-icons/fa";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [logo, setLogo] = useState("");
  const [corSistema, setCorSistema] = useState("#1e3a8a");
  const [usuario, setUsuario] = useState<any>(null);
  const [logoKedialErro, setLogoKedialErro] = useState(false);

  useEffect(() => {
    carregarUsuarioLocal();
    carregarConfiguracoes();

    window.addEventListener("unidadeAlterada", carregarConfiguracoes);
    window.addEventListener("usuarioAtualizado", carregarUsuarioLocal);

    return () => {
      window.removeEventListener("unidadeAlterada", carregarConfiguracoes);
      window.removeEventListener("usuarioAtualizado", carregarUsuarioLocal);
    };
  }, []);

  function carregarUsuarioLocal() {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (usuarioSalvo) {
      const user = JSON.parse(usuarioSalvo);
      setUsuario(user);

      if (user.temaCor) {
        setCorSistema(user.temaCor);
      }
    }
  }

  async function carregarConfiguracoes() {
    const usuarioSalvo = localStorage.getItem("usuario");
    if (!usuarioSalvo) return;

    const usuarioAtual = JSON.parse(usuarioSalvo);

    if (usuarioAtual.temaCor) {
      setCorSistema(usuarioAtual.temaCor);
    }

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

    if (!usuarioAtual.temaCor) {
      setCorSistema(data.corSistema || "#1e3a8a");
    }
  }

  function sair() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("unidadeSelecionadaId");
    localStorage.removeItem("metasPinLiberado");
    router.push("/login");
  }

  const cargo = String(usuario?.cargo || "").toUpperCase();

  const menuAdmin = [
    { nome: "Dashboard", rota: "/", icone: MdDashboard },
    { nome: "Aulas Agendadas", rota: "/aulas", icone: MdEventNote },
    { nome: "Diárias", rota: "/diarias", icone: FaTicketAlt },
    { nome: "Calendário", rota: "/calendario", icone: MdCalendarMonth },
    { nome: "Metas", rota: "/metas", icone: FaBullseye },
    { nome: "Usuários", rota: "/usuarios", icone: MdPeopleAlt },
    { nome: "Relatórios", rota: "/relatorios", icone: FaChartLine },
    { nome: "Histórico", rota: "/historico", icone: MdHistory },
  ];

  const menuAdminGeral = [
    { nome: "Dashboard", rota: "/", icone: MdDashboard },
    { nome: "Aulas Agendadas", rota: "/aulas", icone: MdEventNote },
    { nome: "Diárias", rota: "/diarias", icone: FaTicketAlt },
    { nome: "Calendário", rota: "/calendario", icone: MdCalendarMonth },
    { nome: "Metas", rota: "/metas", icone: FaBullseye },
    { nome: "Usuários", rota: "/usuarios", icone: MdPeopleAlt },
    { nome: "Relatórios", rota: "/relatorios", icone: FaChartLine },
    { nome: "Histórico", rota: "/historico", icone: MdHistory },
    { nome: "Configurações", rota: "/configuracoes", icone: MdSettings },
  ];

  const menuColaboradora = [
    { nome: "Dashboard", rota: "/", icone: MdDashboard },
    { nome: "Aulas Agendadas", rota: "/aulas", icone: MdEventNote },
    { nome: "Diárias", rota: "/diarias", icone: FaTicketAlt },
    { nome: "Calendário", rota: "/calendario", icone: MdCalendarMonth },
    { nome: "Metas", rota: "/metas", icone: FaBullseye },
    { nome: "Usuários", rota: "/usuarios", icone: MdPeopleAlt },
  ];

  const menuInstrutor = [
    { nome: "Calendário", rota: "/calendario", icone: MdCalendarMonth },
  ];

  const menu =
    cargo === "INSTRUTOR"
      ? menuInstrutor
      : cargo === "ADMIN_GERAL"
      ? menuAdminGeral
      : cargo === "ADMIN"
      ? menuAdmin
      : menuColaboradora;

  const nomeUsuario = usuario?.nome?.split(" ")[0] || "Usuário";
  const fotoUsuario = usuario?.fotoUrl || "";
  const cargoFormatado = cargo ? cargo.replace("_", " ") : "";

  return (
    <aside
      className="min-h-screen text-white flex flex-col shadow-2xl"
      style={{
        width: "230px",
        background: `linear-gradient(180deg, ${corSistema} 0%, #0f172a 100%)`,
        padding: "18px 14px",
      }}
    >
      <div className="flex justify-center items-center mb-5 mt-2">
        {logo ? (
          <img
            src={logo}
            alt="Logo"
            className="w-[145px] h-auto object-contain"
          />
        ) : (
          <div className="text-center">
            <MdFitnessCenter className="text-5xl mx-auto mb-2" />
            <h1 className="text-xl font-bold">Kedial Performance</h1>
          </div>
        )}
      </div>

      <div className="bg-white/10 border border-white/20 rounded-3xl p-4 mb-5 text-center">
        {fotoUsuario ? (
          <img
            src={fotoUsuario}
            alt={nomeUsuario}
            className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-white shadow"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white text-blue-900 flex items-center justify-center mx-auto text-2xl font-black shadow">
            {nomeUsuario.charAt(0).toUpperCase()}
          </div>
        )}

        <p className="text-xs text-white/70 mt-3">Olá,</p>
        <p className="font-black text-lg leading-tight">{nomeUsuario}!</p>
        <p className="text-[11px] uppercase tracking-wide text-white/70 mt-1">
          {cargoFormatado}
        </p>

        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-green-200">
          <span className="w-2 h-2 bg-green-300 rounded-full" />
          Online
        </div>
      </div>

      <nav className="flex flex-col flex-1 gap-2">
        {menu.map((item) => {
          const ativo =
            pathname === item.rota ||
            (item.rota !== "/" && pathname.startsWith(item.rota));

          const Icone = item.icone;

          return (
            <Link
              key={item.rota}
              href={item.rota}
              className={`flex items-center gap-3 rounded-2xl transition-all duration-200 ${
                ativo
                  ? "bg-white shadow-lg scale-[1.02]"
                  : "hover:bg-white/15 hover:translate-x-1"
              }`}
              style={{
                color: ativo ? corSistema : "white",
                fontSize: "15px",
                padding: "12px 13px",
                fontWeight: ativo ? 800 : 600,
              }}
            >
              <Icone className="text-[22px] shrink-0" />
              <span>{item.nome}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/25 pt-4 mt-4 text-center">
        {!logoKedialErro ? (
          <img
            src="/kedial-logo.png"
            alt="KediAl Tecnologia"
            onError={() => setLogoKedialErro(true)}
            className="w-[135px] h-auto object-contain mx-auto opacity-90"
          />
        ) : (
          <div className="text-white/90">
            <div className="font-bold text-lg">KediAl</div>
            <div className="text-sm tracking-widest">Tecnologia</div>
          </div>
        )}
      </div>

      <button
        onClick={sair}
        className="mt-5 bg-red-600 hover:bg-red-700 text-white border-none rounded-2xl font-bold cursor-pointer text-sm py-3 flex items-center justify-center gap-2 shadow-lg transition-all"
      >
        <MdLogout className="text-xl" />
        Sair
      </button>
    </aside>
  );
}
