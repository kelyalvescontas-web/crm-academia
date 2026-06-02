"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

function mesAtualSistema() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export default function Home() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualSistema());

  const [dashboard, setDashboard] = useState<any>({
    totalAulas: 0,
    aulasHoje: 0,
    totalCompareceu: 0,
    totalFaltou: 0,
    taxaComparecimento: 0,
    taxaConversao: 0,
    vendasEfetivadas: 0,
    diariasAtivas: 0,
    totalDiarias: 0,
    diariasVencendoHoje: [],
    modalidades: {},
    aulasPorColaboradora: {},
    vendasPorVendedora: {},
    conversaoAgendouVendeu: [],
  });

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuarioSalvo);
    setUsuario(user);

    if (String(user.cargo).toUpperCase() === "INSTRUTOR") {
      router.push("/calendario");
      return;
    }

    if (user.cargo === "ADMIN_GERAL") {
      carregarUnidades();
    } else {
      const unidadeDoUsuario = String(user.unidadeId || "");

      if (!unidadeDoUsuario) {
        alert("Usuário sem unidade vinculada.");
        router.push("/login");
        return;
      }

      localStorage.setItem("unidadeSelecionadaId", unidadeDoUsuario);
      setUnidadeSelecionada(unidadeDoUsuario);
      carregarDashboard(unidadeDoUsuario, mesAtualSistema());
    }
  }, [router]);

  async function carregarUnidades() {
    const response = await fetch("/api/unidades", { cache: "no-store" });
    const data = await response.json();

    if (!Array.isArray(data)) return;

    setUnidades(data);

    const unidadeSalva = localStorage.getItem("unidadeSelecionadaId");
    const unidadeInicial = unidadeSalva || String(data[0]?.id || "");

    if (!unidadeInicial) return;

    localStorage.setItem("unidadeSelecionadaId", unidadeInicial);
    setUnidadeSelecionada(unidadeInicial);
    carregarDashboard(unidadeInicial, mesSelecionado);
  }

  async function carregarDashboard(unidadeId: string, mes: string) {
    try {
      const response = await fetch(
        `/api/dashboard?unidadeId=${unidadeId}&mes=${mes}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      setDashboard({
        totalAulas: data.totalAulas || 0,
        aulasHoje: data.aulasHoje || 0,
        totalCompareceu: data.totalCompareceu || 0,
        totalFaltou: data.totalFaltou || 0,
        taxaComparecimento: data.taxaComparecimento || 0,
        taxaConversao: data.taxaConversao || 0,
        vendasEfetivadas: data.vendasEfetivadas || 0,
        diariasAtivas: data.diariasAtivas || 0,
        totalDiarias: data.totalDiarias || 0,
        diariasVencendoHoje: data.diariasVencendoHoje || [],
        modalidades: data.modalidades || {},
        aulasPorColaboradora: data.aulasPorColaboradora || {},
        vendasPorVendedora: data.vendasPorVendedora || {},
        conversaoAgendouVendeu: data.conversaoAgendouVendeu || [],
      });
    } catch (error) {
      console.log(error);
    }
  }

  function trocarUnidade(id: string) {
    setUnidadeSelecionada(id);
    localStorage.setItem("unidadeSelecionadaId", id);
    carregarDashboard(id, mesSelecionado);
    window.dispatchEvent(new Event("unidadeAlterada"));
  }

  function trocarMes(mes: string) {
    setMesSelecionado(mes);

    if (unidadeSelecionada) {
      carregarDashboard(unidadeSelecionada, mes);
    }
  }

  return (
    <main style={{ display: "flex", background: "#f3f4f6", minHeight: "100vh" }}>
      <Sidebar />

      <section style={{ flex: 1, padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "34px", fontWeight: "bold" }}>
            Dashboard Comercial
          </h1>

          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {usuario?.cargo === "ADMIN_GERAL" && (
              <div style={filtroBox}>
                <label style={labelFiltro}>Unidade:</label>

                <select
                  value={unidadeSelecionada}
                  onChange={(e) => trocarUnidade(e.target.value)}
                  style={selectFiltro}
                >
                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={filtroBox}>
              <label style={labelFiltro}>Mês:</label>

              <input
                type="month"
                value={mesSelecionado}
                onChange={(e) => trocarMes(e.target.value)}
                style={selectFiltro}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <Card titulo="Aulas Hoje" valor={dashboard.aulasHoje} cor="#1d4ed8" />
          <Card titulo="Total Aulas" valor={dashboard.totalAulas} cor="#2563eb" />
          <Card titulo="Compareceu" valor={dashboard.totalCompareceu} cor="#16a34a" />
          <Card titulo="Faltou" valor={dashboard.totalFaltou} cor="#dc2626" />
          <Card titulo="Taxa Comparecimento" valor={`${dashboard.taxaComparecimento}%`} cor="#1e40af" />
          <Card titulo="Taxa Conversão" valor={`${dashboard.taxaConversao}%`} cor="#16a34a" />
          <Card titulo="Vendas" valor={dashboard.vendasEfetivadas} cor="#ca8a04" />
          <Card titulo="Diárias Ativas" valor={dashboard.diariasAtivas} cor="#7c3aed" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "25px" }}>
          <GraficoBarras
            titulo="Aulas agendadas por colaboradora"
            dados={dashboard.aulasPorColaboradora}
            cor="#2563eb"
          />

          <GraficoBarras
            titulo="Vendas por vendedora"
            dados={dashboard.vendasPorVendedora}
            cor="#16a34a"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "25px" }}>
          <div style={bloco}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px", color: "#dc2626" }}>
              Diárias vencendo hoje
            </h2>

            {dashboard.diariasVencendoHoje.length === 0 ? (
              <p>Nenhuma diária vence hoje.</p>
            ) : (
              dashboard.diariasVencendoHoje.map((diaria: any) => (
                <div key={diaria.id} style={linhaLista}>
                  {diaria.nome}
                </div>
              ))
            )}
          </div>

          <GraficoBarras
            titulo="Modalidades mais solicitadas"
            dados={dashboard.modalidades}
            cor="#7c3aed"
          />
        </div>

        <div style={{ ...bloco, marginTop: "25px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}>
            Conversão: quem agendou x quem vendeu
          </h2>

          {dashboard.conversaoAgendouVendeu.length === 0 ? (
            <p>Nenhuma conversão registrada.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Quem agendou</th>
                  <th style={th}>Quem vendeu</th>
                  <th style={th}>Quantidade</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.conversaoAgendouVendeu.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={td}>{item.colaboradora}</td>
                    <td style={td}>{item.vendedora}</td>
                    <td style={td}>{item.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}

const filtroBox = {
  background: "white",
  padding: "12px 16px",
  borderRadius: "14px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const labelFiltro = {
  fontWeight: "bold",
  fontSize: "15px",
};

const selectFiltro = {
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
};

const bloco = {
  background: "white",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const linhaLista = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: "bold",
};

const th = {
  padding: "12px",
  borderBottom: "2px solid #111827",
  textAlign: "left" as const,
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
};

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", minHeight: "95px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "18px" }}>
        {titulo}
      </h2>

      <p style={{ fontSize: "32px", fontWeight: "bold", color: cor }}>
        {valor}
      </p>
    </div>
  );
}

function GraficoBarras({ titulo, dados, cor }: any) {
  const entradas = Object.entries(dados || {});
  const maior = Math.max(...entradas.map(([, valor]: any) => Number(valor)), 1);

  return (
    <div style={bloco}>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}>
        {titulo}
      </h2>

      {entradas.length === 0 ? (
        <p>Nenhum registro encontrado.</p>
      ) : (
        entradas.map(([nome, quantidade]: any) => {
          const largura = Math.max((Number(quantidade) / maior) * 100, 8);

          return (
            <div key={nome} style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <strong>{nome}</strong>
                <span>{quantidade}</span>
              </div>

              <div style={{ width: "100%", height: "14px", background: "#e5e7eb", borderRadius: "999px" }}>
                <div style={{ width: `${largura}%`, height: "14px", background: cor, borderRadius: "999px" }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}