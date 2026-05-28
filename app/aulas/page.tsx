"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function AulasPage() {
  const router = useRouter();

  const [aulas, setAulas] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const [nomeAluno, setNomeAluno] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [modalidade, setModalidade] = useState("MUSCULAÇÃO");
  const [colaboradora, setColaboradora] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [veio, setVeio] = useState(false);
  const [faltou, setFaltou] = useState(false);
  const [remarcou, setRemarcou] = useState(false);
  const [posAulaRealizado, setPosAulaRealizado] = useState(false);
  const [vendaEfetivada, setVendaEfetivada] = useState(false);
  const [codigoMatricula, setCodigoMatricula] = useState("");

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    const unidadeId = localStorage.getItem("unidadeSelecionadaId");

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    carregarAulas();
  }, [router]);

  async function carregarAulas() {
    const unidadeId = localStorage.getItem("unidadeSelecionadaId");

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch(`/api/aulas?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const data = await response.json();

    setAulas(Array.isArray(data) ? data : []);
  }

  function limparFormulario() {
    setEditandoId(null);
    setNomeAluno("");
    setTelefone("");
    setData("");
    setHorario("");
    setModalidade("MUSCULAÇÃO");
    setColaboradora("");
    setObservacoes("");
    setVeio(false);
    setFaltou(false);
    setRemarcou(false);
    setPosAulaRealizado(false);
    setVendaEfetivada(false);
    setCodigoMatricula("");
  }

  function statusAtual() {
    if (vendaEfetivada) return "VENDA EFETIVADA";
    if (veio) return "COMPARECEU";
    if (faltou) return "FALTOU";
    if (remarcou) return "REMARCOU";
    return "AGENDADA";
  }

  async function salvarAula() {
    const unidadeId = localStorage.getItem("unidadeSelecionadaId");

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const dados = {
      id: editandoId,
      unidadeId: Number(unidadeId),
      nomeAluno: nomeAluno.trim().toUpperCase(),
      telefone: telefone.trim(),
      data,
      horario,
      modalidade,
      colaboradora: colaboradora.trim().toUpperCase(),
      observacoes: observacoes.trim().toUpperCase(),
      veio,
      faltou,
      remarcou,
      posAulaRealizado,
      vendaEfetivada,
      codigoMatricula: codigoMatricula.trim(),
      status: statusAtual(),
    };

    const response = await fetch("/api/aulas", {
      method: editandoId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      alert("Erro ao salvar aula");
      return;
    }

    await carregarAulas();
    limparFormulario();
    setMostrarFormulario(false);
  }

  function editarAula(aula: any) {
    setEditandoId(aula.id);
    setNomeAluno(aula.nomeAluno || "");
    setTelefone(aula.telefone || "");
    setData(aula.data || "");
    setHorario(aula.horario || "");
    setModalidade(aula.modalidade || "MUSCULAÇÃO");
    setColaboradora(aula.colaboradora || "");
    setObservacoes(aula.observacoes || "");
    setVeio(Boolean(aula.veio));
    setFaltou(Boolean(aula.faltou));
    setRemarcou(Boolean(aula.remarcou));
    setPosAulaRealizado(Boolean(aula.posAulaRealizado));
    setVendaEfetivada(Boolean(aula.vendaEfetivada));
    setCodigoMatricula(aula.codigoMatricula || "");
    setMostrarFormulario(true);
  }

  async function excluirAula(id: number) {
    if (!confirm("Deseja excluir esta aula?")) return;

    await fetch("/api/aulas", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    await carregarAulas();
  }

  function primeiroNome(nome: string) {
    if (!nome) return "";
    const primeiro = nome.trim().split(" ")[0].toLowerCase();
    return primeiro.charAt(0).toUpperCase() + primeiro.slice(1);
  }

  function formatarData(dataISO: string) {
    if (!dataISO) return "";
    if (dataISO.includes("/")) return dataISO;

    const partes = dataISO.split("-");
    if (partes.length !== 3) return dataISO;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function abrirWhatsApp(tipo: string) {
    const aluno = primeiroNome(nomeAluno);
    const colab = primeiroNome(colaboradora);
    const numero = telefone.replace(/\D/g, "");

    if (!numero) {
      alert("Preencha o telefone antes de abrir o WhatsApp");
      return;
    }

    let mensagem = "";

    if (tipo === "confirmacao") {
      mensagem = `Oie ${aluno}, tudo bem?

Sua aula experimental foi agendada pela atendente *${colab}*.

Data: *${formatarData(data)}*
Horário: *${horario}*
Modalidade: *${modalidade}*

Te esperamos por aqui!

*PRIX ACADEMIA*
Avenida Irmãos Pereira, 251 - Esquina com o posto Flex`;
    }

    if (tipo === "lembrete") {
      mensagem = `Oie ${aluno}, tudo bem?

Passando para te lembrar que sua aula experimental é *Hoje*.

Horário: *${horario}*
Modalidade: *${modalidade}*

Estamos te esperando! Venha com roupa confortável, tênis e sua garrafinha de água para aproveitar ao máximo seu treino experimental!

*${colab}*

*PRIX ACADEMIA*
Avenida Irmãos Pereira, 251 - Esquina com o posto Flex`;
    }

    if (tipo === "pos") {
      mensagem = `Oie ${aluno}, tudo bem?

Aqui é a ${colab} da Prix Academia.

Queria saber se gostou da sua aula experimental 😊

Montamos uma ficha de treino personalizada para te ajudar a alcançar seus objetivos da melhor forma!

Aproveita para começar ainda essa semana com a gente 🚀
Qualquer dúvida, estou por aqui 😊`;
    }

    if (tipo === "nao") {
      mensagem = `Oie ${aluno}

Aqui é a ${colab} da Prix Academia.

Ficamos te esperando para sua aula experimental, mas você não compareceu.

Queremos remarcar para você conhecer a academia e já deixar um treino personalizado preparado para seus objetivos 😊

Vamos agendar ainda essa semana?`;
    }

    window.open(
      `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

  const aulasFiltradas = aulas.filter((aula) => {
    const termo = busca.toUpperCase();

    return (
      aula.nomeAluno?.toUpperCase().includes(termo) ||
      aula.telefone?.includes(busca) ||
      aula.modalidade?.toUpperCase().includes(termo) ||
      aula.status?.toUpperCase().includes(termo)
    );
  });

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Aulas Agendadas
          </h1>

          <button
            onClick={() => {
              limparFormulario();
              setMostrarFormulario(true);
            }}
            className="bg-blue-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            AGENDAR
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Aulas Agendadas</h2>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aula..."
              className="border rounded-xl p-3 w-96"
            />
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Aluno</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Horário</th>
                  <th className="p-3 text-left">Modalidade</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {aulasFiltradas.map((aula) => (
                  <tr key={aula.id} className="border-b">
                    <td className="p-3">{aula.nomeAluno}</td>
                    <td className="p-3">{aula.telefone}</td>
                    <td className="p-3">{formatarData(aula.data)}</td>
                    <td className="p-3">{aula.horario}</td>
                    <td className="p-3">{aula.modalidade}</td>
                    <td className="p-3 font-bold text-yellow-600">
                      {aula.status || "AGENDADA"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarAula(aula)}
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => excluirAula(aula.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg"
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
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-8 rounded-2xl shadow">
            <h2 className="text-4xl font-bold mb-6">
              {editandoId ? "Editar Aula" : "Cadastrar Aula"}
            </h2>

            <div className="flex gap-3 mb-6 flex-wrap">
              <button type="button" onClick={() => abrirWhatsApp("confirmacao")} className="border-4 border-blue-600 text-blue-600 px-4 py-2 rounded-xl font-bold">
                CONFIRMAÇÃO
              </button>

              <button type="button" onClick={() => abrirWhatsApp("lembrete")} className="border-4 border-yellow-500 text-yellow-500 px-4 py-2 rounded-xl font-bold">
                LEMBRETE
              </button>

              <button type="button" onClick={() => abrirWhatsApp("pos")} className="border-4 border-green-600 text-green-600 px-4 py-2 rounded-xl font-bold">
                PÓS AULA
              </button>

              <button type="button" onClick={() => abrirWhatsApp("nao")} className="border-4 border-red-600 text-red-600 px-4 py-2 rounded-xl font-bold">
                NÃO COMPARECEU
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nome do aluno" value={nomeAluno} setValue={setNomeAluno} />
              <Input label="Telefone" value={telefone} setValue={setTelefone} />
              <Input label="Data da aula" value={data} setValue={setData} type="date" />
              <Input label="Horário" value={horario} setValue={setHorario} type="time" />

              <div>
                <label className="block mb-2">Modalidade</label>
                <select
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
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

              <Input label="Colaboradora" value={colaboradora} setValue={setColaboradora} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <Check label="Veio" checked={veio} setChecked={setVeio} />
              <Check label="Faltou" checked={faltou} setChecked={setFaltou} />
              <Check label="Remarcou" checked={remarcou} setChecked={setRemarcou} />
              <Check label="Contato pós aula" checked={posAulaRealizado} setChecked={setPosAulaRealizado} />
              <Check label="Venda efetivada" checked={vendaEfetivada} setChecked={setVendaEfetivada} />
            </div>

            <div className="mt-6">
              <label className="block mb-2 font-semibold">
                Código da Matrícula
              </label>

              <input
                type="text"
                maxLength={8}
                value={codigoMatricula}
                onChange={(e) => setCodigoMatricula(e.target.value)}
                className="w-48 border rounded-xl p-3"
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
                onClick={salvarAula}
                className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold"
              >
                {editandoId ? "Salvar Edição" : "Salvar Aula"}
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

function Check({ label, checked, setChecked }: any) {
  return (
    <label className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl font-bold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />

      {label}
    </label>
  );
}