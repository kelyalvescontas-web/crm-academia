"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  MdDashboard,
  MdEventNote,
  MdCalendarMonth,
  MdPeopleAlt,
  MdSettings,
  MdHistory,
  MdLogout,
  MdFitnessCenter,
  MdRestaurantMenu,
  MdEventAvailable,
  MdChat,
  MdClose,
  MdGroups,
  MdSend,
} from "react-icons/md";

import { FaBullseye, FaChartLine, FaTicketAlt } from "react-icons/fa";

type UsuarioOnline = {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  usuarioCargo?: string;
  fotoUrl?: string;
  unidadeId?: number;
  lastSeen?: string;
};

type ChatMensagem = {
  id: number;
  remetenteId: number;
  remetenteNome: string;
  remetenteFoto?: string;
  destinatarioId?: number;
  destinatarioNome?: string;
  grupo: boolean;
  grupoNome?: string;
  mensagem: string;
  createdAt: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [logo, setLogo] = useState("");
  const [corSistema, setCorSistema] = useState("#1e3a8a");
  const [usuario, setUsuario] = useState<any>(null);
  const [logoKedialErro, setLogoKedialErro] = useState(false);

  const [online, setOnline] = useState<UsuarioOnline[]>([]);
  const [chatAberto, setChatAberto] = useState(false);
  const [conversaSelecionada, setConversaSelecionada] = useState<UsuarioOnline | null>(null);
  const [grupoGeral, setGrupoGeral] = useState(false);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [textoMensagem, setTextoMensagem] = useState("");

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

  useEffect(() => {
    if (!usuario?.id) return;

    pingOnline();
    carregarOnline();

    const intervalo = setInterval(() => {
      pingOnline();
      carregarOnline();
    }, 25000);

    return () => clearInterval(intervalo);
  }, [usuario?.id]);

  useEffect(() => {
    if (!usuario?.id || !chatAberto) return;

    carregarMensagens();

    const intervalo = setInterval(carregarMensagens, 5000);

    return () => clearInterval(intervalo);
  }, [chatAberto, conversaSelecionada?.usuarioId, grupoGeral, usuario?.id]);

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

  async function pingOnline() {
    if (!usuario?.id) return;

    try {
      await fetch("/api/chat/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioCargo: usuario.cargo,
          fotoUrl: usuario.fotoUrl || "",
          unidadeId: usuario.unidadeId || null,
        }),
      });
    } catch (error) {
      console.log("Erro ao atualizar online:", error);
    }
  }

  async function carregarOnline() {
    try {
      const response = await fetch("/api/chat/online", { cache: "no-store" });
      const data = await response.json();

      if (Array.isArray(data)) {
        setOnline(data);
      }
    } catch (error) {
      console.log("Erro ao buscar usuários online:", error);
    }
  }

  function abrirConversa(usuarioOnline: UsuarioOnline) {
    setConversaSelecionada(usuarioOnline);
    setGrupoGeral(false);
    setChatAberto(true);
  }

  function abrirGrupoGeral() {
    setConversaSelecionada(null);
    setGrupoGeral(true);
    setChatAberto(true);
  }

  async function carregarMensagens() {
    if (!usuario?.id) return;

    try {
      const params = new URLSearchParams({
        usuarioId: String(usuario.id),
        grupo: String(grupoGeral),
      });

      if (conversaSelecionada?.usuarioId) {
        params.set("outroUsuarioId", String(conversaSelecionada.usuarioId));
      }

      const response = await fetch(`/api/chat/mensagens?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setMensagens(data);
      }
    } catch (error) {
      console.log("Erro ao buscar mensagens:", error);
    }
  }

  async function enviarMensagem() {
    if (!textoMensagem.trim() || !usuario?.id) return;

    try {
      const response = await fetch("/api/chat/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remetenteId: usuario.id,
          remetenteNome: usuario.nome,
          remetenteFoto: usuario.fotoUrl || "",
          destinatarioId: grupoGeral ? null : conversaSelecionada?.usuarioId,
          destinatarioNome: grupoGeral ? "" : conversaSelecionada?.usuarioNome,
          grupo: grupoGeral,
          grupoNome: grupoGeral ? "Grupo Geral" : "",
          mensagem: textoMensagem,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao enviar mensagem.");
        return;
      }

      setTextoMensagem("");
      carregarMensagens();
    } catch (error) {
      console.log(error);
      alert("Erro ao enviar mensagem.");
    }
  }

  function sair() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("unidadeSelecionadaId");
    localStorage.removeItem("metasPinLiberado");
    router.push("/login");
  }

  const cargo = String(usuario?.cargo || "").toUpperCase();

  const itemAgendaNutricionista = {
    nome: "Agenda Nutricionista",
    rota: "/agenda-nutricionista",
    icone: MdRestaurantMenu,
  };

  const itemAgendaPessoal = {
    nome: "Agenda Pessoal",
    rota: "/agenda-pessoal",
    icone: MdEventAvailable,
  };

  const itemMeuPerfil = {
    nome: "Meu Perfil",
    rota: "/usuarios",
    icone: MdPeopleAlt,
  };

  const menuAdmin = [
    { nome: "Dashboard", rota: "/", icone: MdDashboard },
    { nome: "Aulas Agendadas", rota: "/aulas", icone: MdEventNote },
    { nome: "Diárias", rota: "/diarias", icone: FaTicketAlt },
    { nome: "Calendário", rota: "/calendario", icone: MdCalendarMonth },
    itemAgendaNutricionista,
    itemAgendaPessoal,
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
    itemAgendaNutricionista,
    itemAgendaPessoal,
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
    itemAgendaNutricionista,
    itemAgendaPessoal,
    { nome: "Metas", rota: "/metas", icone: FaBullseye },
    { nome: "Usuários", rota: "/usuarios", icone: MdPeopleAlt },
  ];

  const menuInstrutor = [
    { nome: "Calendário", rota: "/calendario", icone: MdCalendarMonth },
    itemAgendaPessoal,
  ];

  const menuNutricionista = [itemAgendaNutricionista, itemAgendaPessoal, itemMeuPerfil];

  const menu =
    cargo === "NUTRICIONISTA"
      ? menuNutricionista
      : cargo === "INSTRUTOR"
      ? menuInstrutor
      : cargo === "ADMIN_GERAL"
      ? menuAdminGeral
      : cargo === "ADMIN"
      ? menuAdmin
      : menuColaboradora;

  const nomeUsuario = usuario?.nome?.split(" ")[0] || "Usuário";
  const fotoUsuario = usuario?.fotoUrl || "";
  const cargoFormatado = cargo ? cargo.replace("_", " ") : "";

  const onlineSemUsuarioAtual = useMemo(() => {
    return online.filter((item) => item.usuarioId !== usuario?.id);
  }, [online, usuario?.id]);

  return (
    <>
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
            <img src={logo} alt="Logo" className="w-[145px] h-auto object-contain" />
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

        <nav className="flex flex-col gap-2">
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

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-white/80">
              Usuários online
            </p>
            <button
              onClick={abrirGrupoGeral}
              className="rounded-lg bg-white/15 p-1 text-white hover:bg-white/25"
              title="Grupo Geral"
            >
              <MdGroups />
            </button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {onlineSemUsuarioAtual.length === 0 && (
              <p className="text-xs text-white/60">Nenhum outro usuário online.</p>
            )}

            {onlineSemUsuarioAtual.map((item) => (
              <button
                key={item.usuarioId}
                onClick={() => abrirConversa(item)}
                className="flex w-full items-center gap-2 rounded-xl bg-white/10 px-2 py-2 text-left hover:bg-white/20"
              >
                {item.fotoUrl ? (
                  <img
                    src={item.fotoUrl}
                    alt={item.usuarioNome}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-blue-900">
                    {item.usuarioNome?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{item.usuarioNome}</p>
                  <p className="text-[10px] text-green-200">● online</p>
                </div>

                <MdChat className="text-white/80" />
              </button>
            ))}
          </div>

          <button
            onClick={abrirGrupoGeral}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25"
          >
            <MdGroups />
            Grupo Geral
          </button>
        </div>

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

      {chatAberto && (
        <div className="fixed bottom-5 left-[250px] z-[9999] w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div>
              <p className="font-black">
                {grupoGeral ? "Grupo Geral" : conversaSelecionada?.usuarioNome || "Chat"}
              </p>
              <p className="text-xs text-white/70">
                {grupoGeral ? "Conversa com todos" : "Conversa individual"}
              </p>
            </div>

            <button onClick={() => setChatAberto(false)} className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
              <MdClose />
            </button>
          </div>

          <div className="h-[300px] space-y-3 overflow-y-auto bg-slate-50 p-4">
            {mensagens.length === 0 && (
              <p className="rounded-xl bg-white p-3 text-center text-sm text-slate-500">
                Nenhuma mensagem ainda.
              </p>
            )}

            {mensagens.map((msg) => {
              const minha = msg.remetenteId === usuario?.id;

              return (
                <div key={msg.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      minha ? "bg-blue-600 text-white" : "bg-white text-slate-900"
                    }`}
                  >
                    {!minha && (
                      <p className="mb-1 text-[11px] font-bold text-blue-700">
                        {msg.remetenteNome}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                    <p className={`mt-1 text-[10px] ${minha ? "text-white/70" : "text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 border-t bg-white p-3">
            <input
              value={textoMensagem}
              onChange={(e) => setTextoMensagem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviarMensagem();
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={enviarMensagem}
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              <MdSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
