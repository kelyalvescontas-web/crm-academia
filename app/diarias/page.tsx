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

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Diárias</h1>

          <button
            onClick={() => {
              limparFormulario();
              setMostrarFormulario(true);
            }}
            className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold"
          >
            Cadastrar Diária
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Nome</th>
                <th className="p-4 text-left">Telefone</th>
                <th className="p-4 text-left">Data Inicial</th>
                <th className="p-4 text-left">Data Final</th>
                <th className="p-4 text-left">Dias</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {diarias.map((diaria) => (
                <tr key={diaria.id} className="border-b">
                  <td className="p-4">{diaria.nome}</td>
                  <td className="p-4">{diaria.telefone}</td>
                  <td className="p-4">{formatarData(diaria.dataInicio)}</td>
                  <td className="p-4">{formatarData(diaria.dataFinal)}</td>
                  <td className="p-4">{diaria.quantidadeDias}</td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => editarDiaria(diaria)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluirDiaria(diaria.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {diarias.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={6}>
                    Nenhuma diária cadastrada para esta unidade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-8 rounded-2xl shadow">
            <h2 className="text-4xl font-bold mb-6">
              {editandoId ? "Editar Diária" : "Cadastrar Diária"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="mt-6">
              <label className="block mb-2">Observações</label>

              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full border rounded-xl p-3 h-32"
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={salvarDiaria}
                className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold"
              >
                {editandoId ? "Salvar Edição" : "Salvar Diária"}
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
                className="bg-gray-500 text-white px-8 py-4 rounded-xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
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