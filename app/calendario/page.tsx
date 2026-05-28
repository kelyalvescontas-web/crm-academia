"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

function pegarUnidadeAtual() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (usuario.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId");
  }

  return String(usuario.unidadeId || "");
}

export default function CalendarioPage() {
  const router = useRouter();

  const [aulas, setAulas] = useState<any[]>([]);
  const [diarias, setDiarias] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState("");

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarDados();
  }, []);

  async function carregarDados() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    const aulasResponse = await fetch(`/api/aulas?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const aulasData = await aulasResponse.json();

    const diariasResponse = await fetch(`/api/diarias?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const diariasData = await diariasResponse.json();

    setAulas(Array.isArray(aulasData) ? aulasData : []);
    setDiarias(Array.isArray(diariasData) ? diariasData : []);
  }

  function formatarData(dataISO?: string) {
    if (!dataISO) return "";

    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const aulasDoDia = aulas.filter((aula) => aula.data === dataSelecionada);

  const diariasDoDia = diarias.filter(
    (diaria) => diaria.dataFinal === dataSelecionada
  );

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-10">Calendário</h1>

        <div className="bg-white p-5 rounded-2xl shadow mb-10">
          <label className="block mb-3 text-xl font-bold">Selecionar Data</label>

          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="border p-3 rounded-xl w-80"
          />
        </div>

        {!dataSelecionada && (
          <div className="bg-white p-8 rounded-2xl shadow">
            <p className="text-gray-600">
              Selecione uma data para visualizar os compromissos.
            </p>
          </div>
        )}

        {dataSelecionada && (
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-6">
                Aulas em {formatarData(dataSelecionada)}
              </h2>

              {aulasDoDia.length === 0 ? (
                <p className="text-gray-500">Nenhuma aula agendada nesta data.</p>
              ) : (
                <div className="space-y-4">
                  {aulasDoDia.map((aula) => (
                    <div key={aula.id} className="border rounded-xl p-4">
                      <p className="font-bold text-xl">{aula.nomeAluno}</p>
                      <p>Horário: {aula.horario}</p>
                      <p>Modalidade: {aula.modalidade}</p>
                      <p>Colaboradora: {aula.colaboradora}</p>
                      <p>Telefone: {aula.telefone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-6">
                Diárias encerrando em {formatarData(dataSelecionada)}
              </h2>

              {diariasDoDia.length === 0 ? (
                <p className="text-gray-500">Nenhuma diária encerrando nesta data.</p>
              ) : (
                <div className="space-y-4">
                  {diariasDoDia.map((diaria) => (
                    <div key={diaria.id} className="border rounded-xl p-4">
                      <p className="font-bold text-xl">{diaria.nome}</p>
                      <p>Telefone: {diaria.telefone}</p>
                      <p>CPF: {diaria.cpf}</p>
                      <p>Colaboradora: {diaria.colaboradora}</p>
                      <p>Final: {formatarData(diaria.dataFinal)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}