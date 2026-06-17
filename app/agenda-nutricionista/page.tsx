"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";

type Documento = {
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string;
};

type Agendamento = {
  id: string;
  nome: string;
  telefone: string;
  matricula: string;
  unidade: string;
  dataConsulta: string;
  horaConsulta: string;
  tipoConsulta: string;
  statusPresenca: string;
  statusPagamento: string;
  quemAgendou: string;
  tipoAtendimento: string[];
  diasRetorno: string;
  dataRetorno: string;
  horaRetorno?: string;
  cardapioPronto: boolean;
  cardapioEnviado: boolean;
  bioPronta: boolean;
  bioEnviada: boolean;
  cardapioArquivo?: Documento | null;
  bioArquivo?: Documento | null;
  observacoes?: string;
  converteuPlanoPago?: boolean;
  planoConvertido?: string;
  dataConversao?: string;
  vendedoraConversao?: string;
  createdAt: string;
};

type ConfigAgenda = {
  horarios: string[];
  aviso: string;
  bloqueios: { id: string; data: string; tipo: string; motivo: string; horariosLiberados: string[] }[];
};

type MensagemChat = {
  id: string;
  nome: string;
  texto: string;
  hora: string;
  createdAt: string;
};

const STORAGE_AGENDAMENTOS = "prix_nutri_agendamentos";
const STORAGE_CONFIG = "prix_nutri_config";
const STORAGE_CHAT = "prix_nutri_chat";

const horariosPadrao = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "18:15", "18:45", "19:15", "19:45", "20:15", "20:45"];

const mensagensNutriPadrao: any = {
  mensagemNutriConfirmacao:
    "Olá, {aluno}! Tudo bem?\nPosso confirmar sua consulta com nossa nutricionista, dia *{data}* ({diaSemana}) às *{horario}hs*?\n\nLembrando que a *tolerância de atraso é 10 minutos*, caso não consiga comparecer pedimos que avise com no mínimo 3 horas de antecedência, caso contrário a consulta será dada como feita.\n\n*Não é recomendado fazer exercícios físicos antes da consulta!*",
  mensagemNutriCardapio:
    "Olá, {aluno}! Tudo bem?\nEstou te enviando o seu *cardápio* referente à consulta realizada em *{data}*.\n\nLembre-se: cada pequena escolha feita hoje é um passo em direção aos seus objetivos. Mantenha o foco, confie no processo e conte conosco nessa jornada de transformação!\n\nQualquer dúvida, estou à disposição para ajudar.\nAtenciosamente,\n{academia}",
  mensagemNutriBio:
    "Olá, {aluno}!\nSegue em anexo sua *Avaliação de Bioimpedância* referente ao atendimento do dia *{data}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\n{academia}",
  mensagemNutriCardapioBio:
    "Olá, {aluno}! Tudo bem?\nSegue em anexo seu *cardápio* e sua *Avaliação de Bioimpedância* referentes ao atendimento do dia *{data}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\n{academia}",
};


function hojeISO() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const ano = partes.find((p) => p.type === "year")?.value || "";
  const mes = partes.find((p) => p.type === "month")?.value || "";
  const dia = partes.find((p) => p.type === "day")?.value || "";

  return `${ano}-${mes}-${dia}`;
}

function agoraMs() {
  return Date.now();
}

function limparChat24h(lista: MensagemChat[]) {
  const limite = agoraMs() - 24 * 60 * 60 * 1000;
  return lista.filter((msg) => {
    const criado = new Date(msg.createdAt || "").getTime();
    return Number.isFinite(criado) && criado >= limite;
  });
}

function formatarDataBR(dataISO: string) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function diaSemana(dataISO: string) {
  if (!dataISO) return "";
  const data = new Date(`${dataISO}T12:00:00`);
  return data.toLocaleDateString("pt-BR", { weekday: "long" });
}

function primeiroNome(nome: string) {
  const p = nome.trim().split(" ")[0] || "Aluno";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function normalizar(texto: any) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function abrirWhatsApp(telefone: string, mensagem: string) {
  const numero = telefone.replace(/\D/g, "");
  const numeroComPais = numero.startsWith("55") ? numero : `55${numero}`;
  window.open(`https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`, "_blank");
}

function aplicarModeloNutri(modelo: string, a: Agendamento, configuracao?: any) {
  const variaveis: any = {
    aluno: primeiroNome(a.nome),
    telefone: a.telefone || "",
    matricula: a.matricula || "",
    data: formatarDataBR(a.dataConsulta),
    horario: a.horaConsulta || "",
    diaSemana: diaSemana(a.dataConsulta),
    academia: configuracao?.nomeAcademia || "Academia Prix",
    endereco: configuracao?.endereco || "",
    colaboradora: a.quemAgendou || "",
    vendedora: a.vendedoraConversao || "",
    plano: a.planoConvertido || a.tipoConsulta || "",
  };

  let mensagem = modelo || "";

  Object.entries(variaveis).forEach(([chave, valor]) => {
    mensagem = mensagem.replace(
      new RegExp(`{${chave}}`, "g"),
      String(valor || "")
    );
  });

  return mensagem;
}

function mensagemConfirmacao(a: Agendamento, configuracao?: any) {
  return aplicarModeloNutri(
    configuracao?.mensagemNutriConfirmacao || mensagensNutriPadrao.mensagemNutriConfirmacao,
    a,
    configuracao
  );
}

function mensagemCardapio(a: Agendamento, configuracao?: any) {
  return aplicarModeloNutri(
    configuracao?.mensagemNutriCardapio || mensagensNutriPadrao.mensagemNutriCardapio,
    a,
    configuracao
  );
}

function mensagemBio(a: Agendamento, configuracao?: any) {
  return aplicarModeloNutri(
    configuracao?.mensagemNutriBio || mensagensNutriPadrao.mensagemNutriBio,
    a,
    configuracao
  );
}

function mensagemCardapioBio(a: Agendamento, configuracao?: any) {
  return aplicarModeloNutri(
    configuracao?.mensagemNutriCardapioBio || mensagensNutriPadrao.mensagemNutriCardapioBio,
    a,
    configuracao
  );
}

function baixarDocumento(doc?: Documento | null) {
  if (!doc?.dataUrl) return alert("Nenhum arquivo anexado para download.");
  const a = document.createElement("a");
  a.href = doc.dataUrl;
  a.download = doc.nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function agendamentoConvertido(a: Agendamento) {
  return Boolean(a.converteuPlanoPago || a.planoConvertido || a.dataConversao || a.vendedoraConversao);
}

function deveRemarcar(a: Agendamento) {
  const status = normalizar(a.statusPresenca);
  const tipo = normalizar(a.tipoAtendimento?.join(" "));
  return status.includes("CANCELOU") || status.includes("FALTOU") || status.includes("AGUARDANDO") || tipo.includes("RETORNO");
}

function disponivelNaConfiguracao(config: ConfigAgenda, data: string, hora: string) {
  const horarios = config.horarios.length ? config.horarios : horariosPadrao;
  const bloqueio = config.bloqueios.find((b) => b.data === data);

  if (bloqueio?.tipo === "Feriado") return false;
  if (bloqueio?.tipo === "Horário especial") return bloqueio.horariosLiberados.includes(hora);

  return horarios.includes(hora);
}

export default function AgendaNutricionistaPage() {
  const [configuracaoMensagens, setConfiguracaoMensagens] = useState<any>(null);
  const [data, setData] = useState(hojeISO());
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPagamento, setFiltroPagamento] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("");
  const [filtroConvertido, setFiltroConvertido] = useState("");
  const [filtroRemarcacao, setFiltroRemarcacao] = useState(false);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [config, setConfig] = useState<ConfigAgenda>({ horarios: horariosPadrao, aviso: "30/05 (Sexta-feira) é feriado de Corpus Christi.\nAs consultas deste dia serão reagendadas.", bloqueios: [] });
  const [chat, setChat] = useState<MensagemChat[]>([]);
  const [mensagemChat, setMensagemChat] = useState("");
  const quantidadeChatAnterior = useRef(0);


  async function carregarConfiguracoesMensagens() {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
    const unidadeId =
      usuarioLogado.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : String(usuarioLogado.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");

    if (!unidadeId) return;

    try {
      const response = await fetch(`/api/configuracoes?unidadeId=${unidadeId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data?.error) {
        setConfiguracaoMensagens(data);
      }
    } catch (error) {
      console.log("Erro ao carregar mensagens da nutricionista:", error);
    }
  }

  useEffect(() => {
    carregarConfiguracoesMensagens();
    carregarConfigAgenda();
    carregarAgendamentos();

    const chatSalvo = localStorage.getItem(STORAGE_CHAT);

    if (chatSalvo) {
      const limpo = limparChat24h(JSON.parse(chatSalvo));
      setChat(limpo);
      localStorage.setItem(STORAGE_CHAT, JSON.stringify(limpo));
      quantidadeChatAnterior.current = limpo.length;
    }
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      carregarAgendamentos(false);
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  async function carregarAgendamentos(mostrarErro = true) {
    try {
      const response = await fetch("/api/agenda-nutricionista", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        if (mostrarErro) alert(data.error || "Erro ao carregar agenda nutricionista.");
        return;
      }

      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      if (mostrarErro) alert("Erro ao carregar agenda nutricionista.");
    }
  }

  async function carregarConfigAgenda() {
    try {
      const usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
      const unidadeSelecionada =
        usuarioLogado.cargo === "ADMIN_GERAL"
          ? localStorage.getItem("unidadeSelecionadaId")
          : String(usuarioLogado.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");

      const response = await fetch(
        `/api/agenda-nutricionista/configuracoes?unidadeId=${unidadeSelecionada}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!data?.error) {
        setConfig({
          horarios: data.horarios?.length ? data.horarios : horariosPadrao,
          aviso: data.aviso || "",
          bloqueios: Array.isArray(data.bloqueios) ? data.bloqueios : [],
        });
      }
    } catch (error) {
      console.log("Erro ao carregar configurações da agenda nutricionista:", error);
    }
  }

  useEffect(() => {
    const intervalo = setInterval(() => {
      const salvos = localStorage.getItem(STORAGE_CHAT);
      if (!salvos) return;

      const mensagens = limparChat24h(JSON.parse(salvos));

      if (mensagens.length > quantidadeChatAnterior.current) {
        tocarNotificacao();
      }

      quantidadeChatAnterior.current = mensagens.length;
      setChat(mensagens);
      localStorage.setItem(STORAGE_CHAT, JSON.stringify(mensagens));
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  const agendamentosDia = useMemo(() => agendamentos.filter((a) => a.dataConsulta === data), [agendamentos, data]);
  const horariosBase = config.horarios.length ? [...config.horarios].sort() : horariosPadrao;

  const horarios = useMemo(() => {
    const bloqueio = config.bloqueios.find((b) => b.data === data);

    if (bloqueio?.tipo === "Feriado") return horariosBase;
    if (bloqueio?.tipo === "Horário especial") return [...bloqueio.horariosLiberados].sort();

    return horariosBase;
  }, [config, data, horariosBase]);

  const agendamentosForaDaGrade = useMemo(() => {
    return agendamentosDia.filter((a) => !horarios.includes(a.horaConsulta));
  }, [agendamentosDia, horarios]);

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos
      .filter((a) => {
        const dentroPeriodo =
          (!periodoInicio || a.dataConsulta >= periodoInicio) &&
          (!periodoFim || a.dataConsulta <= periodoFim);

        const bateBusca =
          !busca ||
          normalizar(a.nome).includes(normalizar(busca)) ||
          normalizar(a.matricula).includes(normalizar(busca)) ||
          normalizar(a.telefone).includes(normalizar(busca)) ||
          normalizar(a.quemAgendou).includes(normalizar(busca)) ||
          normalizar(a.vendedoraConversao).includes(normalizar(busca));

        const bateStatus = !filtroStatus || a.statusPresenca === filtroStatus;
        const batePagamento = !filtroPagamento || a.statusPagamento === filtroPagamento;
        const batePlano = !filtroPlano || a.planoConvertido === filtroPlano || a.tipoConsulta === filtroPlano;
        const bateConvertido =
          !filtroConvertido ||
          (filtroConvertido === "SIM" && agendamentoConvertido(a)) ||
          (filtroConvertido === "NAO" && !agendamentoConvertido(a));

        const bateRemarcacao = !filtroRemarcacao || deveRemarcar(a);

        return dentroPeriodo && bateBusca && bateStatus && batePagamento && batePlano && bateConvertido && bateRemarcacao;
      })
      .sort((a, b) => `${a.dataConsulta} ${a.horaConsulta}`.localeCompare(`${b.dataConsulta} ${b.horaConsulta}`));
  }, [agendamentos, periodoInicio, periodoFim, busca, filtroStatus, filtroPagamento, filtroPlano, filtroConvertido, filtroRemarcacao]);

  const mostrarResultadoFiltros = Boolean(periodoInicio || periodoFim || busca || filtroStatus || filtroPagamento || filtroPlano || filtroConvertido || filtroRemarcacao);

  function tocarNotificacao() {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAhISEhISEhISEhISEhICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkJCQkJCQkJCQkJCQkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA");
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch {}
  }

  function enviarChat() {
    if (!mensagemChat.trim()) return;

    const usuarioSalvo = localStorage.getItem("usuario");
    const usuarioAtual = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    const nomeUsuario = usuarioAtual?.nome?.split(" ")?.[0] || "Equipe";

    const nova: MensagemChat = {
      id: crypto.randomUUID(),
      nome: nomeUsuario,
      texto: mensagemChat.trim(),
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    };

    const atualizado = limparChat24h([nova, ...chat]).slice(0, 50);
    setChat(atualizado);
    quantidadeChatAnterior.current = atualizado.length;
    localStorage.setItem(STORAGE_CHAT, JSON.stringify(atualizado));
    setMensagemChat("");
  }

  async function editarAviso() {
    const novoAviso = prompt("Digite o aviso da nutricionista:", config.aviso);
    if (novoAviso === null) return;

    const atualizado = { ...config, aviso: novoAviso };
    setConfig(atualizado);

    try {
      const usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
      const unidadeSelecionada =
        usuarioLogado.cargo === "ADMIN_GERAL"
          ? localStorage.getItem("unidadeSelecionadaId")
          : String(usuarioLogado.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");

      await fetch("/api/agenda-nutricionista/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...atualizado,
          unidadeId: unidadeSelecionada ? Number(unidadeSelecionada) : null,
          usuarioNome: usuarioLogado.nome || "",
        }),
      });
    } catch (error) {
      console.log("Erro ao salvar aviso da nutricionista:", error);
    }
  }

  function agendamentoDoHorario(hora: string) {
    return agendamentosDia.find((a) => a.horaConsulta === hora);
  }

  function visualizarAgendamento(a: Agendamento) {
    alert(
      `Agendamento Nutricionista\n\n` +
        `Nome: ${a.nome}\n` +
        `Telefone: ${a.telefone}\n` +
        `Matrícula: ${a.matricula || "-"}\n` +
        `Unidade: ${a.unidade || "-"}\n` +
        `Data: ${formatarDataBR(a.dataConsulta)}\n` +
        `Horário: ${a.horaConsulta}\n` +
        `Tipo de consulta: ${a.tipoConsulta || "-"}\n` +
        `Presença: ${a.statusPresenca || "-"}\n` +
        `Pagamento: ${a.statusPagamento || "-"}\n` +
        `Convertido: ${agendamentoConvertido(a) ? `Sim - ${a.planoConvertido || "-"}` : "Não"}\n` +
        `Retorno: ${a.dataRetorno ? `${a.diasRetorno} dias - ${formatarDataBR(a.dataRetorno)} ${a.horaRetorno || ""}` : "-"}\n` +
        `Quem agendou: ${a.quemAgendou || "-"}\n\n` +
        `Observações: ${a.observacoes || "-"}`
    );
  }

  async function excluirAgendamento(id: string) {
    const confirmar = confirm("Tem certeza que deseja excluir este agendamento?");
    if (!confirmar) return;

    try {
      const response = await fetch("/api/agenda-nutricionista", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao excluir agendamento.");
        return;
      }

      const atualizados = agendamentos.filter((item) => item.id !== id);
      setAgendamentos(atualizados);
    } catch (error) {
      console.log(error);
      alert("Erro ao excluir agendamento.");
    }
  }

  function irParaAgendamento(a: Agendamento) {
    setData(a.dataConsulta);
    setTimeout(() => window.scrollTo({ top: 520, behavior: "smooth" }), 80);
  }

  const resumo = {
    total: agendamentosDia.length,
    confirmados: agendamentosDia.filter((a) => a.statusPresenca === "Confirmado").length,
    pendentes: agendamentosDia.filter((a) => a.statusPresenca !== "Confirmado" && a.statusPresenca !== "Cancelou").length,
    faltas: agendamentosDia.filter((a) => a.statusPresenca === "Faltou").length,
    livres: Math.max(horarios.length - agendamentosDia.filter((a) => horarios.includes(a.horaConsulta)).length, 0),
  };

  const agendamentoParaAtalhos = agendamentosDia[0] || agendamentosFiltrados[0];

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <main className="flex-1 p-6">
        <header className="mb-6 rounded-2xl bg-slate-950 px-6 py-5 text-white shadow">
          <h1 className="text-2xl font-bold">Agenda Nutricionista</h1>
          <p className="text-sm text-slate-300">Gerencie seus agendamentos e consultas</p>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="mb-2 text-xs font-bold uppercase text-slate-600">Filtro por data</p>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="mb-2 text-xs font-bold uppercase text-slate-600">Filtro por período</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3" />
              <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3" />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Link href="/agenda-nutricionista/configuracoes" className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold">Configurações de Horários</Link>
            <Link href="/agenda-nutricionista/novo" className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white">+ Novo Agendamento</Link>
          </div>
        </section>

        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <p className="mb-2 text-xs font-bold uppercase text-slate-600">Buscar</p>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, matrícula, telefone, quem agendou ou vendedora..." className="w-full rounded-xl border border-slate-300 px-4 py-3" />
            </div>

            <FiltroSelect label="Status" value={filtroStatus} onChange={setFiltroStatus}>
              <option value="">Todos</option>
              <option>Confirmado</option>
              <option>Aguardando confirmação</option>
              <option>Cancelou</option>
              <option>Faltou</option>
            </FiltroSelect>

            <FiltroSelect label="Pagamento" value={filtroPagamento} onChange={setFiltroPagamento}>
              <option value="">Todos</option>
              <option>Free</option>
              <option>Vai acertar na consulta</option>
              <option>Pago</option>
            </FiltroSelect>

            <FiltroSelect label="Plano/Consulta" value={filtroPlano} onChange={setFiltroPlano}>
              <option value="">Todos</option>
              <option>Anual</option>
              <option>Semestral</option>
              <option>Trimestral</option>
              <option>Mensal</option>
              <option>Free Consulta + Bioimpedância</option>
              <option>Particular Consulta + Bioimpedância</option>
            </FiltroSelect>

            <FiltroSelect label="Convertido" value={filtroConvertido} onChange={setFiltroConvertido}>
              <option value="">Todos</option>
              <option value="SIM">Convertidos</option>
              <option value="NAO">Não convertidos</option>
            </FiltroSelect>

            <label className="flex h-[48px] items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800">
              <input type="checkbox" checked={filtroRemarcacao} onChange={(e) => setFiltroRemarcacao(e.target.checked)} />
              Remarcação/Retorno
            </label>

            <button
              onClick={() => {
                setPeriodoInicio("");
                setPeriodoFim("");
                setBusca("");
                setFiltroStatus("");
                setFiltroPagamento("");
                setFiltroPlano("");
                setFiltroConvertido("");
                setFiltroRemarcacao(false);
              }}
              className="h-[48px] rounded-xl border border-slate-300 bg-white px-4 font-semibold"
            >
              Limpar
            </button>
          </div>

          {mostrarResultadoFiltros && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Resultados dos filtros ({agendamentosFiltrados.length})</h3>
                <p className="text-sm text-slate-500">Clique em "Ir para data" para abrir na grade da agenda.</p>
              </div>

              {agendamentosFiltrados.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum agendamento encontrado.</p>
              ) : (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-white text-xs uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Data</th>
                        <th className="px-3 py-2 text-left">Hora</th>
                        <th className="px-3 py-2 text-left">Nome</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Pagamento</th>
                        <th className="px-3 py-2">Plano</th>
                        <th className="px-3 py-2">Convertido</th>
                        <th className="px-3 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentosFiltrados.map((a) => (
                        <tr key={a.id} className="border-t">
                          <td className="px-3 py-2">{formatarDataBR(a.dataConsulta)}</td>
                          <td className="px-3 py-2">{a.horaConsulta}</td>
                          <td className="px-3 py-2 font-semibold">{a.nome}</td>
                          <td className="px-3 py-2 text-center">{a.statusPresenca}</td>
                          <td className="px-3 py-2 text-center">{a.statusPagamento}</td>
                          <td className="px-3 py-2 text-center">{a.planoConvertido || a.tipoConsulta || "-"}</td>
                          <td className="px-3 py-2 text-center">{agendamentoConvertido(a) ? "Sim" : "Não"}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => irParaAgendamento(a)} className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white">Ir para data</button>
                            <Link href={`/agenda-nutricionista/${a.id}/editar`} className="ml-2 rounded-lg bg-amber-500 px-3 py-2 font-bold text-white">Editar</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Avisos da Nutricionista</h2>
              <button onClick={editarAviso} className="rounded-xl border border-amber-500 px-4 py-2 text-sm font-semibold">Editar Aviso</button>
            </div>
            <p className="whitespace-pre-line font-semibold text-red-600">{config.aviso}</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Bate-papo com a Nutricionista</h2>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Online</span>
            </div>
            <div className="mb-3 max-h-36 space-y-2 overflow-auto">
              {chat.length === 0 && <div className="rounded-xl bg-white p-3 text-sm text-slate-500">Nenhuma mensagem ainda.</div>}
              {chat.map((m) => (
                <div key={m.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
                  <b>{m.nome}</b> <span className="ml-2 text-slate-400">{m.hora}</span>
                  <p>{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={mensagemChat}
                onChange={(e) => setMensagemChat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviarChat();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
              />
              <button onClick={enviarChat} className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">Enviar</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Histórico apagado automaticamente após 24h. Pressione Enter para enviar.</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 font-bold">Resumo do dia</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-blue-50 p-4"><p>Agendamentos</p><b className="text-2xl">{resumo.total}</b></div>
              <div className="rounded-xl bg-green-50 p-4"><p>Confirmados</p><b className="text-2xl">{resumo.confirmados}</b></div>
              <div className="rounded-xl bg-yellow-50 p-4"><p>Pendentes</p><b className="text-2xl">{resumo.pendentes}</b></div>
              <div className="rounded-xl bg-red-50 p-4"><p>Faltas</p><b className="text-2xl">{resumo.faltas}</b></div>
              <div className="rounded-xl bg-emerald-50 p-4"><p>Livres</p><b className="text-2xl">{resumo.livres}</b></div>
            </div>
          </div>
        </section>

        {agendamentosForaDaGrade.length > 0 && (
          <section className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
            <h3 className="mb-2 font-bold text-red-700">Atenção: agendamentos fora da grade de horários</h3>
            <p className="mb-3 text-sm text-red-700">Esses agendamentos foram salvos em horários que não estão configurados para este dia. Você pode editar ou excluir por aqui.</p>
            <div className="grid gap-2">
              {agendamentosForaDaGrade.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                  <span className="font-semibold">{a.horaConsulta} - {a.nome}</span>
                  <div className="flex gap-2">
                    <Link href={`/agenda-nutricionista/${a.id}/editar`} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white">Editar</Link>
                    <button onClick={() => excluirAgendamento(a.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_310px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-bold">Agenda - {diaSemana(data)}, {formatarDataBR(data)}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Hora</th><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3">Matrícula</th><th className="px-4 py-3">Unidade</th><th className="px-4 py-3">Tipo de Consulta</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pagamento</th><th className="px-4 py-3">Cardápio</th><th className="px-4 py-3">Bio</th><th className="px-4 py-3">Retorno</th><th className="px-4 py-3">Quem agendou</th><th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((hora) => {
                    const a = agendamentoDoHorario(hora);
                    const livre = !a;
                    return (
                      <tr key={hora} className={livre ? "bg-green-50" : "bg-red-50"}>
                        <td className="border-t px-4 py-3"><span className={livre ? "rounded-lg bg-green-100 px-3 py-1 font-bold text-green-700" : "rounded-lg bg-red-100 px-3 py-1 font-bold text-red-700"}>{hora}</span></td>
                        <td className="border-t px-4 py-3 font-semibold">{a ? a.nome : <span className="text-green-700">Livre</span>}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.matricula || "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.unidade || "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.tipoConsulta || "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.statusPresenca || "-"}</td>
                        <td className={a?.statusPagamento === "Vai acertar na consulta" ? "border-t px-4 py-3 text-center font-bold text-red-600" : "border-t px-4 py-3 text-center"}>{a?.statusPagamento || "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.cardapioEnviado ? "Enviado" : a?.cardapioPronto ? "Pronto" : "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.bioEnviada ? "Enviada" : a?.bioPronta ? "Pronta" : "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.dataRetorno ? `${a.diasRetorno} dias` : "-"}</td>
                        <td className="border-t px-4 py-3 text-center">{a?.quemAgendou || "-"}</td>
                        <td className="border-t px-4 py-3 text-center">
                          {a ? (
                            <div className="flex items-center justify-center gap-2">
                              <button type="button" onClick={() => visualizarAgendamento(a)} title="Visualizar" className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"><MdVisibility className="text-lg" /></button>
                              <Link href={`/agenda-nutricionista/${a.id}/editar`} title="Editar" className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100"><MdEdit className="text-lg" /></Link>
                              <button type="button" onClick={() => excluirAgendamento(a.id)} title="Excluir" className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"><MdDelete className="text-lg" /></button>
                            </div>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 font-bold">Atalhos rápidos</h3>
              <div className="space-y-3">
                {agendamentoParaAtalhos ? (
                  <>
                    <button onClick={() => abrirWhatsApp(agendamentoParaAtalhos.telefone, mensagemConfirmacao(agendamentoParaAtalhos, configuracaoMensagens))} className="w-full rounded-xl border border-green-400 px-4 py-3 text-left font-semibold text-green-700">Confirmar Presença</button>
                    <button onClick={() => abrirWhatsApp(agendamentoParaAtalhos.telefone, mensagemCardapio(agendamentoParaAtalhos, configuracaoMensagens))} className="w-full rounded-xl border border-green-400 px-4 py-3 text-left font-semibold text-green-700">Enviar Cardápio</button>
                    <button onClick={() => abrirWhatsApp(agendamentoParaAtalhos.telefone, mensagemBio(agendamentoParaAtalhos, configuracaoMensagens))} className="w-full rounded-xl border border-green-400 px-4 py-3 text-left font-semibold text-green-700">Enviar Bioimpedância</button>
                    <button onClick={() => abrirWhatsApp(agendamentoParaAtalhos.telefone, mensagemCardapioBio(agendamentoParaAtalhos, configuracaoMensagens))} className="w-full rounded-xl border border-green-400 px-4 py-3 text-left font-semibold text-green-700">Enviar Cardápio + Bioimpedância</button>
                  </>
                ) : <p className="text-sm text-slate-500">Cadastre ou filtre um agendamento para liberar os atalhos.</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 font-bold">Documentos do primeiro agendamento</h3>
              {agendamentoParaAtalhos ? (
                <div className="space-y-2">
                  <button onClick={() => baixarDocumento(agendamentoParaAtalhos.cardapioArquivo)} className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white">Download Cardápio</button>
                  <button onClick={() => baixarDocumento(agendamentoParaAtalhos.bioArquivo)} className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white">Download Bioimpedância</button>
                </div>
              ) : <p className="text-sm text-slate-500">Nenhum documento disponível.</p>}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function FiltroSelect({ label, value, onChange, children }: any) {
  return (
    <label className="min-w-[160px]">
      <p className="mb-2 text-xs font-bold uppercase text-slate-600">{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3">
        {children}
      </select>
    </label>
  );
}
