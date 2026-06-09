"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function HistoricoPage() {
  const router = useRouter();

  const [historicos, setHistoricos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [unidadeFiltro, setUnidadeFiltro] = useState("TODAS");
  const [acaoFiltro, setAcaoFiltro] = useState("TODAS");
  const [telaFiltro, setTelaFiltro] = useState("TODAS");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);
    setUsuarioLogado(usuario);

    const cargo = String(usuario.cargo || "").toUpperCase();

if (cargo !== "ADMIN_GERAL" && cargo !== "ADMIN") {
  alert("Acesso permitido apenas para ADMIN ou ADMIN GERAL.");
  router.push("/");
  return;
}

    carregarUnidades();
    carregarHistorico();
  }, [router]);

  async function carregarUnidades() {
    const response = await fetch("/api/unidades", {
      cache: "no-store",
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      setUnidades(data);
    }
  }

  async function carregarHistorico() {
    const params = new URLSearchParams();

    if (unidadeFiltro) params.append("unidadeId", unidadeFiltro);
    if (acaoFiltro) params.append("acao", acaoFiltro);
    if (telaFiltro) params.append("tela", telaFiltro);
    if (usuarioFiltro) params.append("usuario", usuarioFiltro);
    if (dataInicial) params.append("dataInicial", dataInicial);
    if (dataFinal) params.append("dataFinal", dataFinal);

    const response = await fetch(`/api/historico?${params.toString()}`, {
      cache: "no-store",
    });

    const data = await response.json();

    setHistoricos(Array.isArray(data) ? data : []);
  }

  function limparFiltros() {
    setUnidadeFiltro("TODAS");
    setAcaoFiltro("TODAS");
    setTelaFiltro("TODAS");
    setUsuarioFiltro("");
    setDataInicial("");
    setDataFinal("");

    setTimeout(() => {
      carregarHistorico();
    }, 100);
  }

  function formatarDataHora(dataISO: string) {
    if (!dataISO) return "";

    const data = new Date(dataISO);

    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function corAcao(acao: string) {
    if (acao === "CRIOU") return "#16a34a";
    if (acao === "EDITOU") return "#ca8a04";
    if (acao === "EXCLUIU") return "#dc2626";
    return "#2563eb";
  }

  function iconeAcao(acao: string) {
    if (acao === "CRIOU") return "✅";
    if (acao === "EDITOU") return "✏️";
    if (acao === "EXCLUIU") return "🗑️";
    return "📌";
  }

  function formatarTela(tela: string) {
    if (tela === "AULAS") return "Aulas";
    if (tela === "DIARIAS") return "Diárias";
    if (tela === "USUARIOS") return "Usuários";
    return tela || "-";
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Histórico de Alterações</h1>
          <p className="text-gray-600 mt-1">
            Consulte quem criou, editou ou excluiu registros no sistema.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-2xl font-bold mb-6">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block mb-2 font-semibold">Unidade</label>
              <select
                value={unidadeFiltro}
                onChange={(e) => setUnidadeFiltro(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option value="TODAS">Todas</option>

                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Ação</label>
              <select
                value={acaoFiltro}
                onChange={(e) => setAcaoFiltro(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option value="TODAS">Todas</option>
                <option value="CRIOU">Criou</option>
                <option value="EDITOU">Editou</option>
                <option value="EXCLUIU">Excluiu</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Tela</label>
              <select
                value={telaFiltro}
                onChange={(e) => setTelaFiltro(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option value="TODAS">Todas</option>
                <option value="AULAS">Aulas</option>
                <option value="DIARIAS">Diárias</option>
                <option value="USUARIOS">Usuários</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Usuário</label>
              <input
                value={usuarioFiltro}
                onChange={(e) => setUsuarioFiltro(e.target.value)}
                placeholder="Buscar por nome"
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">Data inicial</label>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">Data final</label>
              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={carregarHistorico}
                className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold"
              >
                Filtrar
              </button>

              <button
                onClick={limparFiltros}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-6">
            Últimas alterações
          </h2>

          <div className="overflow-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">Data/Hora</th>
                  <th className="p-3 text-left">Usuário</th>
                  <th className="p-3 text-left">Ação</th>
                  <th className="p-3 text-left">Tela</th>
                  <th className="p-3 text-left">Registro</th>
                  <th className="p-3 text-left">Unidade</th>
                  <th className="p-3 text-left">Descrição</th>
                </tr>
              </thead>

              <tbody>
                {historicos.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">
                      {formatarDataHora(item.createdAt)}
                    </td>

                    <td className="p-3 font-semibold">
                      {item.usuarioNome || "Não identificado"}
                    </td>

                    <td
                      className="p-3 font-bold"
                      style={{ color: corAcao(item.acao) }}
                    >
                      {iconeAcao(item.acao)} {item.acao}
                    </td>

                    <td className="p-3">
                      {formatarTela(item.tela)}
                    </td>

                    <td className="p-3">
                      {item.registroNome || "-"}
                    </td>

                    <td className="p-3">
                      {item.unidade?.nome || "-"}
                    </td>

                    <td className="p-3 text-gray-600">
                      {item.descricao || "-"}
                    </td>
                  </tr>
                ))}

                {historicos.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={7}>
                      Nenhum histórico encontrado.
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