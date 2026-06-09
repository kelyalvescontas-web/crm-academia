"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";

export default function ContratosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [contratoEditandoId, setContratoEditandoId] = useState<number | null>(null);

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

  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
 

  useEffect(() => {
  const usuarioSalvo = localStorage.getItem("usuario");

  if (usuarioSalvo) {
    const user = JSON.parse(usuarioSalvo);

    setUsuario(user);
    setVendedora(user.nome || "");

    carregarContratos(user);
  }
}, []);
useEffect(() => {
  const contratoSalvo = localStorage.getItem("contratoEditar");

  if (!contratoSalvo) return;

  const contrato = JSON.parse(contratoSalvo);

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
  setObservacao(contrato.observacao || "");

  localStorage.removeItem("contratoEditar");
}, []);
useEffect(() => {
  const contratoId = localStorage.getItem("contratoEditarId");

  if (!contratoId || contratos.length === 0) return;

  const contrato = contratos.find(
    (item) => Number(item.id) === Number(contratoId)
  );

  if (!contrato) return;

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
  setObservacao(contrato.observacao || "");

  localStorage.removeItem("contratoEditarId");
}, [contratos]);
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
          quantidadeMeios: 0,
          divididoCom,
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
    setObservacao("");
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block mb-2 font-semibold">
                Matrícula (até 10 dígitos)
              </label>

              <input
                type="text"
                maxLength={10}
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div className="md:col-span-2">
              <Campo
                label="Nome do aluno"
                value={nomeAluno}
                setValue={setNomeAluno}
              />
            </div>

            <Campo
              label="Vendedora"
              value={vendedora}
              setValue={setVendedora}
            />

            <Select label="Plano" value={plano} setValue={setPlano}>
              <option value="MUSCULAÇÃO">MUSCULAÇÃO</option>
              <option value="BOXE">BOXE</option>
              <option value="JIU-JITSU">JIU-JITSU</option>
              <option value="RITMOS">RITMOS</option>
              <option value="PUMP">PUMP</option>
              <option value="GAP">GAP</option>
              <option value="COMBAT">COMBAT</option>
              <option value="MUSCULAÇÃO + MODALIDADES">
                MUSCULAÇÃO + MODALIDADES
              </option>
              <option value="MODALIDADE + MODALIDADE">
                MODALIDADE + MODALIDADE
              </option>
            </Select>

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
          </div>

          <div className="mt-5">
            <label className="block mb-2 font-semibold">Observação</label>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full border rounded-xl p-3 h-24"
              placeholder="Exemplo: contrato meio com Bruna / 2 meios para cada / restante definido manualmente..."
            />
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              onClick={salvarContrato}
              className="bg-blue-900 hover:bg-blue-950 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              {contratoEditandoId ? "Salvar Alterações" : "Salvar Contrato"}
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
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Matrícula</th>
                  <th className="p-3 text-left">Aluno</th>
                  <th className="p-3 text-left">Vendedora</th>
                  <th className="p-3 text-left">Plano</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Permanência</th>
                  <th className="p-3 text-left">Convênio</th>
                  <th className="p-3 text-left">Dividido</th>
                  <th className="p-3 text-left">Com quem</th>
                  <th className="p-3 text-left">1ª Parcela</th>
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
                  </tr>
                ))}

                {contratos.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={11}>
                      Nenhum contrato cadastrado.
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