"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Bloqueio = {
  id: string;
  data: string;
  tipo: string;
  motivo: string;
  horariosLiberados: string[];
};

type ConfigAgenda = {
  horarios: string[];
  aviso: string;
  bloqueios: Bloqueio[];
};

const horariosPadrao = [
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "18:15",
  "18:45",
  "19:15",
  "19:45",
  "20:15",
  "20:45",
];

function usuarioAtual() {
  if (typeof window === "undefined") return null;
  const salvo = localStorage.getItem("usuario");
  return salvo ? JSON.parse(salvo) : null;
}

function unidadeAtualId() {
  const usuario = usuarioAtual();

  if (!usuario) return "";

  if (usuario.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId") || String(usuario.unidadeId || "");
  }

  return String(usuario.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");
}

export default function ConfigAgendaNutricionista() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [horarioNovo, setHorarioNovo] = useState("");
  const [config, setConfig] = useState<ConfigAgenda>({
    horarios: horariosPadrao,
    aviso:
      "30/05 (Sexta-feira) é feriado de Corpus Christi.\nAs consultas deste dia serão reagendadas.",
    bloqueios: [],
  });
  const [modal, setModal] = useState(false);
  const [bloqueio, setBloqueio] = useState<Bloqueio>({
    id: "",
    data: "",
    tipo: "Feriado",
    motivo: "",
    horariosLiberados: [],
  });

  useEffect(() => {
    carregarConfig();
  }, []);

  async function carregarConfig() {
    try {
      const unidadeId = unidadeAtualId();

      const response = await fetch(
        `/api/agenda-nutricionista/configuracoes?unidadeId=${unidadeId}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao carregar configurações da nutricionista");
        return;
      }

      setConfig({
        horarios: data.horarios?.length ? data.horarios : horariosPadrao,
        aviso: data.aviso || "",
        bloqueios: Array.isArray(data.bloqueios) ? data.bloqueios : [],
      });
    } catch (error) {
      console.log(error);
      alert("Erro ao carregar configurações da nutricionista");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarConfig() {
    try {
      setSalvando(true);

      const unidadeId = unidadeAtualId();
      const usuario = usuarioAtual();

      const atualizado = {
        ...config,
        horarios: [...config.horarios].sort(),
      };

      const response = await fetch("/api/agenda-nutricionista/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...atualizado,
          unidadeId: unidadeId ? Number(unidadeId) : null,
          usuarioNome: usuario?.nome || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao salvar configurações da nutricionista");
        return;
      }

      setConfig(data);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.log(error);
      alert("Erro ao salvar configurações da nutricionista");
    } finally {
      setSalvando(false);
    }
  }

  function addHorario() {
    if (!horarioNovo) return;

    if (config.horarios.includes(horarioNovo)) {
      alert("Este horário já está cadastrado.");
      return;
    }

    setConfig({
      ...config,
      horarios: [...config.horarios, horarioNovo].sort(),
    });

    setHorarioNovo("");
  }

  function removerHorario(h: string) {
    setConfig({
      ...config,
      horarios: config.horarios.filter((x) => x !== h),
    });
  }

  function novoBloqueio() {
    setBloqueio({
      id: crypto.randomUUID(),
      data: "",
      tipo: "Feriado",
      motivo: "",
      horariosLiberados: [],
    });
    setModal(true);
  }

  function salvarBloqueio() {
    if (!bloqueio.data || !bloqueio.motivo) {
      alert("Informe data e motivo.");
      return;
    }

    setConfig({
      ...config,
      bloqueios: [
        ...config.bloqueios.filter((b) => b.id !== bloqueio.id),
        bloqueio,
      ],
    });

    setModal(false);
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen bg-slate-100 text-slate-900">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Carregando configurações...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <main className="flex-1 p-6">
        <header className="mb-6 rounded-2xl bg-slate-950 px-6 py-5 text-white shadow">
          <h1 className="text-2xl font-bold">
            Configurações da Agenda Nutricionista
          </h1>
          <p className="text-sm text-slate-300">
            Configure horários padrão, feriados, bloqueios e avisos da nutricionista.
          </p>
        </header>

        <div className="mb-5 flex justify-between">
          <Link
            href="/agenda-nutricionista"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold"
          >
            ← Voltar para Agenda
          </Link>

          <button
            onClick={salvarConfig}
            disabled={salvando}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-5 font-bold">Horários Padrão de Atendimento</h2>

            <div className="mb-5 flex gap-3">
              <input
                type="time"
                value={horarioNovo}
                onChange={(e) => setHorarioNovo(e.target.value)}
                className="rounded-xl border px-4 py-3"
              />

              <button
                onClick={addHorario}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                + Adicionar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
              {config.horarios.map((h) => (
                <div
                  key={h}
                  className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 font-bold text-green-700 ring-1 ring-green-200"
                >
                  <span>{h}</span>
                  <button
                    onClick={() => removerHorario(h)}
                    className="font-black text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-5 font-bold">Aviso da Nutricionista</h2>

            <textarea
              value={config.aviso}
              onChange={(e) => setConfig({ ...config, aviso: e.target.value })}
              rows={8}
              className="w-full rounded-xl border px-4 py-3"
            />

            <button
              onClick={salvarConfig}
              disabled={salvando}
              className="mt-4 rounded-xl border border-blue-500 px-5 py-3 font-semibold text-blue-700 disabled:opacity-60"
            >
              Atualizar Aviso
            </button>
          </section>
        </div>

        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">
                Feriados, Bloqueios e Alterações de Horário
              </h2>
              <p className="text-sm text-slate-500">
                Use para bloquear datas ou alterar horários específicos sem mudar o padrão geral.
              </p>
            </div>

            <button
              onClick={novoBloqueio}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              + Novo Bloqueio
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Horários liberados</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {config.bloqueios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      Nenhum bloqueio cadastrado.
                    </td>
                  </tr>
                )}

                {config.bloqueios.map((b) => (
                  <tr key={b.id}>
                    <td className="border-t px-4 py-3">{b.data}</td>
                    <td className="border-t px-4 py-3">{b.tipo}</td>
                    <td className="border-t px-4 py-3">{b.motivo}</td>
                    <td className="border-t px-4 py-3">
                      {b.horariosLiberados.length
                        ? b.horariosLiberados.join(", ")
                        : "Nenhum horário"}
                    </td>
                    <td className="border-t px-4 py-3">
                      <span
                        className={
                          b.tipo === "Feriado"
                            ? "rounded-lg bg-red-50 px-3 py-1 font-bold text-red-600"
                            : "rounded-lg bg-yellow-50 px-3 py-1 font-bold text-yellow-700"
                        }
                      >
                        {b.tipo === "Feriado" ? "Bloqueado" : "Especial"}
                      </span>
                    </td>
                    <td className="border-t px-4 py-3">
                      <button
                        onClick={() => {
                          setBloqueio(b);
                          setModal(true);
                        }}
                        className="text-blue-600"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          setConfig({
                            ...config,
                            bloqueios: config.bloqueios.filter((x) => x.id !== b.id),
                          })
                        }
                        className="ml-4 text-red-600"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-5 text-xl font-bold">
                Novo Bloqueio / Horário Especial
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label>
                  Data
                  <input
                    type="date"
                    value={bloqueio.data}
                    onChange={(e) =>
                      setBloqueio({ ...bloqueio, data: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </label>

                <label>
                  Tipo
                  <select
                    value={bloqueio.tipo}
                    onChange={(e) =>
                      setBloqueio({
                        ...bloqueio,
                        tipo: e.target.value,
                        horariosLiberados:
                          e.target.value === "Feriado"
                            ? []
                            : bloqueio.horariosLiberados,
                      })
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  >
                    <option>Feriado</option>
                    <option>Horário especial</option>
                  </select>
                </label>

                <label className="md:col-span-2">
                  Motivo
                  <input
                    value={bloqueio.motivo}
                    onChange={(e) =>
                      setBloqueio({ ...bloqueio, motivo: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                    placeholder="Ex.: Corpus Christi"
                  />
                </label>
              </div>

              {bloqueio.tipo !== "Feriado" && (
                <div className="mt-5">
                  <p className="mb-3 font-semibold">
                    Horários liberados neste dia
                  </p>

                  <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                    {config.horarios.map((h) => (
                      <button
                        key={h}
                        onClick={() =>
                          setBloqueio({
                            ...bloqueio,
                            horariosLiberados: bloqueio.horariosLiberados.includes(h)
                              ? bloqueio.horariosLiberados.filter((x) => x !== h)
                              : [...bloqueio.horariosLiberados, h],
                          })
                        }
                        className={
                          bloqueio.horariosLiberados.includes(h)
                            ? "rounded-xl bg-green-100 px-3 py-2 font-bold text-green-700 ring-1 ring-green-300"
                            : "rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200"
                        }
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setModal(false)}
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarBloqueio}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
                >
                  Salvar Bloqueio
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
