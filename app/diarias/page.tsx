"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function DiariasPage() {
  const router = useRouter();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [quantidadeDias, setQuantidadeDias] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [colaboradora, setColaboradora] = useState("");

  const [diarias, setDiarias] = useState<any[]>([]);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarDiarias();
  }, []);

  async function carregarDiarias() {
    const response = await fetch("/api/diarias");
    const data = await response.json();
    setDiarias(data);
  }

  function calcularDataFinal(data: string, dias: number) {
    const novaData = new Date(data);

    novaData.setDate(novaData.getDate() + dias);

    return novaData.toISOString().split("T")[0];
  }

  function formatarData(dataISO?: string) {
    if (!dataISO) return "";

    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function statusDiaria(dataFinal: string) {
    const hoje = new Date();
    const final = new Date(dataFinal);

    if (final < hoje) {
      return "ENCERRADA";
    }

    return "ATIVA";
  }

  const diariasFiltradas = diarias.filter((diaria) => {
    const termo = busca.toUpperCase();

    return (
      diaria.nome?.toUpperCase().includes(termo) ||
      diaria.telefone?.includes(busca) ||
      diaria.cpf?.includes(busca) ||
      diaria.colaboradora?.toUpperCase().includes(termo)
    );
  });

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setTelefone("");
    setCpf("");
    setDataInicio("");
    setQuantidadeDias(1);
    setObservacoes("");
    setColaboradora("");
  }

  async function salvarDiaria() {
    const dataFinal = calcularDataFinal(
      dataInicio,
      quantidadeDias
    );

    const dados = {
      id: editandoId,
      nome: nome.toUpperCase(),
      telefone,
      cpf,
      dataInicio,
      quantidadeDias,
      dataFinal,
      observacoes: observacoes.toUpperCase(),
      colaboradora: colaboradora.toUpperCase(),
    };

    if (editandoId) {
      await fetch("/api/diarias", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      alert("Diária editada com sucesso!");
    } else {
      await fetch("/api/diarias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      alert("Diária cadastrada com sucesso!");
    }

    limparFormulario();
    carregarDiarias();
  }

  function editarDiaria(diaria: any) {
    setEditandoId(diaria.id);
    setNome(diaria.nome);
    setTelefone(diaria.telefone);
    setCpf(diaria.cpf);
    setDataInicio(diaria.dataInicio);
    setQuantidadeDias(diaria.quantidadeDias);
    setObservacoes(diaria.observacoes);
    setColaboradora(diaria.colaboradora);
  }

  async function excluirDiaria(id: number) {
    await fetch("/api/diarias", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    carregarDiarias();
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-4 md:p-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Controle de Diárias
          </h1>

          <div className="flex flex-wrap gap-3">
            {editandoId && (
              <button
                onClick={limparFormulario}
                className="bg-gray-500 text-white px-5 py-3 rounded-xl"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={salvarDiaria}
              className="bg-blue-900 text-white px-5 py-3 rounded-xl"
            >
              {editandoId
                ? "Salvar Edição"
                : "Cadastrar Diária"}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-2xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>Nome</label>

              <input
                type="text"
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Telefone</label>

              <input
                type="text"
                value={telefone}
                onChange={(e) =>
                  setTelefone(e.target.value)
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>CPF</label>

              <input
                type="text"
                value={cpf}
                onChange={(e) =>
                  setCpf(e.target.value)
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Data Início</label>

              <input
                type="date"
                value={dataInicio}
                onChange={(e) =>
                  setDataInicio(e.target.value)
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Quantidade Dias</label>

              <input
                type="number"
                value={quantidadeDias}
                onChange={(e) =>
                  setQuantidadeDias(
                    Number(e.target.value)
                  )
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Colaboradora</label>

              <input
                type="text"
                value={colaboradora}
                onChange={(e) =>
                  setColaboradora(
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>
          </div>

          <div className="mt-6">
            <label>Observações</label>

            <textarea
              value={observacoes}
              onChange={(e) =>
                setObservacoes(
                  e.target.value.toUpperCase()
                )
              }
              className="w-full border p-3 rounded-xl h-32"
            />
          </div>
        </div>

        <div className="mt-10 bg-white p-4 md:p-6 rounded-2xl shadow">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              Diárias Cadastradas
            </h2>

            <input
              type="text"
              placeholder="Buscar diária..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              className="w-full md:w-96 border p-3 rounded-xl"
            />
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">
                    Nome
                  </th>

                  <th className="p-3 text-left">
                    Telefone
                  </th>

                  <th className="p-3 text-left">
                    CPF
                  </th>

                  <th className="p-3 text-left">
                    Início
                  </th>

                  <th className="p-3 text-left">
                    Final
                  </th>

                  <th className="p-3 text-left">
                    Dias
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>

                  <th className="p-3 text-left">
                    WhatsApp
                  </th>

                  <th className="p-3 text-left">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {diariasFiltradas.map((diaria) => (
                  <tr
                    key={diaria.id}
                    className="border-b"
                  >
                    <td className="p-3">
                      {diaria.nome}
                    </td>

                    <td className="p-3">
                      {diaria.telefone}
                    </td>

                    <td className="p-3">
                      {diaria.cpf}
                    </td>

                    <td className="p-3">
                      {formatarData(
                        diaria.dataInicio
                      )}
                    </td>

                    <td className="p-3">
                      {formatarData(
                        diaria.dataFinal
                      )}
                    </td>

                    <td className="p-3">
                      {diaria.quantidadeDias}
                    </td>

                    <td
                      className={`p-3 font-bold ${
                        statusDiaria(
                          diaria.dataFinal
                        ) === "ATIVA"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {statusDiaria(
                        diaria.dataFinal
                      )}
                    </td>

                    <td className="p-3">
                      <a
                        href={`https://wa.me/55${
                          diaria.telefone
                        }?text=${encodeURIComponent(
                          `Olá ${diaria.nome}, tudo bem?

Sua diária está registrada 💪

📅 Início: ${formatarData(
                            diaria.dataInicio
                          )}

📅 Final: ${formatarData(
                            diaria.dataFinal
                          )}

Bom treino!`
                        )}`}
                        target="_blank"
                        className="text-green-600 font-bold"
                      >
                        WhatsApp
                      </a>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            editarDiaria(diaria)
                          }
                          className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() =>
                            excluirDiaria(
                              diaria.id
                            )
                          }
                          className="bg-red-600 text-white px-3 py-1 rounded-lg"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {diariasFiltradas.length ===
            0 && (
            <p className="mt-6 text-gray-500">
              Nenhuma diária encontrada.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}