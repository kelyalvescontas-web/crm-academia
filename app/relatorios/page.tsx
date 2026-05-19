"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

import Sidebar from "../../components/Sidebar";

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
    totalConfirmada: 0,
    taxaComparecimento: 0,
    modalidades: {},
    aulas: [],
    diarias: [],
  });

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);

    if (usuario.cargo !== "ADMIN") {
      router.push("/");
      return;
    }

    carregarRelatorios();
  }, []);

  async function carregarRelatorios() {
    const params = new URLSearchParams();

    if (dataInicial) params.append("dataInicial", dataInicial);
    if (dataFinal) params.append("dataFinal", dataFinal);
    if (modalidade) params.append("modalidade", modalidade);

    const response = await fetch(`/api/relatorios?${params.toString()}`);
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

  function exportarExcel() {
    const aulasExcel = dados.aulas.map((aula: any) => ({
      Aluno: aula.nomeAluno,
      Telefone: aula.telefone,
      Modalidade: aula.modalidade,
      Colaboradora: aula.colaboradora,
      Data: aula.data,
      Horario: aula.horario,
      Status: aula.status,
    }));

    const diariasExcel = dados.diarias.map((diaria: any) => ({
      Nome: diaria.nome,
      Telefone: diaria.telefone,
      CPF: diaria.cpf,
      Colaboradora: diaria.colaboradora,
      Inicio: diaria.dataInicio,
      Final: diaria.dataFinal,
      Dias: diaria.quantidadeDias,
    }));

    const workbook = XLSX.utils.book_new();

    const resumoSheet = XLSX.utils.json_to_sheet([
      {
        "Total de Aulas": dados.totalAulas,
        "Total de Diárias": dados.totalDiarias,
        Compareceu: dados.totalCompareceu,
        Faltou: dados.totalFaltou,
        Confirmadas: dados.totalConfirmada,
        "Taxa Comparecimento": `${dados.taxaComparecimento}%`,
      },
    ]);

    const aulasSheet = XLSX.utils.json_to_sheet(aulasExcel);
    const diariasSheet = XLSX.utils.json_to_sheet(diariasExcel);

    XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo");
    XLSX.utils.book_append_sheet(workbook, aulasSheet, "Aulas");
    XLSX.utils.book_append_sheet(workbook, diariasSheet, "Diarias");

    XLSX.writeFile(workbook, "relatorio_crm_academia.xlsx");
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold">
            Relatórios
          </h1>

          <button
            onClick={exportarExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-bold"
          >
            Exportar Excel
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-10">
          <h2 className="text-2xl font-bold mb-6">
            Filtros
          </h2>

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

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold">Total de Aulas</h2>

            <p className="text-4xl font-bold text-blue-900 mt-3">
              {dados.totalAulas}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold">Compareceu</h2>

            <p className="text-4xl font-bold text-green-600 mt-3">
              {dados.totalCompareceu}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold">Faltou</h2>

            <p className="text-4xl font-bold text-red-600 mt-3">
              {dados.totalFaltou}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold">Confirmadas</h2>

            <p className="text-4xl font-bold text-blue-600 mt-3">
              {dados.totalConfirmada}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold">Taxa Comparecimento</h2>

            <p className="text-4xl font-bold text-blue-900 mt-3">
              {dados.taxaComparecimento}%
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold">Total de Diárias</h2>

            <p className="text-4xl font-bold text-blue-900 mt-3">
              {dados.totalDiarias}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-10">
          <h2 className="text-2xl font-bold mb-6">
            Aulas por Modalidade
          </h2>

          {Object.entries(dados.modalidades).map(
            ([modalidade, total]: any) => (
              <div
                key={modalidade}
                className="flex justify-between border-b py-3"
              >
                <span>{modalidade}</span>
                <strong>{total}</strong>
              </div>
            )
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-6">
            Aulas Experimentais
          </h2>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Aluno</th>
                <th className="p-3 text-left">Modalidade</th>
                <th className="p-3 text-left">Colaboradora</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {dados.aulas.slice(0, 20).map((aula: any) => (
                <tr key={aula.id} className="border-b">
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