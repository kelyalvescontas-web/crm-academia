"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function AlunosPage() {
  const router = useRouter();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [modalidade, setModalidade] = useState("MUSCULAÇÃO");
  const [plano, setPlano] = useState("MENSAL");
  const [vencimento, setVencimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [colaboradora, setColaboradora] = useState("");

  const [alunos, setAlunos] = useState<any[]>([]);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarAlunos();
  }, []);

  async function carregarAlunos() {
    const response = await fetch("/api/alunos");
    const data = await response.json();
    setAlunos(data);
  }

  function formatarData(dataISO?: string) {
    if (!dataISO) return "";

    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function diasParaVencer(dataISO: string) {
    const hoje = new Date();
    const venc = new Date(dataISO);

    const diff = venc.getTime() - hoje.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function statusAluno(dataISO: string) {
    const dias = diasParaVencer(dataISO);

    if (dias < 0) return "VENCIDO";
    if (dias === 0) return "VENCE HOJE";
    if (dias <= 3) return "VENCENDO";

    return "ATIVO";
  }

  const alunosFiltrados = alunos.filter((aluno) => {
    const termo = busca.toUpperCase();

    return (
      aluno.nome?.toUpperCase().includes(termo) ||
      aluno.telefone?.includes(busca) ||
      aluno.cpf?.includes(busca) ||
      aluno.modalidade?.toUpperCase().includes(termo) ||
      aluno.plano?.toUpperCase().includes(termo)
    );
  });

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setTelefone("");
    setCpf("");
    setModalidade("MUSCULAÇÃO");
    setPlano("MENSAL");
    setVencimento("");
    setObservacoes("");
    setColaboradora("");
  }

  async function salvarAluno() {
    const dados = {
      id: editandoId,
      nome: nome.toUpperCase(),
      telefone,
      cpf,
      modalidade,
      plano,
      vencimento,
      observacoes: observacoes.toUpperCase(),
      colaboradora: colaboradora.toUpperCase(),
    };

    if (editandoId) {
      await fetch("/api/alunos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      alert("Aluno editado com sucesso!");
    } else {
      await fetch("/api/alunos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      alert("Aluno cadastrado com sucesso!");
    }

    limparFormulario();
    carregarAlunos();
  }

  function editarAluno(aluno: any) {
    setEditandoId(aluno.id);
    setNome(aluno.nome);
    setTelefone(aluno.telefone);
    setCpf(aluno.cpf || "");
    setModalidade(aluno.modalidade);
    setPlano(aluno.plano);
    setVencimento(aluno.vencimento);
    setObservacoes(aluno.observacoes || "");
    setColaboradora(aluno.colaboradora || "");
  }

  async function excluirAluno(id: number) {
    await fetch("/api/alunos", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    carregarAlunos();
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Alunos Fixos
          </h1>

          <div className="flex gap-3">
            {editandoId && (
              <button
                onClick={limparFormulario}
                className="bg-gray-500 text-white px-5 py-3 rounded-xl"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={salvarAluno}
              className="bg-blue-900 text-white px-5 py-3 rounded-xl"
            >
              {editandoId ? "Salvar Edição" : "Cadastrar Aluno"}
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label>Nome</label>

              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value.toUpperCase())}
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Telefone</label>

              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>CPF</label>

              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
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
              <label>Plano</label>

              <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                className="w-full border p-3 rounded-xl"
              >
                <option>MENSAL</option>
                <option>TRIMESTRAL</option>
                <option>SEMESTRAL</option>
                <option>ANUAL</option>
              </select>
            </div>

            <div>
              <label>Vencimento</label>

              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <div>
              <label>Colaboradora</label>

              <input
                type="text"
                value={colaboradora}
                onChange={(e) =>
                  setColaboradora(e.target.value.toUpperCase())
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
                setObservacoes(e.target.value.toUpperCase())
              }
              className="w-full border p-3 rounded-xl h-32"
            />
          </div>
        </div>

        <div className="mt-10 bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Alunos Cadastrados
            </h2>

            <input
              type="text"
              placeholder="Buscar por nome, telefone, CPF, modalidade ou plano"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-96 border p-3 rounded-xl"
            />
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Telefone</th>
                <th className="p-3 text-left">Modalidade</th>
                <th className="p-3 text-left">Plano</th>
                <th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">WhatsApp</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {alunosFiltrados.map((aluno) => (
                <tr key={aluno.id} className="border-b">
                  <td className="p-3">{aluno.nome}</td>
                  <td className="p-3">{aluno.telefone}</td>
                  <td className="p-3">{aluno.modalidade}</td>
                  <td className="p-3">{aluno.plano}</td>

                  <td className="p-3">
                    {formatarData(aluno.vencimento)}
                  </td>

                  <td
                    className={`p-3 font-bold ${
                      diasParaVencer(aluno.vencimento) < 0
                        ? "text-red-600"
                        : diasParaVencer(aluno.vencimento) <= 3
                        ? "text-yellow-500"
                        : "text-green-600"
                    }`}
                  >
                    {statusAluno(aluno.vencimento)}
                  </td>

                  <td className="p-3">
                    <a
                      href={`https://wa.me/55${
                        aluno.telefone
                      }?text=${encodeURIComponent(
                        `Olá ${aluno.nome}, tudo bem?

Seu plano ${aluno.plano} na academia vence em ${formatarData(
                          aluno.vencimento
                        )}.

Entre em contato para renovar e continuar treinando 💪`
                      )}`}
                      target="_blank"
                      className="text-green-600 font-bold"
                    >
                      WhatsApp
                    </a>
                  </td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => editarAluno(aluno)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirAluno(aluno.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {alunosFiltrados.length === 0 && (
            <p className="mt-6 text-gray-500">
              Nenhum aluno encontrado.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}