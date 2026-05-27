"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function Home() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");

  const [dashboard, setDashboard] = useState<any>({
    totalAulas: 0,
    aulasHoje: 0,
    totalCompareceu: 0,
    totalFaltou: 0,
    taxaComparecimento: 0,
    vendasEfetivadas: 0,
    diariasAtivas: 0,
    totalDiarias: 0,
    diariasVencendoHoje: [],
    modalidades: {},
  });

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuarioSalvo);
    setUsuario(user);

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
      carregarDashboard(unidadeDoUsuario);
    }
  }, [router]);

  async function carregarUnidades() {
    const response = await fetch("/api/unidades", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!Array.isArray(data)) return;

    setUnidades(data);

    const unidadeSalva = localStorage.getItem("unidadeSelecionadaId");
    const unidadeInicial = unidadeSalva || String(data[0]?.id || "");

    if (!unidadeInicial) return;

    localStorage.setItem("unidadeSelecionadaId", unidadeInicial);
    setUnidadeSelecionada(unidadeInicial);
    carregarDashboard(unidadeInicial);
  }

  async function carregarDashboard(unidadeId: string) {
    try {
      const response = await fetch(`/api/dashboard?unidadeId=${unidadeId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      setDashboard({
        totalAulas: data.totalAulas || 0,
        aulasHoje: data.aulasHoje || 0,
        totalCompareceu: data.totalCompareceu || 0,
        totalFaltou: data.totalFaltou || 0,
        taxaComparecimento: data.taxaComparecimento || 0,
        vendasEfetivadas: data.vendasEfetivadas || 0,
        diariasAtivas: data.diariasAtivas || 0,
        totalDiarias: data.totalDiarias || 0,
        diariasVencendoHoje: data.diariasVencendoHoje || [],
        modalidades: data.modalidades || {},
      });
    } catch (error) {
      console.log(error);
    }
  }

  function trocarUnidade(id: string) {
    setUnidadeSelecionada(id);
    localStorage.setItem("unidadeSelecionadaId", id);
    carregarDashboard(id);

    window.dispatchEvent(new Event("unidadeAlterada"));
  }

  return (
    <main
      style={{
        display: "flex",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <section style={{ flex: 1, padding: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              fontWeight: "bold",
            }}
          >
            Dashboard Comercial
          </h1>

          {usuario?.cargo === "ADMIN_GERAL" && (
            <div
              style={{
                background: "white",
                padding: "15px 20px",
                borderRadius: "14px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                Unidade:
              </label>

              <select
                value={unidadeSelecionada}
                onChange={(e) => trocarUnidade(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  minWidth: "300px",
                  fontSize: "15px",
                }}
              >
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <Card titulo="Aulas Hoje" valor={dashboard.aulasHoje} cor="#1d4ed8" />
          <Card titulo="Total Aulas" valor={dashboard.totalAulas} cor="#2563eb" />
          <Card titulo="Compareceu" valor={dashboard.totalCompareceu} cor="#16a34a" />
          <Card titulo="Faltou" valor={dashboard.totalFaltou} cor="#dc2626" />
          <Card titulo="Total Diárias" valor={dashboard.totalDiarias} cor="#7c3aed" />
          <Card titulo="Vendas" valor={dashboard.vendasEfetivadas} cor="#ca8a04" />
          <Card titulo="Diárias Ativas" valor={dashboard.diariasAtivas} cor="#7c3aed" />
          <Card
            titulo="Taxa de Comparecimento"
            valor={`${dashboard.taxaComparecimento}%`}
            cor="#1e40af"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#dc2626",
              }}
            >
              Diárias vencendo hoje
            </h2>

            {dashboard.diariasVencendoHoje.length === 0 ? (
              <p>Nenhuma diária vence hoje.</p>
            ) : (
              dashboard.diariasVencendoHoje.map((diaria: any) => (
                <div
                  key={diaria.id}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    fontWeight: "bold",
                  }}
                >
                  {diaria.nome}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              Modalidades Mais Solicitadas
            </h2>

            {Object.entries(dashboard.modalidades || {}).length === 0 ? (
              <p>Nenhuma modalidade registrada.</p>
            ) : (
              Object.entries(dashboard.modalidades).map(
                ([modalidade, quantidade]: any) => (
                  <div key={modalidade} style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <strong>{modalidade}</strong>
                      <span>{quantidade}</span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        background: "#e5e7eb",
                        borderRadius: "999px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(Number(quantidade) * 25, 100)}%`,
                          height: "12px",
                          background: "#2563eb",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor, cor }: any) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "18px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        minHeight: "120px",
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "18px",
        }}
      >
        {titulo}
      </h2>

      <p
        style={{
          fontSize: "42px",
          fontWeight: "bold",
          color: cor,
        }}
      >
        {valor}
      </p>
    </div>
  );
}