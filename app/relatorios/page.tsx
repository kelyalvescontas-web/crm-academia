"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [colaboradora, setColaboradora] = useState("TODAS");
  const [vendedora, setVendedora] = useState("TODAS");
  const [plano, setPlano] = useState("TODOS");
  const [tipoAluno, setTipoAluno] = useState("TODOS");

  const [configuracao, setConfiguracao] = useState<any>({
    nomeAcademia: "CRM Academia",
    logo: "",
  });

  const [dados, setDados] = useState<any>({
    totalAulas: 0,
    totalDiarias: 0,
    totalCompareceu: 0,
    totalFaltou: 0,
    vendasEfetivadas: 0,
    taxaConversao: 0,
    modalidades: {},
    aulasPorColaboradora: [],
    vendasPorVendedora: [],
    conversaoAgendouVendeu: [],
    planosVendidos: {},
    tiposAluno: {},
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
    carregarConfiguracao();
  }, []);

  async function carregarConfiguracao() {
    const unidadeId = pegarUnidadeAtual();
    if (!unidadeId) return;

    const response = await fetch(`/api/configuracoes?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    if (!response.ok) return;

    const data = await response.json();

    setConfiguracao({
      nomeAcademia: data.nomeAcademia || "CRM Academia",
      logo: data.logo || "",
    });
  }

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
    if (colaboradora) params.append("colaboradora", colaboradora);
    if (vendedora) params.append("vendedora", vendedora);
    if (plano) params.append("plano", plano);
    if (tipoAluno) params.append("tipoAluno", tipoAluno);

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
    setColaboradora("TODAS");
    setVendedora("TODAS");
    setPlano("TODOS");
    setTipoAluno("TODOS");

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

  function carregarImagemBase64(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!src) {
        reject("Sem imagem");
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => reject("Erro ao carregar imagem");
      img.src = src;
    });
  }

  async function exportarPDF() {
    const doc = new jsPDF("landscape");

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 297, 30, "F");

    try {
      if (configuracao.logo) {
        const logoBase64 = await carregarImagemBase64(configuracao.logo);
        doc.addImage(logoBase64, "PNG", 12, 6, 32, 18);
      }
    } catch (error) {}

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(configuracao.nomeAcademia || "Relatório CRM Academia", 50, 13);

    doc.setFontSize(11);
    doc.text("Relatório CRM Academia", 50, 22);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(
      `Período: ${dataInicial ? formatarData(dataInicial) : "Início"} até ${
        dataFinal ? formatarData(dataFinal) : "Hoje"
      }`,
      14,
      42
    );

    autoTable(doc, {
      startY: 50,
      head: [["Indicador", "Valor"]],
      body: [
        ["Unidade", configuracao.nomeAcademia || "-"],
        ["Total de Aulas", dados.totalAulas],
        ["Compareceu", dados.totalCompareceu],
        ["Faltou", dados.totalFaltou],
        ["Vendas Efetivadas", dados.vendasEfetivadas],
        ["Taxa de Conversão", `${dados.taxaConversao || 0}%`],
        ["Total de Diárias", dados.totalDiarias],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Quem Agendou", "Quem Vendeu", "Quantidade"]],
      body: (dados.conversaoAgendouVendeu || []).map((item: any) => [
        item.colaboradora,
        item.vendedora,
        item.quantidade,
      ]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [
        [
          "Data",
          "Aluno",
          "Modalidade",
          "Colaboradora",
          "Status",
          "Plano",
          "Vendedora",
          "Conversão",
          "Tipo",
        ],
      ],
      body: (dados.aulas || []).map((aula: any) => [
        formatarData(aula.data),
        aula.nomeAluno,
        aula.modalidade,
        aula.colaboradora,
        aula.status,
        aula.planoFechado || "-",
        aula.vendedora || "-",
        formatarData(aula.dataConversao) || "-",
        aula.tipoAluno || "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: [202, 138, 4], textColor: 255 },
      styles: { fontSize: 8 },
    });

    doc.save("relatorio_crm_academia.pdf");
  }

  const colaboradorasUnicas = Array.from(
    new Set(
      dados.aulas
        ?.map((aula: any) => aula.colaboradora)
        .filter(Boolean)
        .map((nome: string) => nome.toUpperCase())
    )
  ).sort();

  const vendedorasUnicas = Array.from(
    new Set(
      dados.aulas
        ?.map((aula: any) => aula.vendedora)
        .filter(Boolean)
        .map((nome: string) => nome.toUpperCase())
    )
  ).sort();

  function exportarExcel() {
    const relatorioAulas = dados.aulas.map((aula: any) => ({
      Dia: formatarData(aula.data),
      Aluno: aula.nomeAluno,
      Modalidade: aula.modalidade,
      Colaboradora: aula.colaboradora,
      Status: aula.status,
      Plano: aula.planoFechado || "",
      Vendedora: aula.vendedora || "",
      "Data Conversão": formatarData(aula.dataConversao),
      "Tipo Aluno": aula.tipoAluno || "",
    }));

    const relatorioResumo = [
      {
        Unidade: configuracao.nomeAcademia,
        "Total Aulas": dados.totalAulas,
        Compareceu: dados.totalCompareceu,
        Faltou: dados.totalFaltou,
        "Vendas Efetivadas": dados.vendasEfetivadas,
        "Taxa Conversão": `${dados.taxaConversao}%`,
        "Total Diárias": dados.totalDiarias,
      },
    ];

    const relatorioConversao = dados.conversaoAgendouVendeu.map((item: any) => ({
      "Quem Agendou": item.colaboradora,
      "Quem Vendeu": item.vendedora,
      Quantidade: item.quantidade,
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(relatorioResumo), "Resumo");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(relatorioAulas), "Aulas");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(relatorioConversao), "Conversão");

    XLSX.writeFile(workbook, "relatorio_crm_academia.xlsx");
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-gray-600 mt-1">
              Unidade: {configuracao.nomeAcademia}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportarExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-bold"
            >
              Exportar Excel
            </button>

            <button
              onClick={exportarPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-bold"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-10">
          <h2 className="text-2xl font-bold mb-6">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FiltroData label="Data Inicial" value={dataInicial} setValue={setDataInicial} />
            <FiltroData label="Data Final" value={dataFinal} setValue={setDataFinal} />

            <FiltroSelect label="Modalidade" value={modalidade} setValue={setModalidade}>
              <option>TODAS</option>
              <option>MUSCULAÇÃO</option>
              <option>PUMP</option>
              <option>GAP</option>
              <option>BOXE</option>
              <option>JIU-JITSU</option>
              <option>FUNCIONAL</option>
              <option>RITMOS</option>
              <option>P-COMBAT</option>
            </FiltroSelect>

            <FiltroSelect label="Colaboradora" value={colaboradora} setValue={setColaboradora}>
              <option>TODAS</option>
              {colaboradorasUnicas.map((nome: any) => (
                <option key={nome}>{nome}</option>
              ))}
            </FiltroSelect>

            <FiltroSelect label="Vendedora" value={vendedora} setValue={setVendedora}>
              <option>TODAS</option>
              {vendedorasUnicas.map((nome: any) => (
                <option key={nome}>{nome}</option>
              ))}
            </FiltroSelect>

            <FiltroSelect label="Plano" value={plano} setValue={setPlano}>
              <option>TODOS</option>
              <option>MENSAL</option>
              <option>TRIMESTRAL</option>
              <option>SEMESTRAL</option>
              <option>ANUAL</option>
              <option>OUTRO</option>
            </FiltroSelect>

            <FiltroSelect label="Tipo do aluno" value={tipoAluno} setValue={setTipoAluno}>
              <option>TODOS</option>
              <option>NOVO</option>
              <option>RETORNO</option>
              <option>RENOVAÇÃO</option>
            </FiltroSelect>

            <div className="flex items-end gap-3">
              <button onClick={carregarRelatorios} className="bg-blue-900 text-white px-5 py-3 rounded-xl">
                Filtrar
              </button>

              <button onClick={limparFiltros} className="bg-gray-500 text-white px-5 py-3 rounded-xl">
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 mb-10">
          <Card titulo="Total Aulas" valor={dados.totalAulas} cor="text-blue-700" />
          <Card titulo="Compareceu" valor={dados.totalCompareceu} cor="text-green-600" />
          <Card titulo="Faltou" valor={dados.totalFaltou} cor="text-red-600" />
          <Card titulo="Vendas" valor={dados.vendasEfetivadas} cor="text-yellow-600" />
          <Card titulo="Conversão" valor={`${dados.taxaConversao || 0}%`} cor="text-green-700" />
          <Card titulo="Diárias" valor={dados.totalDiarias} cor="text-purple-700" />
        </div>

        <BlocoTitulo titulo="Conversão: Quem Agendou x Quem Vendeu" />
        <TabelaConversao dados={dados.conversaoAgendouVendeu} />

        <BlocoTitulo titulo="Conversão por Colaboradora que Agendou" />
        <TabelaColaboradoras dados={dados.aulasPorColaboradora} />

        <BlocoTitulo titulo="Vendas por Vendedora" />
        <TabelaVendedoras dados={dados.vendasPorVendedora} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <TabelaObjeto titulo="Planos Vendidos" dados={dados.planosVendidos} coluna="Plano" />
          <TabelaObjeto titulo="Tipo de Aluno" dados={dados.tiposAluno} coluna="Tipo" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-6">Relatório de Aulas</h2>

          <div className="overflow-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Dia</th>
                  <th className="p-3 text-left">Aluno</th>
                  <th className="p-3 text-left">Modalidade</th>
                  <th className="p-3 text-left">Colaboradora</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Plano</th>
                  <th className="p-3 text-left">Vendedora</th>
                  <th className="p-3 text-left">Conversão</th>
                  <th className="p-3 text-left">Tipo</th>
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
                    <td className="p-3">{aula.planoFechado || "-"}</td>
                    <td className="p-3">{aula.vendedora || "-"}</td>
                    <td className="p-3">{formatarData(aula.dataConversao) || "-"}</td>
                    <td className="p-3">{aula.tipoAluno || "-"}</td>
                  </tr>
                ))}

                {dados.aulas.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={9}>
                      Nenhuma aula encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function FiltroData({ label, value, setValue }: any) {
  return (
    <div>
      <label>{label}</label>
      <input type="date" value={value} onChange={(e) => setValue(e.target.value)} className="w-full border p-3 rounded-xl" />
    </div>
  );
}

function FiltroSelect({ label, value, setValue, children }: any) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full border p-3 rounded-xl">
        {children}
      </select>
    </div>
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

function BlocoTitulo({ titulo }: any) {
  return <h2 className="text-2xl font-bold mb-4 mt-8">{titulo}</h2>;
}

function TabelaConversao({ dados }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow mb-10 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left">Quem Agendou</th>
            <th className="p-3 text-left">Quem Vendeu</th>
            <th className="p-3 text-left">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {dados?.map((item: any, index: number) => (
            <tr key={index} className="border-b">
              <td className="p-3">{item.colaboradora}</td>
              <td className="p-3">{item.vendedora}</td>
              <td className="p-3 font-bold">{item.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaColaboradoras({ dados }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow mb-10 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left">Colaboradora</th>
            <th className="p-3 text-left">Aulas Agendadas</th>
            <th className="p-3 text-left">Conversões</th>
            <th className="p-3 text-left">Taxa</th>
          </tr>
        </thead>
        <tbody>
          {dados?.map((item: any) => (
            <tr key={item.colaboradora} className="border-b">
              <td className="p-3">{item.colaboradora}</td>
              <td className="p-3">{item.aulas}</td>
              <td className="p-3">{item.conversoes}</td>
              <td className="p-3 font-bold">{item.taxaConversao}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaVendedoras({ dados }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow mb-10 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left">Vendedora</th>
            <th className="p-3 text-left">Vendas</th>
            <th className="p-3 text-left">Taxa Geral</th>
          </tr>
        </thead>
        <tbody>
          {dados?.map((item: any) => (
            <tr key={item.vendedora} className="border-b">
              <td className="p-3">{item.vendedora}</td>
              <td className="p-3">{item.vendas}</td>
              <td className="p-3 font-bold">{item.taxaConversao}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaObjeto({ titulo, dados, coluna }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-6">{titulo}</h2>

      {Object.entries(dados || {}).length === 0 ? (
        <p className="text-gray-500">Nenhum registro encontrado.</p>
      ) : (
        Object.entries(dados || {}).map(([nome, total]: any) => (
          <div key={nome} className="flex justify-between border-b py-3">
            <span>
              {coluna}: {nome}
            </span>
            <strong>{total}</strong>
          </div>
        ))
      )}
    </div>
  );
}