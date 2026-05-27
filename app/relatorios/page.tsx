"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Sidebar from "../../components/Sidebar";

function pegarUnidadeAtual() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (usuario.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId");
  }

  return String(usuario.unidadeId || "");
}

export default function RelatoriosPage() {
  const router = useRouter();

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [modalidade, setModalidade] = useState("TODAS");

  const [dados, setDados] = useState<any>({
    totalAulas: 0,
    totalDiarias: 0,
    totalCompareceu: 0,
    totalFaltou: 0,
    vendasEfetivadas: 0,
    modalidades: {},
    aulas: [],
    diarias: [],
  });

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    if (!usuario.id) {
      router.push("/login");
      return;
    }

    carregarRelatorios();
  }, []);

  async function carregarRelatorios() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    const params = new URLSearchParams();

    params.append("unidadeId", unidadeId);

    if (dataInicial) params.append("dataInicial", dataInicial);
    if (dataFinal) params.append("dataFinal", dataFinal);
    if (modalidade) params.append("modalidade", modalidade);

    const response = await fetch(`/api/relatorios?${params.toString()}`, {
      cache: "no-store",
    });

    const data = await response.json();

    setDados(data);
  }

  function limparFiltros() {
    setDataInicial("");
    setDataFinal("");
    setModalidade("TODAS");

    setTimeout(() => {
      carregarRelatorios();
    }, 100);
  }

  function formatarData(data: string) {
    if (!data) return "";
    if (data.includes("/")) return data;

    const partes = data.split("-");
    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function exportarExcel() {
    const relatorioAulas = dados.aulas.map((aula: any) => ({
      Dia: formatarData(aula.data),
      Aluno: aula.nomeAluno,
      Modalidade: aula.modalidade,
      Colaboradora: aula.colaboradora,
      Status: aula.status,
    }));

    const relatorioResumo = [
      {
        "Total Aulas Experimentais": dados.totalAulas,
        "Compareceu Aulas": dados.totalCompareceu,
        "Faltou nas Aulas": dados.totalFaltou,
        "Vendas Efetivadas": dados.vendasEfetivadas,
        "Total de Diárias": dados.totalDiarias,
      },
    ];

    const relatorioModalidades = Object.entries(dados.modalidades || {}).map(
      ([modalidade, quantidade]: any) => ({
        Modalidade: modalidade,
        Quantidade: quantidade,
      })
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(relatorioAulas),
      "Aulas"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(relatorioResumo),
      "Resumo"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(relatorioModalidades),
      "Modalidades"
    );

    XLSX.writeFile(workbook, "relatorio_crm_academia.xlsx");
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold">Relatórios</h1>

          <button
            onClick={exportarExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-bold"
          >
            Exportar Excel
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-10">
          <h2 className="text-2xl font-bold mb-6">Filtros</h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <label>Data Inicial</label>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Data Final</label>
              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Modalidade</label>
              <select
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-full border p-3 rounded-xl"
              >
                <option>TODAS</option>
                <option>MUSCULAÇÃO</option>
                <option>PUMP</option>
                <option>GAP</option>
                <option>BOXE</option>
                <option>JIU-JITSU</option>
                <option>FUNCIONAL</option>
                <option>RITMOS</option>
                <option>P-COMBAT</option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={carregarRelatorios}
                className="bg-blue-900 text-white px-5 py-3 rounded-xl"
              >
                Filtrar
              </button>

              <button
                onClick={limparFiltros}
                className="bg-gray-500 text-white px-5 py-3 rounded-xl"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-5 mb-10">
          <Card titulo="Total Aulas" valor={dados.totalAulas} cor="text-blue-700" />
          <Card titulo="Compareceu" valor={dados.totalCompareceu} cor="text-green-600" />
          <Card titulo="Faltou" valor={dados.totalFaltou} cor="text-red-600" />
          <Card titulo="Vendas Efetivadas" valor={dados.vendasEfetivadas} cor="text-yellow-600" />
          <Card titulo="Total Diárias" valor={dados.totalDiarias} cor="text-purple-700" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-10">
          <h2 className="text-2xl font-bold mb-6">Aulas por Modalidade</h2>

          {Object.entries(dados.modalidades || {}).map(([modalidade, total]: any) => (
            <div key={modalidade} className="flex justify-between border-b py-3">
              <span>{modalidade}</span>
              <strong>{total}</strong>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-6">Relatório de Aulas</h2>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Dia</th>
                <th className="p-3 text-left">Aluno</th>
                <th className="p-3 text-left">Modalidade</th>
                <th className="p-3 text-left">Colaboradora</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {dados.aulas.map((aula: any) => (
                <tr key={aula.id} className="border-b">
                  <td className="p-3">{formatarData(aula.data)}</td>
                  <td className="p-3">{aula.nomeAluno}</td>
                  <td className="p-3">{aula.modalidade}</td>
                  <td className="p-3">{aula.colaboradora}</td>
                  <td className="p-3 font-bold">{aula.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor, cor }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow">
      <h2 className="text-lg font-bold">{titulo}</h2>
      <p className={`text-4xl font-bold mt-3 ${cor}`}>{valor}</p>
    </div>
  );
}