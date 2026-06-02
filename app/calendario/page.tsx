"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

function pegarUsuarioAtual() {
  if (typeof window === "undefined") return null;
  return JSON.parse(localStorage.getItem("usuario") || "{}");
}

function pegarUnidadeAtual() {
  const usuario = pegarUsuarioAtual();

  if (usuario?.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId");
  }

  return String(usuario?.unidadeId || "");
}

export default function CalendarioPage() {
  const router = useRouter();

  const [aulas, setAulas] = useState<any[]>([]);
  const [diarias, setDiarias] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("TODAS");
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const usuarioParseado = JSON.parse(usuarioSalvo);
    setUsuario(usuarioParseado);

    carregarDados(usuarioParseado);
  }, [router]);

  function usuarioInstrutor(usuarioAtual: any) {
    return String(usuarioAtual?.cargo || "").toUpperCase() === "INSTRUTOR";
  }

  async function carregarDados(usuarioAtual?: any) {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    const aulasResponse = await fetch(`/api/aulas?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const aulasData = aulasResponse.ok ? await aulasResponse.json() : [];
    setAulas(Array.isArray(aulasData) ? aulasData : []);

    if (usuarioInstrutor(usuarioAtual)) {
      setDiarias([]);
      return;
    }

    const diariasResponse = await fetch(`/api/diarias?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const diariasData = diariasResponse.ok ? await diariasResponse.json() : [];
    setDiarias(Array.isArray(diariasData) ? diariasData : []);
  }

  function formatarData(dataISO?: string) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function corStatus(status: string) {
    const s = String(status || "AGENDADA").toUpperCase();

    if (s === "VENDA EFETIVADA") return "#16a34a";
    if (s === "COMPARECEU") return "#2563eb";
    if (s === "FALTOU") return "#dc2626";
    if (s === "REMARCOU") return "#dc2626";

    return "#d97706";
  }

  function diariaAtivaNoDia(diaria: any, dataDia: string) {
    if (!dataDia) return false;
    return diaria.dataInicio <= dataDia && diaria.dataFinal >= dataDia;
  }

  const instrutor = usuarioInstrutor(usuario);

  const modalidadesUnicas = Array.from(
    new Set(
      aulas
        .map((aula) => aula.modalidade)
        .filter(Boolean)
        .map((m) => String(m).toUpperCase())
    )
  ).sort();

  const aulasDoDia = aulas.filter((aula) => {
    const bateData = aula.data === dataSelecionada;
    const bateModalidade =
      modalidadeFiltro === "TODAS" ||
      String(aula.modalidade || "").toUpperCase() === modalidadeFiltro;

    return bateData && bateModalidade;
  });

  const diariasDoDia = instrutor
    ? []
    : diarias.filter((diaria) => diariaAtivaNoDia(diaria, dataSelecionada));

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-10">Calendário</h1>

        <div className="bg-white p-5 rounded-2xl shadow mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-3 text-xl font-bold">
                Selecionar Data
              </label>

              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="border p-3 rounded-xl w-full"
              />
            </div>

            <div>
              <label className="block mb-3 text-xl font-bold">
                Filtrar Modalidade
              </label>

              <select
                value={modalidadeFiltro}
                onChange={(e) => setModalidadeFiltro(e.target.value)}
                className="border p-3 rounded-xl w-full"
              >
                <option value="TODAS">TODAS</option>
                {modalidadesUnicas.map((modalidade) => (
                  <option key={modalidade} value={modalidade}>
                    {modalidade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!dataSelecionada && (
          <div className="bg-white p-8 rounded-2xl shadow">
            <p className="text-gray-600">
              Selecione uma data para visualizar os compromissos.
            </p>
          </div>
        )}

        {dataSelecionada && (
          <div
            className={
              instrutor
                ? "grid grid-cols-1 gap-8"
                : "grid grid-cols-1 lg:grid-cols-2 gap-8"
            }
          >
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-6">
                Aulas em {formatarData(dataSelecionada)}
              </h2>

              {aulasDoDia.length === 0 ? (
                <p className="text-gray-500">Nenhuma aula encontrada.</p>
              ) : (
                <div className="space-y-4">
                  {aulasDoDia.map((aula) => (
                    <div key={aula.id} className="border rounded-xl p-4">
                      <p className="font-bold text-xl">{aula.nomeAluno}</p>
                      <p>Horário: {aula.horario}</p>
                      <p>Modalidade: {aula.modalidade}</p>
                      <p>Colaboradora: {aula.colaboradora}</p>

                      {!instrutor && <p>Telefone: {aula.telefone}</p>}

                      <p
                        className="font-bold mt-2"
                        style={{ color: corStatus(aula.status) }}
                      >
                        Status: {aula.status || "AGENDADA"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!instrutor && (
              <div className="bg-white p-6 rounded-2xl shadow">
                <h2 className="text-2xl font-bold mb-6">
                  Diárias ativas em {formatarData(dataSelecionada)}
                </h2>

                {diariasDoDia.length === 0 ? (
                  <p className="text-gray-500">
                    Nenhuma diária ativa nesta data.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {diariasDoDia.map((diaria) => (
                      <div key={diaria.id} className="border rounded-xl p-4">
                        <p className="font-bold text-xl">{diaria.nome}</p>
                        <p>Telefone: {diaria.telefone}</p>
                        <p>CPF: {diaria.cpf}</p>
                        <p>Colaboradora: {diaria.colaboradora}</p>
                        <p>Tipo: {diaria.tipoDiaria || "PAGA"}</p>
                        <p>Início: {formatarData(diaria.dataInicio)}</p>
                        <p>Final: {formatarData(diaria.dataFinal)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}