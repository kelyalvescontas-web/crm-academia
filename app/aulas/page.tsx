"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function AulasPage() {
  const router = useRouter();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [modalidade, setModalidade] = useState("MUSCULAÇÃO");
  const [colaboradora, setColaboradora] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [aulas, setAulas] = useState<any[]>([]);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarAulas();
  }, []);

  async function carregarAulas() {
    const response = await fetch("/api/aulas");
    const data = await response.json();
    setAulas(data);
  }

  function formatarData(dataISO?: string) {
    if (!dataISO) return "";

    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function corStatus(status: string) {
    if (status === "COMPARECEU") return "text-green-600";
    if (status === "FALTOU") return "text-red-600";
    if (status === "CONFIRMADA") return "text-blue-600";

    return "text-yellow-600";
  }

  const aulasFiltradas = aulas.filter((aula) => {
    const termo = busca.toUpperCase();

    return (
      aula.nomeAluno?.toUpperCase().includes(termo) ||
      aula.telefone?.includes(busca) ||
      aula.modalidade?.toUpperCase().includes(termo) ||
      aula.colaboradora?.toUpperCase().includes(termo) ||
      aula.status?.toUpperCase().includes(termo)
    );
  });

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setTelefone("");
    setData("");
    setHorario("");
    setModalidade("MUSCULAÇÃO");
    setColaboradora("");
    setObservacoes("");
  }

  async function salvarAula() {
    const dados = {
      id: editandoId,
      nomeAluno: nome.toUpperCase(),
      telefone,
      data,
      horario,
      modalidade,
      colaboradora: colaboradora.toUpperCase(),
      observacoes: observacoes.toUpperCase(),
    };

    if (editandoId) {
      await fetch("/api/aulas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      alert("Aula editada com sucesso!");
    } else {
      await fetch("/api/aulas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      alert("Aula salva com sucesso!");
    }

    limparFormulario();
    carregarAulas();
  }

  function editarAula(aula: any) {
    setEditandoId(aula.id);
    setNome(aula.nomeAluno);
    setTelefone(aula.telefone);
    setData(aula.data);
    setHorario(aula.horario);
    setModalidade(aula.modalidade);
    setColaboradora(aula.colaboradora);
    setObservacoes(aula.observacoes);
  }

  async function excluirAula(id: number) {
    await fetch("/api/aulas", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    carregarAulas();
  }

  async function alterarStatus(aula: any, status: string) {
    await fetch("/api/aulas", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...aula,
        status,
      }),
    });

    carregarAulas();
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-4 md:p-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Aulas Experimentais
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
              onClick={salvarAula}
              className="bg-blue-900 text-white px-5 py-3 rounded-xl"
            >
              {editandoId ? "Salvar Edição" : "Salvar Aula"}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-2xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">
                Nome do aluno
              </label>

              <input
                type="text"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value.toUpperCase())
                }
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block mb-2">
                Telefone
              </label>

              <input
                type="text"
                value={telefone}
                onChange={(e) =>
                  setTelefone(e.target.value)
                }
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block mb-2">
                Data da aula
              </label>

              <input
                type="date"
                value={data}
                onChange={(e) =>
                  setData(e.target.value)
                }
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block mb-2">
                Horário
              </label>

              <input
                type="time"
                value={horario}
                onChange={(e) =>
                  setHorario(e.target.value)
                }
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block mb-2">
                Modalidade
              </label>

              <select
                value={modalidade}
                onChange={(e) =>
                  setModalidade(e.target.value)
                }
                className="w-full border rounded-xl p-3"
              >
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

            <div>
              <label className="block mb-2">
                Colaboradora
              </label>

              <input
                type="text"
                value={colaboradora}
                onChange={(e) =>
                  setColaboradora(
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full border rounded-xl p-3"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2">
              Observações
            </label>

            <textarea
              value={observacoes}
              onChange={(e) =>
                setObservacoes(
                  e.target.value.toUpperCase()
                )
              }
              className="w-full border rounded-xl p-3 h-32"
            />
          </div>
        </div>

        <div className="mt-10 bg-white p-4 md:p-6 rounded-2xl shadow">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              Aulas Agendadas
            </h2>

            <input
              type="text"
              placeholder="Buscar aula..."
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
                    Aluno
                  </th>

                  <th className="p-3 text-left">
                    Telefone
                  </th>

                  <th className="p-3 text-left">
                    Data
                  </th>

                  <th className="p-3 text-left">
                    Horário
                  </th>

                  <th className="p-3 text-left">
                    Modalidade
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>

                  <th className="p-3 text-left">
                    WhatsApp
                  </th>

                  <th className="p-3 text-left">
                    Presença
                  </th>

                  <th className="p-3 text-left">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {aulasFiltradas.map((aula) => (
                  <tr
                    key={aula.id}
                    className="border-b"
                  >
                    <td className="p-3">
                      {aula.nomeAluno}
                    </td>

                    <td className="p-3">
                      {aula.telefone}
                    </td>

                    <td className="p-3">
                      {formatarData(aula.data)}
                    </td>

                    <td className="p-3">
                      {aula.horario}
                    </td>

                    <td className="p-3">
                      {aula.modalidade}
                    </td>

                    <td
                      className={`p-3 font-bold ${corStatus(
                        aula.status
                      )}`}
                    >
                      {aula.status || "AGENDADA"}
                    </td>

                    <td className="p-3">
                      <a
                        href={`https://wa.me/55${
                          aula.telefone
                        }?text=${encodeURIComponent(
                          `Olá ${aula.nomeAluno}, tudo bem?

Sua aula experimental está confirmada 💪

📅 Data: ${formatarData(
                            aula.data
                          )}

⏰ Horário: ${
                            aula.horario
                          }

🏋️ Modalidade: ${
                            aula.modalidade
                          }

👩‍🏫 Colaboradora: ${
                            aula.colaboradora
                          }

Estamos te esperando!`
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
                            alterarStatus(
                              aula,
                              "CONFIRMADA"
                            )
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg"
                        >
                          Confirmar
                        </button>

                        <button
                          onClick={() =>
                            alterarStatus(
                              aula,
                              "COMPARECEU"
                            )
                          }
                          className="bg-green-600 text-white px-3 py-1 rounded-lg"
                        >
                          Veio
                        </button>

                        <button
                          onClick={() =>
                            alterarStatus(
                              aula,
                              "FALTOU"
                            )
                          }
                          className="bg-red-600 text-white px-3 py-1 rounded-lg"
                        >
                          Faltou
                        </button>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            editarAula(aula)
                          }
                          className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() =>
                            excluirAula(
                              aula.id
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

          {aulasFiltradas.length ===
            0 && (
            <p className="mt-6 text-gray-500">
              Nenhuma aula encontrada.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}