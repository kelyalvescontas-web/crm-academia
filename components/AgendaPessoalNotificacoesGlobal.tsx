"use client";

import { useEffect, useRef, useState } from "react";
import {
  MdCancel,
  MdCheckCircle,
  MdClose,
  MdNotificationsActive,
  MdSnooze,
} from "react-icons/md";

type UsuarioLogado = {
  id: number;
  nome: string;
  cargo?: string;
  unidadeId?: number;
};

type Notificacao = {
  id: number;
  usuarioId: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  agendaId?: number | null;
  createdAt: string;
};

function lerUsuario(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuario");
    if (!salvo) return null;
    return JSON.parse(salvo);
  } catch {
    return null;
  }
}

function tocarSom() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, 180);
  } catch {
    // Alguns navegadores bloqueiam som automático.
  }
}

export default function AgendaPessoalNotificacoesGlobal() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [notificacaoAtual, setNotificacaoAtual] = useState<Notificacao | null>(
    null
  );
  const idsJaAvisados = useRef<Set<number>>(new Set());
  const pausadoAte = useRef<number>(0);
  const buscando = useRef(false);

  useEffect(() => {
    setUsuario(lerUsuario());

    function atualizarUsuario() {
      setUsuario(lerUsuario());
    }

    window.addEventListener("usuarioAtualizado", atualizarUsuario);
    window.addEventListener("storage", atualizarUsuario);

    return () => {
      window.removeEventListener("usuarioAtualizado", atualizarUsuario);
      window.removeEventListener("storage", atualizarUsuario);
    };
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;

    buscarNotificacoes();

    const intervalo = setInterval(() => {
      buscarNotificacoes();
    }, 15000);

    return () => clearInterval(intervalo);
  }, [usuario?.id]);

  async function buscarNotificacoes() {
    if (!usuario?.id) return;
    if (buscando.current) return;
    if (Date.now() < pausadoAte.current) return;

    try {
      buscando.current = true;

      const response = await fetch(
        `/api/agenda-pessoal/notificacoes?usuarioId=${usuario.id}`,
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (!Array.isArray(data)) return;

      const primeiraNaoLida = data.find((item: Notificacao) => !item.lida);

      if (primeiraNaoLida) {
        setNotificacaoAtual(primeiraNaoLida);

        if (!idsJaAvisados.current.has(primeiraNaoLida.id)) {
          idsJaAvisados.current.add(primeiraNaoLida.id);
          tocarSom();
        }
      }
    } catch (error) {
      console.log("Erro ao buscar notificações globais:", error);
    } finally {
      buscando.current = false;
    }
  }

  async function marcarComoLida(notificacao?: Notificacao | null) {
    const alvo = notificacao || notificacaoAtual;

    if (!usuario?.id || !alvo?.id) {
      setNotificacaoAtual(null);
      return;
    }

    try {
      await fetch("/api/agenda-pessoal/notificacoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: alvo.id,
          usuarioId: usuario.id,
        }),
      });
    } catch (error) {
      console.log(error);
    }

    setNotificacaoAtual(null);
  }

  async function verAgora() {
    const alvo = notificacaoAtual;
    if (!alvo) return;

    await marcarComoLida(alvo);

    window.location.href = alvo.agendaId
      ? `/agenda-pessoal?abrir=${alvo.agendaId}`
      : "/agenda-pessoal";
  }

  function verDepois() {
    setNotificacaoAtual(null);
  }

  function adiar(minutos: number) {
    pausadoAte.current = Date.now() + minutos * 60 * 1000;
    setNotificacaoAtual(null);
  }

  async function responderAgenda(status: "ACEITO" | "RECUSADO") {
    if (!usuario?.id || !notificacaoAtual?.agendaId) return;

    try {
      const response = await fetch("/api/agenda-pessoal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: notificacaoAtual.agendaId,
          status,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioCargo: usuario.cargo || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao responder notificação.");
        return;
      }

      await marcarComoLida(notificacaoAtual);
    } catch (error) {
      console.log(error);
      alert("Erro ao responder notificação.");
    }
  }

  if (!usuario?.id || !notificacaoAtual) return null;

  const titulo = notificacaoAtual.titulo || "Nova notificação";
  const mensagem = notificacaoAtual.mensagem || "";

  const podeAceitarRecusar =
    notificacaoAtual.agendaId &&
    (titulo.toUpperCase().includes("COMPARTILHADO") ||
      titulo.toUpperCase().includes("TAREFA") ||
      titulo.toUpperCase().includes("AGENDA"));

  return (
    <div className="fixed right-5 top-5 z-[99999] w-[370px] max-w-[calc(100vw-24px)] rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-blue-200">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
            <MdNotificationsActive className="text-blue-600" />
            {titulo}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {mensagem}
          </p>
        </div>

        <button
          onClick={verDepois}
          className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
          title="Fechar"
        >
          <MdClose />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={verAgora}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
        >
          Ver agora
        </button>

        <button
          onClick={verDepois}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 transition hover:bg-slate-50"
        >
          Ver depois
        </button>

        {podeAceitarRecusar ? (
          <>
            <button
              onClick={() => responderAgenda("ACEITO")}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <MdCheckCircle className="mr-1 inline" />
              Aceitar
            </button>

            <button
              onClick={() => responderAgenda("RECUSADO")}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700"
            >
              <MdCancel className="mr-1 inline" />
              Recusar
            </button>
          </>
        ) : null}

        <button
          onClick={() => adiar(5)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200"
        >
          <MdSnooze className="mr-1 inline" />
          Adiar 5 min
        </button>

        <button
          onClick={() => adiar(15)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200"
        >
          Adiar 15 min
        </button>
      </div>
    </div>
  );
}
