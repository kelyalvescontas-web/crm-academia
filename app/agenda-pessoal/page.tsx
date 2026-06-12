"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  MdAdd,
  MdCalendarMonth,
  MdCheckCircle,
  MdClose,
  MdDelete,
  MdEdit,
  MdNotificationsActive,
  MdOutlineAccessTime,
  MdPersonAddAlt,
  MdTaskAlt,
} from "react-icons/md";
import { FaUserClock } from "react-icons/fa";

type Usuario = {
  id: number;
  nome: string;
  cargo?: string;
  unidadeId?: number;
};

type AgendaItem = {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: "EVENTO" | "REUNIAO" | "TAREFA" | "LEMBRETE";
  dataInicio: string;
  horaInicio?: string;
  dataFim?: string;
  horaFim?: string;
  diaInteiro: boolean;
  status: "PENDENTE" | "ACEITO" | "RECUSADO" | "CONCLUIDO" | "REAGENDADO";
  prioridade: "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
  criadoPorId?: number;
  criadoPorNome?: string;
  responsavelId?: number;
  responsavelNome?: string;
  compartilhado: boolean;
  usuariosCompartilhados?: string;
  unidadeId?: number;
  createdAt?: string;
  updatedAt?: string;
  compartilhamentos?: any[];
};

type Notificacao = {
  id: number;
  usuarioId: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  agendaId?: number;
  createdAt: string;
};

const hojeISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

function formatarData(data?: string) {
  if (!data) return "-";
  if (data.includes("/")) return data;
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function nomeDia(data: string) {
  const nomes = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  const d = new Date(data + "T00:00:00");
  return nomes[d.getDay()];
}

function mesAtual() {
  return hojeISO().slice(0, 7);
}

function labelTipo(tipo: string) {
  const t = String(tipo || "").toUpperCase();
  if (t === "REUNIAO") return "Reunião";
  if (t === "TAREFA") return "Tarefa";
  if (t === "LEMBRETE") return "Lembrete";
  return "Evento";
}

function iconeTipo(tipo: string) {
  const t = String(tipo || "").toUpperCase();
  if (t === "REUNIAO") return "👥";
  if (t === "TAREFA") return "📋";
  if (t === "LEMBRETE") return "🔔";
  return "📅";
}

function corTipo(tipo: string, status?: string, prioridade?: string) {
  if (status === "CONCLUIDO") return "bg-emerald-50 border-emerald-300 text-emerald-900";
  if (status === "RECUSADO") return "bg-slate-100 border-slate-300 text-slate-600";
  if (prioridade === "URGENTE") return "bg-red-50 border-red-300 text-red-900";

  const t = String(tipo || "").toUpperCase();
  if (t === "REUNIAO") return "bg-purple-50 border-purple-300 text-purple-900";
  if (t === "TAREFA") return "bg-orange-50 border-orange-300 text-orange-900";
  if (t === "LEMBRETE") return "bg-yellow-50 border-yellow-300 text-yellow-900";
  return "bg-blue-50 border-blue-300 text-blue-900";
}

const vazioForm = {
  titulo: "",
  descricao: "",
  tipo: "EVENTO",
  dataInicio: hojeISO(),
  horaInicio: "08:00",
  dataFim: hojeISO(),
  horaFim: "09:00",
  diaInteiro: false,
  prioridade: "NORMAL",
  responsavelId: "",
  compartilhadosIds: [] as number[],
};

export default function AgendaPessoalPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [itens, setItens] = useState<AgendaItem[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(hojeISO());
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<AgendaItem | null>(null);
  const [form, setForm] = useState<any>(vazioForm);
  const [toast, setToast] = useState<Notificacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(salvo);
    setUsuario(user);
    carregarUsuarios(user);
    carregarAgenda(user, dataSelecionada, mesSelecionado);
    carregarNotificacoes(user);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    carregarAgenda(usuario, dataSelecionada, mesSelecionado);
  }, [dataSelecionada, mesSelecionado, usuario?.id]);

  useEffect(() => {
    if (!usuario) return;

    const intervalo = setInterval(() => {
      carregarNotificacoes(usuario);
      verificarLembretes();
    }, 30000);

    return () => clearInterval(intervalo);
  }, [usuario, itens]);

  async function carregarUsuarios(user: Usuario) {
    try {
      const params = new URLSearchParams({
        usuarioId: String(user.id),
        usuarioCargo: String(user.cargo || ""),
      });

      const resp = await fetch(`/api/usuarios?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await resp.json();
      if (Array.isArray(data)) setUsuarios(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function carregarAgenda(user: Usuario, data: string, mes: string) {
    try {
      setCarregando(true);

      const params = new URLSearchParams({
        usuarioId: String(user.id),
        usuarioNome: String(user.nome || ""),
        usuarioCargo: String(user.cargo || ""),
        unidadeId: String(user.unidadeId || localStorage.getItem("unidadeSelecionadaId") || ""),
        data,
        mes,
      });

      const resp = await fetch(`/api/agenda-pessoal?${params.toString()}`, {
        cache: "no-store",
      });

      const dataResp = await resp.json();

      if (!resp.ok || dataResp.error) {
        alert(dataResp.detalhe || dataResp.error || "Erro ao carregar agenda pessoal.");
        return;
      }

      if (Array.isArray(dataResp)) {
        setItens(dataResp);
      } else {
        setItens([]);
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao carregar agenda pessoal.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarNotificacoes(user: Usuario) {
    try {
      const resp = await fetch(`/api/agenda-pessoal/notificacoes?usuarioId=${user.id}`, {
        cache: "no-store",
      });

      const data = await resp.json();

      if (Array.isArray(data)) {
        setNotificacoes(data);
        const primeiraNaoLida = data.find((n: Notificacao) => !n.lida);
        if (primeiraNaoLida) setToast(primeiraNaoLida);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function abrirNovo(tipo = "EVENTO") {
    const inicio = dataSelecionada || hojeISO();
    setEditando(null);
    setForm({
      ...vazioForm,
      tipo,
      dataInicio: inicio,
      dataFim: inicio,
      responsavelId: usuario?.id ? String(usuario.id) : "",
    });
    setModalAberto(true);
  }

  function abrirEditar(item: AgendaItem) {
    setEditando(item);
    setForm({
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      tipo: item.tipo || "EVENTO",
      dataInicio: item.dataInicio || hojeISO(),
      horaInicio: item.horaInicio || "08:00",
      dataFim: item.dataFim || item.dataInicio || hojeISO(),
      horaFim: item.horaFim || "09:00",
      diaInteiro: Boolean(item.diaInteiro),
      prioridade: item.prioridade || "NORMAL",
      responsavelId: item.responsavelId ? String(item.responsavelId) : String(usuario?.id || ""),
      compartilhadosIds: String(item.usuariosCompartilhados || "")
        .split(",")
        .map((x) => Number(x.trim()))
        .filter(Boolean),
    });
    setModalAberto(true);
  }

  function temConflito() {
    if (form.diaInteiro || !form.horaInicio || !form.horaFim) return null;

    const novoInicio = form.horaInicio;
    const novoFim = form.horaFim;

    return itens.find((item) => {
      if (editando && item.id === editando.id) return false;
      if (item.status === "RECUSADO" || item.status === "CONCLUIDO") return false;
      if (item.diaInteiro) return item.dataInicio === form.dataInicio;
      if (item.dataInicio !== form.dataInicio) return false;

      const inicioExistente = item.horaInicio || "00:00";
      const fimExistente = item.horaFim || "23:59";

      return novoInicio < fimExistente && novoFim > inicioExistente;
    });
  }

  async function salvarAgenda() {
    if (!usuario) return;
    if (salvando) return;
    setSalvando(true);

    if (!form.titulo.trim()) {
      alert("Informe o título.");
      setSalvando(false);
      return;
    }

    if (!form.dataInicio) {
      alert("Informe a data.");
      setSalvando(false);
      return;
    }

    if (!form.diaInteiro && (!form.horaInicio || !form.horaFim)) {
      alert("Informe horário inicial e final.");
      setSalvando(false);
      return;
    }

    if (!form.diaInteiro && form.horaFim <= form.horaInicio) {
      alert("O horário final precisa ser maior que o inicial.");
      setSalvando(false);
      return;
    }

    const conflito = temConflito();

    if (conflito) {
      const continuar = confirm(
        `⚠ Conflito de horário\n\nVocê já possui:\n${conflito.titulo}\n${formatarData(conflito.dataInicio)} ${conflito.horaInicio || ""} às ${conflito.horaFim || ""}\n\nDeseja salvar mesmo assim?`
      );

      if (!continuar) {
        setSalvando(false);
        return;
      }
    }

    const responsavel = usuarios.find((u) => Number(u.id) === Number(form.responsavelId));

    const compartilhadosLimpos = Array.from(
      new Set(
        (form.compartilhadosIds || [])
          .map((id: any) => Number(id))
          .filter((id: number) => id && id !== Number(usuario.id) && id !== Number(form.responsavelId))
      )
    );

    const payload = {
      id: editando?.id,
      titulo: form.titulo.trim(),
      descricao: form.descricao || "",
      tipo: form.tipo,
      dataInicio: form.dataInicio,
      horaInicio: form.diaInteiro ? "" : form.horaInicio,
      dataFim: form.dataFim || form.dataInicio,
      horaFim: form.diaInteiro ? "" : form.horaFim,
      diaInteiro: Boolean(form.diaInteiro),
      prioridade: form.prioridade,
      responsavelId: responsavel?.id || usuario.id,
      responsavelNome: responsavel?.nome || usuario.nome,
      compartilhadosIds: compartilhadosLimpos,
      compartilhado: compartilhadosLimpos.length > 0,
      unidadeId: Number(usuario.unidadeId || localStorage.getItem("unidadeSelecionadaId") || 0) || null,

      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioCargo: usuario.cargo || "",
    };

    const resp = await fetch("/api/agenda-pessoal", {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || data.error) {
      alert(data.error || "Erro ao salvar agenda.");
      setSalvando(false);
      return;
    }

    setModalAberto(false);
    await carregarAgenda(usuario, dataSelecionada, mesSelecionado);
    await carregarNotificacoes(usuario);
    setSalvando(false);
  }

  async function alterarStatus(item: AgendaItem, status: string) {
    if (!usuario) return;

    const resp = await fetch("/api/agenda-pessoal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        status,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioCargo: usuario.cargo || "",
      }),
    });

    const data = await resp.json();

    if (!resp.ok || data.error) {
      alert(data.error || "Erro ao alterar status.");
      return;
    }

    await carregarAgenda(usuario, dataSelecionada, mesSelecionado);
  }

  async function excluirAgenda(id: number) {
    if (!usuario) return;
    if (!confirm("Deseja excluir este item da agenda?")) return;

    const resp = await fetch("/api/agenda-pessoal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioCargo: usuario.cargo || "",
      }),
    });

    const data = await resp.json();

    if (!resp.ok || data.error) {
      alert(data.error || "Erro ao excluir.");
      return;
    }

    await carregarAgenda(usuario, dataSelecionada, mesSelecionado);
  }

  async function marcarNotificacaoLida(id: number) {
    if (!usuario) return;

    await fetch("/api/agenda-pessoal/notificacoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, usuarioId: usuario.id }),
    });

    setToast(null);
    carregarNotificacoes(usuario);
  }

  function verificarLembretes() {
    if (!usuario) return;

    const agora = new Date();

    const alvo = itens.find((item) => {
      if (item.status === "CONCLUIDO" || item.status === "RECUSADO") return false;
      if (item.diaInteiro || !item.horaInicio) return false;

      const dataHora = new Date(`${item.dataInicio}T${item.horaInicio}:00`);
      const diferencaMs = dataHora.getTime() - agora.getTime();

      return diferencaMs > 0 && diferencaMs <= 30 * 60 * 1000;
    });

    if (alvo && !toast) {
      setToast({
        id: 0,
        usuarioId: usuario.id,
        titulo: `Lembrete: ${alvo.titulo}`,
        mensagem: `${labelTipo(alvo.tipo)} começa em até 30 minutos.`,
        lida: false,
        agendaId: alvo.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  function adiarLembrete(minutos: number) {
    setToast(null);
    setTimeout(() => {
      verificarLembretes();
    }, minutos * 60 * 1000);
  }

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      const texto = `${item.titulo} ${item.descricao} ${item.responsavelNome} ${item.criadoPorNome}`.toUpperCase();

      if (busca.trim() && !texto.includes(busca.trim().toUpperCase())) return false;
      if (filtroTipo !== "TODOS" && item.tipo !== filtroTipo) return false;
      if (filtroStatus !== "TODOS" && item.status !== filtroStatus) return false;

      return true;
    });
  }, [itens, busca, filtroTipo, filtroStatus]);

  const itensDoDia = itensFiltrados.filter((item) => item.dataInicio === dataSelecionada);

  const resumo = {
    compromissos: itens.filter((i) => i.dataInicio === dataSelecionada && i.tipo !== "TAREFA").length,
    tarefas: itens.filter((i) => i.dataInicio === dataSelecionada && i.tipo === "TAREFA" && i.status !== "CONCLUIDO").length,
    atrasadas: itens.filter((i) => i.tipo === "TAREFA" && i.status !== "CONCLUIDO" && i.dataInicio < hojeISO()).length,
    compartilhados: itens.filter((i) => i.compartilhado || i.criadoPorId !== usuario?.id).length,
  };

  const tarefasPendentes = itensFiltrados.filter((i) => i.tipo === "TAREFA" && i.status !== "CONCLUIDO");
  const compartilhados = itensFiltrados.filter((i) => i.compartilhado || i.criadoPorId !== usuario?.id);

  return (
    <main className="min-h-screen flex bg-slate-100 text-slate-900">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="mb-6 rounded-3xl bg-slate-950 px-6 py-5 text-white shadow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">Agenda Pessoal</h1>
              <p className="text-sm text-white/75">
                Organize seus compromissos, tarefas, reuniões e lembretes privados.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => abrirNovo("EVENTO")}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow hover:bg-blue-700"
              >
                <MdAdd className="mr-1 inline text-xl" />
                Novo Evento
              </button>

              <button
                onClick={() => abrirNovo("TAREFA")}
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow hover:bg-emerald-700"
              >
                <MdTaskAlt className="mr-1 inline text-xl" />
                Nova Tarefa
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardResumo icone="📅" titulo="Compromissos Hoje" valor={resumo.compromissos} cor="blue" />
          <CardResumo icone="📋" titulo="Tarefas Pendentes" valor={resumo.tarefas} cor="orange" />
          <CardResumo icone="⚠️" titulo="Tarefas Atrasadas" valor={resumo.atrasadas} cor="red" />
          <CardResumo icone="👥" titulo="Compartilhados" valor={resumo.compartilhados} cor="purple" />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
          <section className="rounded-3xl bg-white p-5 shadow ring-1 ring-slate-200">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
              <MdCalendarMonth className="text-blue-600" />
              Calendário
            </h2>

            <label className="mb-4 block">
              <span className="mb-2 block text-xs font-black uppercase text-slate-500">
                Dia selecionado
              </span>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => {
                  setDataSelecionada(e.target.value);
                  setMesSelecionado(e.target.value.slice(0, 7));
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase text-slate-500">
                Mês
              </span>
              <input
                type="month"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
            </label>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-blue-900 ring-1 ring-blue-100">
              <p className="font-black">{nomeDia(dataSelecionada)}</p>
              <p className="text-2xl font-black">{formatarData(dataSelecionada)}</p>
              <p className="mt-2 text-sm text-blue-700">
                {itensDoDia.length} item(ns) nesta data.
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow ring-1 ring-slate-200">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-xl font-black">Minha Agenda do Dia</h2>
                <p className="text-sm text-slate-500">
                  Eventos privados e compartilhados com você.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar..."
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-500"
                />

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-500"
                >
                  <option value="TODOS">Todos os tipos</option>
                  <option value="EVENTO">Evento</option>
                  <option value="REUNIAO">Reunião</option>
                  <option value="TAREFA">Tarefa</option>
                  <option value="LEMBRETE">Lembrete</option>
                </select>

                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-500"
                >
                  <option value="TODOS">Todos os status</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="ACEITO">Aceito</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="RECUSADO">Recusado</option>
                </select>
              </div>
            </div>

            {carregando ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center font-bold text-slate-500">
                Carregando agenda...
              </div>
            ) : itensDoDia.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-4xl">🗓️</p>
                <p className="mt-2 font-black text-slate-700">Nenhum compromisso neste dia.</p>
                <p className="text-sm text-slate-500">
                  Clique em Novo Evento ou Nova Tarefa para cadastrar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {itensDoDia
                  .sort((a, b) => String(a.horaInicio || "00:00").localeCompare(String(b.horaInicio || "00:00")))
                  .map((item) => (
                    <AgendaCard
                      key={item.id}
                      item={item}
                      usuario={usuario}
                      onEditar={() => abrirEditar(item)}
                      onExcluir={() => excluirAgenda(item.id)}
                      onConcluir={() => alterarStatus(item, "CONCLUIDO")}
                      onAceitar={() => alterarStatus(item, "ACEITO")}
                      onRecusar={() => alterarStatus(item, "RECUSADO")}
                    />
                  ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-3xl bg-amber-50 p-5 shadow ring-1 ring-amber-200">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-amber-900">
              <FaUserClock />
              Minhas Tarefas
            </h2>
            <p className="mb-4 text-sm text-amber-800">
              Tarefas próprias ou delegadas para você.
            </p>

            <div className="space-y-3">
              {tarefasPendentes.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                  Nenhuma tarefa pendente.
                </p>
              ) : (
                tarefasPendentes.slice(0, 6).map((item) => (
                  <MiniLinha
                    key={item.id}
                    item={item}
                    onAbrir={() => abrirEditar(item)}
                    onConcluir={() => alterarStatus(item, "CONCLUIDO")}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-purple-50 p-5 shadow ring-1 ring-purple-200">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-purple-900">
              <MdPersonAddAlt />
              Compartilhados comigo
            </h2>
            <p className="mb-4 text-sm text-purple-800">
              Eventos, reuniões e tarefas compartilhadas.
            </p>

            <div className="space-y-3">
              {compartilhados.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                  Nenhum item compartilhado.
                </p>
              ) : (
                compartilhados.slice(0, 6).map((item) => (
                  <MiniLinha
                    key={item.id}
                    item={item}
                    onAbrir={() => abrirEditar(item)}
                    onConcluir={() => alterarStatus(item, "CONCLUIDO")}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      {modalAberto && (
        <ModalAgenda
          salvando={salvando}
          form={form}
          setForm={setForm}
          usuarios={usuarios}
          editando={editando}
          onFechar={() => setModalAberto(false)}
          onSalvar={salvarAgenda}
        />
      )}

      {toast && (
        <div className="fixed right-5 top-5 z-[9999] w-[360px] rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-blue-200">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <MdNotificationsActive className="text-blue-600" />
                {toast.titulo}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{toast.mensagem}</p>
            </div>

            <button onClick={() => setToast(null)} className="rounded-full bg-slate-100 p-2 text-slate-600">
              <MdClose />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {toast.agendaId ? (
              <button
                onClick={() => {
                  const item = itens.find((i) => i.id === toast.agendaId);
                  if (item) abrirEditar(item);
                  if (toast.id) marcarNotificacaoLida(toast.id);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white"
              >
                Ver agora
              </button>
            ) : null}

            <button
              onClick={() => toast.id ? marcarNotificacaoLida(toast.id) : setToast(null)}
              className="rounded-xl border px-4 py-2 text-sm font-black"
            >
              Ver depois
            </button>

            <button
              onClick={() => adiarLembrete(5)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black"
            >
              Adiar 5 min
            </button>

            <button
              onClick={() => adiarLembrete(15)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black"
            >
              Adiar 15 min
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CardResumo({ icone, titulo, valor, cor }: any) {
  const cores: any = {
    blue: "border-blue-500 bg-blue-50 text-blue-800",
    orange: "border-orange-500 bg-orange-50 text-orange-800",
    red: "border-red-500 bg-red-50 text-red-800",
    purple: "border-purple-500 bg-purple-50 text-purple-800",
  };

  return (
    <div className={`rounded-3xl border-l-4 p-5 shadow ring-1 ring-slate-200 ${cores[cor]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-black">{titulo}</p>
          <p className="mt-3 text-4xl font-black">{valor}</p>
        </div>
        <span className="text-3xl">{icone}</span>
      </div>
    </div>
  );
}

function AgendaCard({ item, usuario, onEditar, onExcluir, onConcluir, onAceitar, onRecusar }: any) {
  const criadoPorOutro = item.criadoPorId && usuario?.id && Number(item.criadoPorId) !== Number(usuario.id);

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${corTipo(item.tipo, item.status, item.prioridade)}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{iconeTipo(item.tipo)}</span>
            <h3 className="text-lg font-black">{item.titulo}</h3>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">
              {labelTipo(item.tipo)}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">
              {item.status}
            </span>
            {item.prioridade === "URGENTE" && (
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                URGENTE
              </span>
            )}
          </div>

          <p className="mt-2 text-sm opacity-80">
            <MdOutlineAccessTime className="mr-1 inline" />
            {formatarData(item.dataInicio)}{" "}
            {item.diaInteiro ? "Dia inteiro" : `${item.horaInicio || "--:--"} às ${item.horaFim || "--:--"}`}
          </p>

          {item.descricao ? <p className="mt-2 text-sm">{item.descricao}</p> : null}

          <p className="mt-2 text-xs font-bold opacity-75">
            Criado por: {item.criadoPorNome || "-"} · Responsável: {item.responsavelNome || "-"}
            {criadoPorOutro ? " · Compartilhado com você" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.status === "PENDENTE" && criadoPorOutro ? (
            <>
              <button onClick={onAceitar} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white">
                Aceitar
              </button>
              <button onClick={onRecusar} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white">
                Recusar
              </button>
            </>
          ) : null}

          {item.status !== "CONCLUIDO" && item.tipo === "TAREFA" ? (
            <button onClick={onConcluir} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-black text-white">
              <MdCheckCircle className="inline" /> Concluir
            </button>
          ) : null}

          <button onClick={onEditar} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700">
            <MdEdit className="inline" /> Editar
          </button>

          <button onClick={onExcluir} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-red-600">
            <MdDelete className="inline" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniLinha({ item, onAbrir, onConcluir }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div>
        <p className="font-black">
          {iconeTipo(item.tipo)} {item.titulo}
        </p>
        <p className="text-xs text-slate-500">
          {formatarData(item.dataInicio)} · {item.diaInteiro ? "Dia inteiro" : `${item.horaInicio || "--:--"} às ${item.horaFim || "--:--"}`} · {item.status}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={onAbrir} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">
          Abrir
        </button>

        {item.tipo === "TAREFA" && item.status !== "CONCLUIDO" ? (
          <button onClick={onConcluir} className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-700">
            Feita
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModalAgenda({ salvando, form, setForm, usuarios, editando, onFechar, onSalvar }: any) {
  function toggleCompartilhado(id: number) {
    const atual = Array.isArray(form.compartilhadosIds) ? form.compartilhadosIds : [];

    setForm({
      ...form,
      compartilhadosIds: atual.includes(id)
        ? atual.filter((x: number) => x !== id)
        : [...atual, id],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black">
              {editando ? "Editar item da agenda" : "Novo item da agenda"}
            </h2>
            <p className="text-sm text-slate-500">
              Cadastre compromisso, reunião, lembrete ou tarefa.
            </p>
          </div>

          <button onClick={onFechar} className="rounded-full bg-slate-100 p-3 text-slate-700">
            <MdClose />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block font-black">Título</span>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex.: Reunião com Gerencial"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>

          <label>
            <span className="mb-2 block font-black">Tipo</span>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="EVENTO">📅 Evento</option>
              <option value="REUNIAO">👥 Reunião</option>
              <option value="TAREFA">📋 Tarefa</option>
              <option value="LEMBRETE">🔔 Lembrete</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block font-black">Prioridade</span>
            <select
              value={form.prioridade}
              onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block font-black">Data início</span>
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => setForm({ ...form, dataInicio: e.target.value, dataFim: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>

          <label>
            <span className="mb-2 block font-black">Data final</span>
            <input
              type="date"
              value={form.dataFim}
              onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <input
              type="checkbox"
              checked={Boolean(form.diaInteiro)}
              onChange={(e) => setForm({ ...form, diaInteiro: e.target.checked })}
            />
            <span className="font-black">Dia inteiro</span>
          </label>

          <div />

          {!form.diaInteiro && (
            <>
              <label>
                <span className="mb-2 block font-black">Hora início</span>
                <input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>

              <label>
                <span className="mb-2 block font-black">Hora final</span>
                <input
                  type="time"
                  value={form.horaFim}
                  onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
            </>
          )}

          <label className="md:col-span-2">
            <span className="mb-2 block font-black">Responsável</span>
            <select
              value={form.responsavelId}
              onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione</option>
              {usuarios.filter((u: Usuario) => Number(u.id) !== Number(form.responsavelId)).map((u: Usuario) => (
                <option key={u.id} value={u.id}>
                  {u.nome} {u.cargo ? `- ${u.cargo}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block font-black">Descrição</span>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={4}
              placeholder="Detalhes, observações ou instruções..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="mt-5 rounded-3xl bg-purple-50 p-5 ring-1 ring-purple-200">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-black text-purple-900">
            <MdPersonAddAlt />
            Compartilhar com usuários
          </h3>
          <p className="mb-4 text-sm text-purple-800">
            Selecione quem também verá este evento/tarefa na própria agenda.
          </p>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {usuarios.filter((u: Usuario) => Number(u.id) !== Number(form.responsavelId)).map((u: Usuario) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleCompartilhado(u.id)}
                className={
                  form.compartilhadosIds?.includes(u.id)
                    ? "rounded-2xl bg-purple-600 px-4 py-3 text-left font-black text-white"
                    : "rounded-2xl bg-white px-4 py-3 text-left font-black text-slate-700 ring-1 ring-purple-100"
                }
              >
                {form.compartilhadosIds?.includes(u.id) ? "✓ " : ""}
                {u.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onFechar} className="rounded-2xl border px-6 py-3 font-black">
            Cancelar
          </button>

          <button
            onClick={onSalvar}
            disabled={salvando}
            className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
