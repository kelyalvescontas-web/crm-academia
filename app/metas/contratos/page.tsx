"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";

type Modalidade = {
  id: number;
  nome: string;
  unidadeId?: number | null;
};

type Unidade = {
  id: number;
  nome: string;
};

const modalidadesPadrao = [
  "MUSCULAÇÃO",
  "BOXE",
  "JIU-JITSU",
  "RITMOS",
  "PUMP",
  "GAP",
  "COMBAT",
  "MUSCULAÇÃO + MODALIDADES",
  "MODALIDADE + MODALIDADE",
];

export default function ContratosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [contratoEditandoId, setContratoEditandoId] = useState<number | null>(
    null
  );

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [modalModalidadesAberto, setModalModalidadesAberto] = useState(false);
  const [novaModalidade, setNovaModalidade] = useState("");
  const [modalidadeEditandoId, setModalidadeEditandoId] = useState<number | null>(
    null
  );

  const [matricula, setMatricula] = useState("");
  const [nomeAluno, setNomeAluno] = useState("");
  const [vendedora, setVendedora] = useState("");

  const [plano, setPlano] = useState("MUSCULAÇÃO");
  const [tipoContrato, setTipoContrato] = useState("NOVO");
  const [permanencia, setPermanencia] = useState("MENSAL");

  const [dataVenda, setDataVenda] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [valorPrimeiraParcela, setValorPrimeiraParcela] = useState("");
  const [convenio, setConvenio] = useState(false);
  const [nomeConvenio, setNomeConvenio] = useState("");

  const [contratoDividido, setContratoDividido] = useState(false);
  const [divididoCom, setDivididoCom] = useState("");

  const [transferenciaUnidade, setTransferenciaUnidade] = useState(false);
  const [unidadeOrigemId, setUnidadeOrigemId] = useState("");
  const [unidadeOrigemNome, setUnidadeOrigemNome] = useState("");

  const [acrescimoModalidade, setAcrescimoModalidade] = useState(false);
  const [trocaModalidade, setTrocaModalidade] = useState(false);
  const [modalidadeAnterior, setModalidadeAnterior] = useState("");

  const [duplicado, setDuplicado] = useState<any>(null);
  const [ignorarDuplicado, setIgnorarDuplicado] = useState(false);
  const [verificandoDuplicado, setVerificandoDuplicado] = useState(false);

  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const unidadeAtualId = useMemo(() => {
    if (!usuario) return "";
    return usuario.cargo === "ADMIN_GERAL"
      ? localStorage.getItem("unidadeSelecionadaId") || ""
      : String(usuario.unidadeId || "");
  }, [usuario]);

  const modalidadesLista = useMemo(() => {
    const nomes = new Set<string>();

    modalidadesPadrao.forEach((nome) => nomes.add(nome));

    modalidades.forEach((modalidade) => {
      if (modalidade.nome) nomes.add(String(modalidade.nome).toUpperCase());
    });

    return Array.from(nomes).sort();
  }, [modalidades]);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (usuarioSalvo) {
      const user = JSON.parse(usuarioSalvo);

      setUsuario(user);
      setVendedora(user.nome || "");

      carregarContratos(user);
      carregarUnidades();
      carregarModalidades(user);
    }
  }, []);

  useEffect(() => {
    const contratoSalvo = localStorage.getItem("contratoEditar");

    if (!contratoSalvo) return;

    const contrato = JSON.parse(contratoSalvo);

    preencherFormularioEdicao(contrato);

    localStorage.removeItem("contratoEditar");
  }, []);

  useEffect(() => {
    const contratoId = localStorage.getItem("contratoEditarId");

    if (!contratoId || contratos.length === 0) return;

    const contrato = contratos.find(
      (item) => Number(item.id) === Number(contratoId)
    );

    if (!contrato) return;

    preencherFormularioEdicao(contrato);

    localStorage.removeItem("contratoEditarId");
  }, [contratos]);

  useEffect(() => {
    if (!usuario || contratoEditandoId || ignorarDuplicado) return;

    const timer = setTimeout(() => {
      verificarContratoDuplicado();
    }, 600);

    return () => clearTimeout(timer);
  }, [matricula, nomeAluno, usuario, contratoEditandoId, ignorarDuplicado]);

  function preencherFormularioEdicao(contrato: any) {
    setContratoEditandoId(Number(contrato.id));

    setMatricula(contrato.matricula || "");
    setNomeAluno(contrato.nomeAluno || "");
    setVendedora(contrato.vendedora || "");
    setPlano(contrato.plano || "MUSCULAÇÃO");
    setTipoContrato(contrato.tipoContrato || "NOVO");
    setPermanencia(contrato.permanencia || "MENSAL");
    setDataVenda(contrato.dataVenda || new Date().toISOString().slice(0, 10));

    setValorPrimeiraParcela(
      contrato.valorPrimeiraParcela !== null &&
        contrato.valorPrimeiraParcela !== undefined
        ? String(contrato.valorPrimeiraParcela)
        : ""
    );

    setConvenio(Boolean(contrato.convenio));
    setNomeConvenio(contrato.nomeConvenio || "");
    setContratoDividido(Boolean(contrato.contratoDividido));
    setDivididoCom(contrato.divididoCom || "");

    setTransferenciaUnidade(Boolean(contrato.transferenciaUnidade));
    setUnidadeOrigemId(
      contrato.unidadeOrigemId ? String(contrato.unidadeOrigemId) : ""
    );
    setUnidadeOrigemNome(contrato.unidadeOrigemNome || "");

    setAcrescimoModalidade(Boolean(contrato.acrescimoModalidade));
    setTrocaModalidade(Boolean(contrato.trocaModalidade));
    setModalidadeAnterior(contrato.modalidadeAnterior || "");

    setObservacao(contrato.observacao || "");
    setDuplicado(null);
    setIgnorarDuplicado(true);
  }

  async function carregarUnidades() {
    try {
      const response = await fetch("/api/unidades", { cache: "no-store" });
      const data = await response.json();

      setUnidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setUnidades([]);
    }
  }

  async function carregarModalidades(userParam?: any) {
    const user = userParam || usuario;
    if (!user) return;

    const unidadeId =
      user.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : user.unidadeId;

    try {
      const response = await fetch(`/api/modalidades?unidadeId=${unidadeId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      setModalidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setModalidades([]);
    }
  }

  async function carregarContratos(userParam?: any) {
    const user = userParam || usuario;
    if (!user) return;

    const unidadeId =
      user.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : user.unidadeId;

    const response = await fetch(
      `/api/metas/contratos?unidadeId=${unidadeId}&usuarioNome=${user.nome}&usuarioCargo=${user.cargo}`,
      { cache: "no-store" }
    );

    const data = await response.json();
    setContratos(Array.isArray(data) ? data : []);
  }

  async function verificarContratoDuplicado() {
    if (!usuario) return;
    if (!matricula.trim() && !nomeAluno.trim()) {
      setDuplicado(null);
      return;
    }

    const unidadeId =
      usuario.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : usuario.unidadeId;

    try {
      setVerificandoDuplicado(true);

      const params = new URLSearchParams({
        unidadeId: String(unidadeId || ""),
        usuarioNome: usuario.nome || "",
        usuarioCargo: usuario.cargo || "",
        verificarDuplicado: "1",
        matricula: matricula.trim(),
        nomeAluno: nomeAluno.trim(),
      });

      const response = await fetch(`/api/metas/contratos?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (data?.duplicado && data?.contrato) {
        setDuplicado(data.contrato);
      } else {
        setDuplicado(null);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setVerificandoDuplicado(false);
    }
  }

  async function salvarContrato() {
    if (salvando) return;

    if (!nomeAluno.trim()) {
      alert("Informe o nome do aluno");
      return;
    }

    if (!usuario) {
      alert("Usuário não identificado");
      return;
    }

    if (duplicado && !ignorarDuplicado && !contratoEditandoId) {
      alert("Este contrato parece já ter sido lançado. Confira o alerta antes de continuar.");
      return;
    }

    if (transferenciaUnidade && !unidadeOrigemId) {
      alert("Selecione a unidade de origem da transferência.");
      return;
    }

    if ((acrescimoModalidade || trocaModalidade) && !modalidadeAnterior) {
      alert("Informe qual era a modalidade anterior do aluno.");
      return;
    }

    if (acrescimoModalidade && trocaModalidade) {
      alert("Escolha apenas uma opção: acréscimo de modalidade OU troca de modalidade.");
      return;
    }

    const unidadeId =
      usuario.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : usuario.unidadeId;

    try {
      setSalvando(true);

      const response = await fetch("/api/metas/contratos", {
        method: contratoEditandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: contratoEditandoId,
          matricula,
          nomeAluno,
          vendedora,
          plano,
          tipoContrato,
          permanencia,
          dataVenda,
          valorPrimeiraParcela,
          convenio,
          nomeConvenio,
          contratoDividido,
          quantidadeMeios: contratoDividido ? 1 : 0,
          divididoCom,

          transferenciaUnidade,
          unidadeOrigemId: transferenciaUnidade ? unidadeOrigemId : null,
          unidadeOrigemNome: transferenciaUnidade ? unidadeOrigemNome : "",

          acrescimoModalidade,
          trocaModalidade,
          modalidadeAnterior:
            acrescimoModalidade || trocaModalidade ? modalidadeAnterior : "",

          observacao,
          unidadeId,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioCargo: usuario.cargo,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao salvar contrato");
        return;
      }

      limparFormulario();
      setContratoEditandoId(null);
      await carregarContratos();
      alert("Contrato salvo com sucesso!");
    } finally {
      setSalvando(false);
    }
  }

  async function editarContrato(contrato: any) {
    preencherFormularioEdicao(contrato);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirContrato(contrato: any) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o contrato de ${contrato.nomeAluno}?`
    );

    if (!confirmar || !usuario) return;

    try {
      const response = await fetch("/api/metas/contratos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contrato.id,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioCargo: usuario.cargo,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao excluir contrato");
        return;
      }

      await carregarContratos();
      alert("Contrato excluído com sucesso!");
    } catch (error) {
      console.log(error);
      alert("Erro ao excluir contrato");
    }
  }

  async function salvarModalidade() {
    if (!novaModalidade.trim() || !usuario) {
      alert("Informe o nome da modalidade.");
      return;
    }

    const unidadeId =
      usuario.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : usuario.unidadeId;

    const response = await fetch("/api/modalidades", {
      method: modalidadeEditandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: modalidadeEditandoId,
        nome: novaModalidade,
        unidadeId,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      alert(data.error || "Erro ao salvar modalidade");
      return;
    }

    setNovaModalidade("");
    setModalidadeEditandoId(null);
    await carregarModalidades();
  }

  async function excluirModalidade(modalidade: Modalidade) {
    const confirmar = window.confirm(`Excluir modalidade ${modalidade.nome}?`);
    if (!confirmar) return;

    const response = await fetch("/api/modalidades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modalidade.id }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      alert(data.error || "Erro ao excluir modalidade");
      return;
    }

    await carregarModalidades();
  }

  function limparFormulario() {
    setMatricula("");
    setNomeAluno("");
    setVendedora(usuario?.nome || "");
    setPlano("MUSCULAÇÃO");
    setTipoContrato("NOVO");
    setPermanencia("MENSAL");
    setDataVenda(new Date().toISOString().slice(0, 10));
    setValorPrimeiraParcela("");
    setConvenio(false);
    setNomeConvenio("");
    setContratoDividido(false);
    setDivididoCom("");

    setTransferenciaUnidade(false);
    setUnidadeOrigemId("");
    setUnidadeOrigemNome("");

    setAcrescimoModalidade(false);
    setTrocaModalidade(false);
    setModalidadeAnterior("");

    setDuplicado(null);
    setIgnorarDuplicado(false);

    setObservacao("");
    setContratoEditandoId(null);
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function formatarValor(valor: any) {
    if (valor === null || valor === undefined || valor === "") return "-";

    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function selecionarUnidadeOrigem(id: string) {
    setUnidadeOrigemId(id);

    const unidade = unidades.find((item) => Number(item.id) === Number(id));
    setUnidadeOrigemNome(unidade?.nome || "");
  }

  function textoRegraEspecial() {
    if (acrescimoModalidade && modalidadeAnterior) {
      return `${modalidadeAnterior} + ${plano}`;
    }

    if (trocaModalidade && modalidadeAnterior) {
      return `Trocou ${modalidadeAnterior} por ${plano}`;
    }

    if (transferenciaUnidade && unidadeOrigemNome) {
      return `Transferência de ${unidadeOrigemNome}`;
    }

    return "";
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="mb-8 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📄 Contratos de Metas
            </h1>

            <p className="text-gray-600 mt-1">
              Cadastre manualmente os contratos que serão contabilizados nas metas.
            </p>
          </div>

          <button
            onClick={() => router.push("/metas")}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-xl font-bold transition"
          >
            Voltar para Metas
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-2xl font-bold mb-5">
            {contratoEditandoId ? "Editar Contrato" : "Novo Contrato"}
          </h2>

          {duplicado && !ignorarDuplicado && !contratoEditandoId && (
            <div className="mb-5 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-red-900">
              <h3 className="mb-3 text-xl font-black">
                ⚠️ Contrato já lançado
              </h3>

              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                <p>
                  <b>Código/Matrícula:</b> {duplicado.matricula || "-"}
                </p>
                <p>
                  <b>Data:</b> {formatarData(duplicado.dataVenda)}
                </p>
                <p>
                  <b>Aluno:</b> {duplicado.nomeAluno || "-"}
                </p>
                <p>
                  <b>Vendedora:</b> {duplicado.vendedora || "-"}
                </p>
                <p>
                  <b>Plano:</b> {duplicado.plano || "-"}
                </p>
                <p>
                  <b>Tipo:</b> {duplicado.permanencia || "-"}
                </p>
                <p>
                  <b>Meio/Dividido:</b>{" "}
                  {duplicado.contratoDividido ? "Sim" : "Não"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setIgnorarDuplicado(true)}
                  className="rounded-xl bg-red-700 px-5 py-3 font-black text-white hover:bg-red-800"
                >
                  Continuar mesmo assim
                </button>

                <button
                  onClick={() => {
                    setDuplicado(null);
                    setMatricula("");
                    setNomeAluno("");
                    setIgnorarDuplicado(false);
                  }}
                  className="rounded-xl bg-gray-700 px-5 py-3 font-black text-white hover:bg-gray-800"
                >
                  Cancelar lançamento
                </button>
              </div>
            </div>
          )}

          {verificandoDuplicado && (
            <div className="mb-5 rounded-xl bg-yellow-50 p-3 font-bold text-yellow-700">
              Verificando se este contrato já foi lançado...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block mb-2 font-semibold">
                Matrícula (até 10 dígitos)
              </label>

              <input
                type="text"
                maxLength={10}
                value={matricula}
                onChange={(e) => {
                  setMatricula(e.target.value);
                  setIgnorarDuplicado(false);
                }}
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div className="md:col-span-2">
              <Campo
                label="Nome do aluno"
                value={nomeAluno}
                setValue={(value: string) => {
                  setNomeAluno(value);
                  setIgnorarDuplicado(false);
                }}
              />
            </div>

            <Campo
              label="Vendedora"
              value={vendedora}
              setValue={setVendedora}
            />

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="font-semibold">Plano / Modalidade</label>

                <button
                  type="button"
                  onClick={() => setModalModalidadesAberto(true)}
                  className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
                >
                  ⚙ Gerenciar
                </button>
              </div>

              <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                {modalidadesLista.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>

            <Select
              label="Tipo"
              value={tipoContrato}
              setValue={setTipoContrato}
            >
              <option value="NOVO">NOVO</option>
              <option value="RETORNO">RETORNO</option>
              <option value="RENOVAÇÃO">RENOVAÇÃO</option>
            </Select>

            <Select
              label="Permanência"
              value={permanencia}
              setValue={setPermanencia}
            >
              <option value="ANUAL">ANUAL</option>
              <option value="SEMESTRAL">SEMESTRAL</option>
              <option value="TRIMESTRAL">TRIMESTRAL</option>
              <option value="MENSAL">MENSAL</option>
            </Select>

            <Campo
              label="Data da venda"
              value={dataVenda}
              setValue={setDataVenda}
              type="date"
            />

            <Campo
              label="Valor da primeira parcela"
              value={valorPrimeiraParcela}
              setValue={setValorPrimeiraParcela}
              type="number"
            />

            <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl">
              <input
                type="checkbox"
                checked={convenio}
                onChange={(e) => setConvenio(e.target.checked)}
              />

              <span className="font-bold">É convênio?</span>
            </div>

            {convenio && (
              <Campo
                label="Nome do convênio"
                value={nomeConvenio}
                setValue={setNomeConvenio}
              />
            )}

            <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl">
              <input
                type="checkbox"
                checked={contratoDividido}
                onChange={(e) => setContratoDividido(e.target.checked)}
              />

              <span className="font-bold">Contrato dividido?</span>
            </div>

            {contratoDividido && (
              <Campo
                label="Dividido com quem?"
                value={divididoCom}
                setValue={setDivididoCom}
              />
            )}

            <div className="md:col-span-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="mb-4 text-lg font-black text-blue-900">
                🔁 Regras especiais do contrato
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <CheckBoxCard
                  checked={transferenciaUnidade}
                  onChange={(checked: boolean) => {
                    setTransferenciaUnidade(checked);
                    if (!checked) {
                      setUnidadeOrigemId("");
                      setUnidadeOrigemNome("");
                    }
                  }}
                  title="Transferência de unidade"
                  desc="Conta na meta geral da unidade destino, mas não conta comissão."
                />

                <CheckBoxCard
                  checked={acrescimoModalidade}
                  onChange={(checked: boolean) => {
                    setAcrescimoModalidade(checked);
                    if (checked) setTrocaModalidade(false);
                  }}
                  title="Acréscimo de modalidade"
                  desc="Conta apenas a modalidade acrescentada."
                />

                <CheckBoxCard
                  checked={trocaModalidade}
                  onChange={(checked: boolean) => {
                    setTrocaModalidade(checked);
                    if (checked) setAcrescimoModalidade(false);
                  }}
                  title="Troca de modalidade"
                  desc="Não conta meta nem comissão, apenas histórico."
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {transferenciaUnidade && (
                  <div>
                    <label className="block mb-2 font-semibold">
                      Unidade de origem
                    </label>

                    <select
                      value={unidadeOrigemId}
                      onChange={(e) => selecionarUnidadeOrigem(e.target.value)}
                      className="w-full rounded-xl border p-3"
                    >
                      <option value="">Selecione</option>
                      {unidades
                        .filter((unidade) => String(unidade.id) !== String(unidadeAtualId))
                        .map((unidade) => (
                          <option key={unidade.id} value={unidade.id}>
                            {unidade.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {(acrescimoModalidade || trocaModalidade) && (
                  <div>
                    <label className="block mb-2 font-semibold">
                      Modalidade anterior do aluno
                    </label>

                    <select
                      value={modalidadeAnterior}
                      onChange={(e) => setModalidadeAnterior(e.target.value)}
                      className="w-full rounded-xl border p-3"
                    >
                      <option value="">Selecione</option>
                      {modalidadesLista.map((nome) => (
                        <option key={nome} value={nome}>
                          {nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {textoRegraEspecial() && (
                <div className="mt-4 rounded-xl bg-white p-4 font-black text-blue-900 ring-1 ring-blue-200">
                  Resultado: {textoRegraEspecial()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label className="block mb-2 font-semibold">Observação</label>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full border rounded-xl p-3 h-24"
              placeholder="Exemplo: contrato meio com Bruna / transferência de unidade / acréscimo de modalidade..."
            />
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              onClick={salvarContrato}
              disabled={salvando}
              className="bg-blue-900 hover:bg-blue-950 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition"
            >
              {salvando
                ? "Salvando..."
                : contratoEditandoId
                ? "Salvar Alterações"
                : "Salvar Contrato"}
            </button>

            <button
              onClick={limparFormulario}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              Limpar
            </button>

            <button
              onClick={() => router.push("/metas")}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-5">Contratos Cadastrados</h2>

          <div className="overflow-auto">
            <table className="w-full min-w-[1600px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Matrícula</th>
                  <th className="p-3 text-left">Aluno</th>
                  <th className="p-3 text-left">Vendedora</th>
                  <th className="p-3 text-left">Plano</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Permanência</th>
                  <th className="p-3 text-left">Especial</th>
                  <th className="p-3 text-left">Modalidade anterior</th>
                  <th className="p-3 text-left">Unidade origem</th>
                  <th className="p-3 text-left">Convênio</th>
                  <th className="p-3 text-left">Dividido</th>
                  <th className="p-3 text-left">Com quem</th>
                  <th className="p-3 text-left">1ª Parcela</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {contratos.map((contrato) => (
                  <tr key={contrato.id} className="border-b">
                    <td className="p-3">{formatarData(contrato.dataVenda)}</td>
                    <td className="p-3">{contrato.matricula || "-"}</td>
                    <td className="p-3 font-bold">{contrato.nomeAluno}</td>
                    <td className="p-3">{contrato.vendedora}</td>
                    <td className="p-3">{contrato.plano}</td>
                    <td className="p-3">{contrato.tipoContrato}</td>
                    <td className="p-3">{contrato.permanencia || "-"}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {contrato.transferenciaUnidade && (
                          <Badge cor="blue">Transferência</Badge>
                        )}
                        {contrato.acrescimoModalidade && (
                          <Badge cor="green">Acréscimo</Badge>
                        )}
                        {contrato.trocaModalidade && (
                          <Badge cor="red">Troca</Badge>
                        )}
                        {!contrato.transferenciaUnidade &&
                          !contrato.acrescimoModalidade &&
                          !contrato.trocaModalidade &&
                          "-"}
                      </div>
                    </td>
                    <td className="p-3">{contrato.modalidadeAnterior || "-"}</td>
                    <td className="p-3">{contrato.unidadeOrigemNome || "-"}</td>
                    <td className="p-3">
                      {contrato.convenio
                        ? contrato.nomeConvenio || "SIM"
                        : "NÃO"}
                    </td>
                    <td className="p-3">
                      {contrato.contratoDividido ? "SIM" : "NÃO"}
                    </td>
                    <td className="p-3">
                      {contrato.contratoDividido
                        ? contrato.divididoCom || "-"
                        : "-"}
                    </td>
                    <td className="p-3">
                      {formatarValor(contrato.valorPrimeiraParcela)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            alert(
                              `Contrato\n\nAluno: ${contrato.nomeAluno}\nMatrícula: ${
                                contrato.matricula || "-"
                              }\nVendedora: ${contrato.vendedora}\nPlano: ${
                                contrato.plano
                              }\nTipo: ${contrato.tipoContrato}\nPermanência: ${
                                contrato.permanencia
                              }\nData: ${formatarData(contrato.dataVenda)}`
                            )
                          }
                          className="rounded-lg bg-purple-50 px-3 py-2 font-black text-purple-700 hover:bg-purple-100"
                        >
                          👁
                        </button>

                        <button
                          onClick={() => editarContrato(contrato)}
                          className="rounded-lg bg-blue-50 px-3 py-2 font-black text-blue-700 hover:bg-blue-100"
                        >
                          ✏
                        </button>

                        <button
                          onClick={() => excluirContrato(contrato)}
                          className="rounded-lg bg-red-50 px-3 py-2 font-black text-red-700 hover:bg-red-100"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {contratos.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={15}>
                      Nenhum contrato cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalModalidadesAberto && (
          <ModalModalidades
            modalidades={modalidades}
            modalidadesPadrao={modalidadesPadrao}
            novaModalidade={novaModalidade}
            setNovaModalidade={setNovaModalidade}
            modalidadeEditandoId={modalidadeEditandoId}
            setModalidadeEditandoId={setModalidadeEditandoId}
            salvarModalidade={salvarModalidade}
            excluirModalidade={excluirModalidade}
            fechar={() => {
              setModalModalidadesAberto(false);
              setNovaModalidade("");
              setModalidadeEditandoId(null);
            }}
          />
        )}
      </section>
    </main>
  );
}

function Campo({ label, value, setValue, type = "text" }: any) {
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

function CheckBoxCard({ checked, onChange, title, desc }: any) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border p-4 transition ${
        checked
          ? "border-blue-500 bg-white shadow"
          : "border-blue-100 bg-white/60 hover:bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1"
        />

        <div>
          <p className="font-black text-blue-950">{title}</p>
          <p className="mt-1 text-sm text-blue-700">{desc}</p>
        </div>
      </div>
    </label>
  );
}

function Badge({ children, cor }: any) {
  const classes: any = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
        classes[cor] || classes.blue
      }`}
    >
      {children}
    </span>
  );
}

function ModalModalidades({
  modalidades,
  modalidadesPadrao,
  novaModalidade,
  setNovaModalidade,
  modalidadeEditandoId,
  setModalidadeEditandoId,
  salvarModalidade,
  excluirModalidade,
  fechar,
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              ⚙ Gerenciar Modalidades
            </h2>
            <p className="text-sm text-gray-500">
              Cadastre, edite ou exclua modalidades da unidade.
            </p>
          </div>

          <button
            onClick={fechar}
            className="rounded-full bg-gray-100 px-4 py-2 font-black text-gray-700 hover:bg-gray-200"
          >
            ×
          </button>
        </div>

        <div className="mb-5 flex gap-3">
          <input
            value={novaModalidade}
            onChange={(e) => setNovaModalidade(e.target.value)}
            className="flex-1 rounded-xl border p-3"
            placeholder="Nome da modalidade"
          />

          <button
            onClick={salvarModalidade}
            className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
          >
            {modalidadeEditandoId ? "Salvar edição" : "+ Nova"}
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-gray-50 p-4">
          <h3 className="mb-2 font-black text-gray-800">
            Modalidades padrão do sistema
          </h3>

          <div className="flex flex-wrap gap-2">
            {modalidadesPadrao.map((nome: string) => (
              <span
                key={nome}
                className="rounded-full bg-white px-3 py-1 text-sm font-bold text-gray-700 ring-1 ring-gray-200"
              >
                {nome}
              </span>
            ))}
          </div>
        </div>

        <div className="max-h-[320px] overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left">Modalidade cadastrada</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {modalidades.map((modalidade: Modalidade) => (
                <tr key={modalidade.id} className="border-b">
                  <td className="p-3 font-bold">{modalidade.nome}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setModalidadeEditandoId(modalidade.id);
                          setNovaModalidade(modalidade.nome);
                        }}
                        className="rounded-lg bg-blue-50 px-3 py-2 font-black text-blue-700 hover:bg-blue-100"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluirModalidade(modalidade)}
                        className="rounded-lg bg-red-50 px-3 py-2 font-black text-red-700 hover:bg-red-100"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {modalidades.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-gray-500">
                    Nenhuma modalidade extra cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
