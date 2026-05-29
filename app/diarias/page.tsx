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

export default function DiariasPage() {
  const router = useRouter();

  const [diarias, setDiarias] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busca, setBusca] = useState("");
  const [dataInicialFiltro, setDataInicialFiltro] = useState("");
  const [dataFinalFiltro, setDataFinalFiltro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [quantidadeDias, setQuantidadeDias] = useState(1);
  const [colaboradora, setColaboradora] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarDiarias();
  }, [router]);

  function hojeISO() {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  }

  function statusDiaria(dataFinal: string) {
    return dataFinal >= hojeISO() ? "ATIVO" : "FINALIZADO";
  }

  function corStatusDiaria(dataFinal: string) {
    return dataFinal >= hojeISO() ? "#16a34a" : "#dc2626";
  }

  function formatarData(dataISO: string) {
    if (!dataISO) return "";
    if (dataISO.includes("/")) return dataISO;

    const partes = dataISO.split("-");
    if (partes.length !== 3) return dataISO;

    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  async function carregarDiarias() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch(`/api/diarias?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const data = await response.json();
    setDiarias(Array.isArray(data) ? data : []);
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setTelefone("");
    setCpf("");
    setDataInicio("");
    setQuantidadeDias(1);
    setColaboradora("");
    setObservacoes("");
  }

  async function salvarDiaria() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch("/api/diarias", {
      method: editandoId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: editandoId,
        nome: nome.trim().toUpperCase(),
        telefone: telefone.trim(),
        cpf: cpf.trim(),
        dataInicio,
        quantidadeDias,
        colaboradora: colaboradora.trim().toUpperCase(),
        observacoes: observacoes.trim().toUpperCase(),
        unidadeId: Number(unidadeId),
      }),
    });

    if (response.ok) {
      await carregarDiarias();
      limparFormulario();
      setMostrarFormulario(false);
    } else {
      alert("Erro ao salvar diária");
    }
  }

  function editarDiaria(diaria: any) {
    setEditandoId(diaria.id);
    setNome(diaria.nome || "");
    setTelefone(diaria.telefone || "");
    setCpf(diaria.cpf || "");
    setDataInicio(diaria.dataInicio || "");
    setQuantidadeDias(diaria.quantidadeDias || 1);
    setColaboradora(diaria.colaboradora || "");
    setObservacoes(diaria.observacoes || "");
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirDiaria(id: number) {
    if (!confirm("Deseja excluir esta diária?")) return;

    await fetch("/api/diarias", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    await carregarDiarias();
  }

  const diariasFiltradas = diarias.filter((diaria) => {
    const termo = busca.toUpperCase();

    const bateBusca =
      diaria.nome?.toUpperCase().includes(termo) ||
      diaria.telefone?.includes(busca) ||
      diaria.cpf?.includes(busca) ||
      diaria.colaboradora?.toUpperCase().includes(termo);

    const bateDataInicial =
      !dataInicialFiltro || diaria.dataInicio >= dataInicialFiltro;

    const bateDataFinal =
      !dataFinalFiltro || diaria.dataInicio <= dataFinalFiltro;

    return bateBusca && bateDataInicial && bateDataFinal;
  });

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Diárias</h1>

          <button
            onClick={() => {
              limparFormulario();
              setMostrarFormulario(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="bg-blue-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            Cadastrar Diária
          </button>
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-5 rounded-2xl shadow mb-6">
            <h2 className="text-2xl font-bold mb-5">
              {editandoId ? "Editar Diária" : "Cadastrar Diária"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Nome" value={nome} setValue={setNome} />
              <Input label="Telefone" value={telefone} setValue={setTelefone} />
              <Input label="CPF" value={cpf} setValue={setCpf} />

              <Input
                label="Data Inicial"
                type="date"
                value={dataInicio}
                setValue={setDataInicio}
              />

              <Input
                label="Quantidade de Dias"
                type="number"
                value={quantidadeDias}
                setValue={setQuantidadeDias}
              />

              <Input
                label="Colaboradora"
                value={colaboradora}
                setValue={setColaboradora}
              />
            </div>

            <div className="mt-5">
              <label className="block mb-2">Observações</label>

              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full border rounded-xl p-3 h-28"
              />
            </div>

            <div className="flex gap-4 mt-5">
              <button
                onClick={salvarDiaria}
                className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold"
              >
                {editandoId ? "Salvar Edição" : "Salvar Diária"}
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl shadow mb-8">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-3">Diárias Cadastradas</h2>

              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, telefone, CPF ou colaboradora..."
                className="border rounded-xl p-3 w-96 max-w-full"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block mb-1 font-semibold">Data início</label>
                <input
                  type="date"
                  value={dataInicialFiltro}
                  onChange={(e) => setDataInicialFiltro(e.target.value)}
                  className="border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Data fim</label>
                <input
                  type="date"
                  value={dataFinalFiltro}
                  onChange={(e) => setDataFinalFiltro(e.target.value)}
                  className="border rounded-xl p-3"
                />
              </div>

              <button
                onClick={() => {
                  setBusca("");
                  setDataInicialFiltro("");
                  setDataFinalFiltro("");
                }}
                className="bg-gray-500 text-white px-5 py-3 rounded-xl font-bold self-end"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-left">Data Inicial</th>
                  <th className="p-3 text-left">Data Final</th>
                  <th className="p-3 text-left">Dias</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {diariasFiltradas.map((diaria) => (
                  <tr key={diaria.id} className="border-b">
                    <td className="p-3">{diaria.nome}</td>
                    <td className="p-3">{diaria.telefone}</td>
                    <td className="p-3">{formatarData(diaria.dataInicio)}</td>
                    <td className="p-3">{formatarData(diaria.dataFinal)}</td>
                    <td className="p-3">{diaria.quantidadeDias}</td>

                    <td
                      className="p-3 font-bold"
                      style={{
                        color: corStatusDiaria(diaria.dataFinal),
                      }}
                    >
                      {statusDiaria(diaria.dataFinal)}
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarDiaria(diaria)}
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-bold"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => excluirDiaria(diaria.id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {diariasFiltradas.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={7}>
                      Nenhuma diária encontrada.
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

function Input({ label, value, setValue, type = "text" }: any) {
  return (
    <div>
      <label className="block mb-2">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}