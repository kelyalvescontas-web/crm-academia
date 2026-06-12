"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

function pegarUsuarioAtual() {
  return JSON.parse(localStorage.getItem("usuario") || "{}");
}

function pegarUnidadeAtual() {
  const usuario = pegarUsuarioAtual();

  if (usuario.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId");
  }

  return String(usuario.unidadeId || "");
}

function hojeISO() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const ano = partes.find((p) => p.type === "year")?.value || "";
  const mes = partes.find((p) => p.type === "month")?.value || "";
  const dia = partes.find((p) => p.type === "day")?.value || "";

  return `${ano}-${mes}-${dia}`;
}

function dataLocalISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export default function DiariasPage() {
  const router = useRouter();

  const [diarias, setDiarias] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [dataInicialFiltro, setDataInicialFiltro] = useState("");
  const [dataFinalFiltro, setDataFinalFiltro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [quantidadeDias, setQuantidadeDias] = useState(1);
  const [colaboradora, setColaboradora] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tipoDiaria, setTipoDiaria] = useState("PAGA");

  const [converteuVenda, setConverteuVenda] = useState(false);
  const [planoConvertido, setPlanoConvertido] = useState("MENSAL");
  const [vendedoraConversao, setVendedoraConversao] = useState("");
  const [dataConversao, setDataConversao] = useState(hojeISO());

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarDiarias();
  }, [router]);

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
  }

  function formatarTelefone(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 2) return numeros;

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)})${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)})${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  function telefoneValido(valor: string) {
    const numeros = somenteNumeros(valor);
    return numeros.length === 10 || numeros.length === 11;
  }

  function calcularDataFinal(inicio: string, dias: number) {
    if (!inicio) return "";

    const data = new Date(`${inicio}T00:00:00`);
    data.setDate(data.getDate() + Number(dias || 1) - 1);

    return dataLocalISO(data);
  }

  function statusDiaria(dataFinal: string) {
    return dataFinal >= hojeISO() ? "ATIVA" : "FINALIZADA";
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
    setTipoDiaria("PAGA");
    setConverteuVenda(false);
    setPlanoConvertido("MENSAL");
    setVendedoraConversao("");
    setDataConversao(hojeISO());
    setSalvando(false);
  }

  async function salvarDiaria() {
    if (salvando) return;

    const unidadeId = pegarUnidadeAtual();
    const usuario = pegarUsuarioAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    if (!nome.trim()) {
      alert("Preencha o nome.");
      return;
    }

    if (!dataInicio) {
      alert("Preencha a data inicial.");
      return;
    }

    if (!telefoneValido(telefone)) {
      alert("Telefone inválido. Preencha no formato (XX)XXXXX-XXXX.");
      return;
    }

    if (converteuVenda && !vendedoraConversao.trim()) {
      alert("Informe a vendedora que converteu a diária.");
      return;
    }

    setSalvando(true);

    const dataFinal = calcularDataFinal(dataInicio, quantidadeDias);
    const status = statusDiaria(dataFinal);

    try {
      const response = await fetch("/api/diarias", {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editandoId,
          nome: nome.trim().toUpperCase(),
          telefone: formatarTelefone(telefone.trim()),
          cpf: cpf.trim(),
          dataInicio,
          dataFinal,
          quantidadeDias: Number(quantidadeDias),
          colaboradora: colaboradora.trim().toUpperCase(),
          observacoes: observacoes.trim().toUpperCase(),
          status,
          tipoDiaria,

          converteuVenda,
          planoConvertido: converteuVenda ? planoConvertido : "",
          vendedoraConversao: converteuVenda ? vendedoraConversao.trim().toUpperCase() : "",
          dataConversao: converteuVenda ? dataConversao : "",

          unidadeId: Number(unidadeId),
          usuarioId: usuario?.id,
          usuarioNome: usuario?.nome,
          usuarioCargo: usuario?.cargo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarDiarias();
        limparFormulario();
        setMostrarFormulario(false);
      } else {
        alert(data?.error || "Erro ao salvar diária");
        setSalvando(false);
      }
    } catch (error) {
      alert("Erro ao salvar diária");
      setSalvando(false);
    }
  }

  function editarDiaria(diaria: any) {
    setEditandoId(diaria.id);
    setNome(diaria.nome || "");
    setTelefone(formatarTelefone(diaria.telefone || ""));
    setCpf(diaria.cpf || "");
    setDataInicio(diaria.dataInicio || "");
    setQuantidadeDias(diaria.quantidadeDias || 1);
    setColaboradora(diaria.colaboradora || "");
    setObservacoes(diaria.observacoes || "");
    setTipoDiaria(diaria.tipoDiaria || "PAGA");
    setConverteuVenda(Boolean(diaria.converteuVenda));
    setPlanoConvertido(diaria.planoConvertido || "MENSAL");
    setVendedoraConversao(diaria.vendedoraConversao || "");
    setDataConversao(diaria.dataConversao || hojeISO());
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirDiaria(id: number) {
    if (!confirm("Deseja excluir esta diária?")) return;

    const usuario = pegarUsuarioAtual();

    await fetch("/api/diarias", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        usuarioId: usuario?.id,
        usuarioNome: usuario?.nome,
        usuarioCargo: usuario?.cargo,
      }),
    });

    await carregarDiarias();
  }

  const diariasFiltradas = diarias.filter((diaria) => {
    const termo = busca.toUpperCase();
    const statusAtual = statusDiaria(diaria.dataFinal);

    const bateBusca =
      diaria.nome?.toUpperCase().includes(termo) ||
      diaria.telefone?.includes(busca) ||
      diaria.cpf?.includes(busca) ||
      diaria.colaboradora?.toUpperCase().includes(termo) ||
      diaria.tipoDiaria?.toUpperCase().includes(termo) ||
      diaria.vendedoraConversao?.toUpperCase().includes(termo) ||
      diaria.planoConvertido?.toUpperCase().includes(termo) ||
      statusAtual.toUpperCase().includes(termo);

    const bateStatus = !statusFiltro || statusAtual === statusFiltro;

    const bateDataInicial =
      !dataInicialFiltro || diaria.dataFinal >= dataInicialFiltro;

    const bateDataFinal =
      !dataFinalFiltro || diaria.dataInicio <= dataFinalFiltro;

    return bateBusca && bateStatus && bateDataInicial && bateDataFinal;
  }).sort((diariaA, diariaB) => {
    const dataA = diariaA.dataInicio || diariaA.dataFinal || "";
    const dataB = diariaB.dataInicio || diariaB.dataFinal || "";

    return dataB.localeCompare(dataA);
  });

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Diárias</h1>
            <p className="text-gray-500 mt-1">
              Cadastre diárias e acompanhe conversões em planos.
            </p>
          </div>

          <button
            onClick={() => {
              limparFormulario();
              setMostrarFormulario(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="bg-blue-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            + Cadastrar Diária
          </button>
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-5 rounded-2xl shadow mb-6">
            <h2 className="text-2xl font-bold mb-5">
              {editandoId ? "Editar Diária" : "Cadastrar Diária"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Nome" value={nome} setValue={setNome} />

              <div>
                <label className="block mb-2">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  maxLength={14}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(44)99999-9999"
                  className="w-full border rounded-xl p-3"
                />
              </div>

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

              <Select
                label="Tipo de diária"
                value={tipoDiaria}
                setValue={setTipoDiaria}
              >
                <option value="PAGA">PAGA</option>
                <option value="FREE">FREE</option>
              </Select>

              <div>
                <label className="block mb-2">Data Final</label>
                <div className="w-full border rounded-xl p-3 bg-gray-100">
                  {calcularDataFinal(dataInicio, quantidadeDias)
                    ? formatarData(calcularDataFinal(dataInicio, quantidadeDias))
                    : "Preencha a data inicial"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-5">
              <div className="flex flex-wrap justify-between gap-4 items-center mb-4">
                <div>
                  <h3 className="text-xl font-black text-green-900">
                    💰 Conversão da Diária em Venda
                  </h3>
                  <p className="text-sm text-green-800">
                    Marque caso esta diária tenha virado contrato/plano.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setConverteuVenda(!converteuVenda)}
                  className={`px-5 py-3 rounded-xl font-black ${
                    converteuVenda
                      ? "bg-green-700 text-white"
                      : "bg-white text-green-700 border border-green-400"
                  }`}
                >
                  {converteuVenda ? "✅ Convertida" : "Marcar como convertida"}
                </button>
              </div>

              {converteuVenda && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="📋 Plano convertido"
                    value={planoConvertido}
                    setValue={setPlanoConvertido}
                  >
                    <option value="MENSAL">MENSAL</option>
                    <option value="TRIMESTRAL">TRIMESTRAL</option>
                    <option value="SEMESTRAL">SEMESTRAL</option>
                    <option value="ANUAL">ANUAL</option>
                  </Select>

                  <Input
                    label="👩‍💼 Vendedora que converteu"
                    value={vendedoraConversao}
                    setValue={setVendedoraConversao}
                  />

                  <Input
                    label="📅 Data da conversão"
                    type="date"
                    value={dataConversao}
                    setValue={setDataConversao}
                  />
                </div>
              )}
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
                disabled={salvando}
                className={`px-6 py-3 rounded-xl font-bold text-white ${
                  salvando ? "bg-gray-400 cursor-not-allowed" : "bg-blue-900"
                }`}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                  ? "Salvar Edição"
                  : "Salvar Diária"}
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
                disabled={salvando}
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
                placeholder="Buscar por nome, telefone, CPF, colaboradora, status, plano ou vendedora..."
                className="border rounded-xl p-3 w-96 max-w-full"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block mb-1 font-semibold">Status</label>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  className="border rounded-xl p-3"
                >
                  <option value="">Todos</option>
                  <option value="ATIVA">Ativa</option>
                  <option value="FINALIZADA">Finalizada</option>
                </select>
              </div>

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
                  setStatusFiltro("");
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
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-left">Data Inicial</th>
                  <th className="p-3 text-left">Data Final</th>
                  <th className="p-3 text-left">Dias</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Conversão</th>
                  <th className="p-3 text-left">Plano</th>
                  <th className="p-3 text-left">Vendedora</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {diariasFiltradas.map((diaria) => (
                  <tr key={diaria.id} className="border-b">
                    <td className="p-3 font-bold">{diaria.nome}</td>
                    <td className="p-3">{formatarTelefone(diaria.telefone || "")}</td>
                    <td className="p-3">{formatarData(diaria.dataInicio)}</td>
                    <td className="p-3">{formatarData(diaria.dataFinal)}</td>
                    <td className="p-3">{diaria.quantidadeDias}</td>
                    <td className="p-3 font-bold">
                      {diaria.tipoDiaria || "PAGA"}
                    </td>

                    <td
                      className="p-3 font-bold"
                      style={{
                        color: corStatusDiaria(diaria.dataFinal),
                      }}
                    >
                      {statusDiaria(diaria.dataFinal)}
                    </td>

                    <td className="p-3">
                      {diaria.converteuVenda ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 font-bold text-green-700">
                          Convertida
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-600">
                          Não
                        </span>
                      )}
                    </td>

                    <td className="p-3">{diaria.planoConvertido || "-"}</td>
                    <td className="p-3">{diaria.vendedoraConversao || "-"}</td>

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
                    <td className="p-4 text-gray-500" colSpan={11}>
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
      <label className="block mb-2 font-semibold">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}

function Select({ label, value, setValue, children }: any) {
  return (
    <div>
      <label className="block mb-2 font-semibold">{label}</label>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      >
        {children}
      </select>
    </div>
  );
}
