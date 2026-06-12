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

function ordenarDados(dados: any) {
  return Object.entries(dados || {}).sort((a: any, b: any) => Number(b[1]) - Number(a[1]));
}

function medalha(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}º`;
}

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


const STORAGE_AGENDAMENTOS_NUTRI = "prix_nutri_agendamentos";
const STORAGE_CHECKINS = "prix_dashboard_checkins";

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

function normalizarNome(nome: any) {
  return String(nome || "NÃO INFORMADO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function nomeBonito(nome: any) {
  const texto = normalizarNome(nome);
  if (!texto || texto === "NAO INFORMADO") return "NÃO INFORMADO";
  return texto
    .toLowerCase()
    .split(" ")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function pertenceAoMesLocal(data: any, mes: string) {
  const valor = String(data || "");
  if (!valor) return false;
  if (valor.startsWith(mes)) return true;
  const partes = valor.split("/");
  if (partes.length === 3) {
    const [dia, mesBR, ano] = partes;
    return `${ano}-${mesBR.padStart(2, "0")}` === mes;
  }
  return false;
}

function consultaNutriFreeOuParticular(consulta: any) {
  const tipo = normalizarNome(consulta.tipoConsulta);
  const pagamento = normalizarNome(consulta.statusPagamento);
  return tipo.includes("FREE") || tipo.includes("PARTICULAR") || pagamento.includes("FREE");
}

function consultaNutriConvertida(consulta: any) {
  return Boolean(
    consulta.converteuPlanoPago ||
      consulta.converteuPlano ||
      consulta.convertidoEmPlano ||
      consulta.planoConvertido ||
      consulta.dataConversao ||
      consulta.vendedoraConversao
  );
}

function calcularNutricionistaLocal(mes: string) {
  try {
    const agendamentos = JSON.parse(localStorage.getItem(STORAGE_AGENDAMENTOS_NUTRI) || "[]");
    const doMes = Array.isArray(agendamentos)
      ? agendamentos.filter((item: any) => pertenceAoMesLocal(item.dataConsulta, mes))
      : [];

    const base = doMes.filter(consultaNutriFreeOuParticular);
    const convertidos = base.filter(consultaNutriConvertida);
    const ranking: any = {};

    convertidos.forEach((item: any) => {
      const chave = normalizarNome(item.vendedoraConversao || item.nomeVendedoraConversao || item.vendedora || "NÃO INFORMADO");
      const nome = nomeBonito(chave);
      ranking[nome] = (ranking[nome] || 0) + 1;
    });

    return {
      consultasFreeParticularMes: base.length,
      convertidosMes: convertidos.length,
      taxaConversaoMes: base.length > 0 ? Math.round((convertidos.length / base.length) * 100) : 0,
      rankingConversao: ranking,
    };
  } catch {
    return { consultasFreeParticularMes: 0, convertidosMes: 0, taxaConversaoMes: 0, rankingConversao: {} };
  }
}

function carregarCheckinsStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CHECKINS) || "{}");
  } catch {
    return {};
  }
}

export default function Home() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualSistema());
  const [checkins, setCheckins] = useState<any>({});

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
    contratosPorTipoDia: { novo: 0, retorno: 0, renovacao: 0, total: 0 },
    contratosPorTipoMes: { novo: 0, retorno: 0, renovacao: 0, total: 0 },
    rankingContratosGeral: [],
    nutricionista: {
      consultasFreeParticularMes: 0,
      convertidosMes: 0,
      taxaConversaoMes: 0,
      rankingConversao: {},
    },
    diariasConversao: {
      diariasMes: 0,
      convertidasMes: 0,
      taxaConversaoMes: 0,
      rankingConversao: {},
    },
  });

  useEffect(() => {
    setCheckins(carregarCheckinsStorage());
  }, []);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuarioSalvo);
    setUsuario(user);

    if (String(user.cargo).toUpperCase() === "NUTRICIONISTA") {
      router.push("/agenda-nutricionista");
      return;
    }

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
      const response = await fetch(`/api/dashboard?unidadeId=${unidadeId}&mes=${mes}`, { cache: "no-store" });
      const data = await response.json();
      const nutriLocal = calcularNutricionistaLocal(mes);

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
        contratosPorTipoDia: data.contratosPorTipoDia || { novo: 0, retorno: 0, renovacao: 0, total: 0 },
        contratosPorTipoMes: data.contratosPorTipoMes || { novo: 0, retorno: 0, renovacao: 0, total: 0 },
        rankingContratosGeral: data.rankingContratosGeral || [],
        nutricionista: nutriLocal.consultasFreeParticularMes > 0 || nutriLocal.convertidosMes > 0 ? nutriLocal : (data.nutricionista || {
          consultasFreeParticularMes: 0,
          convertidosMes: 0,
          taxaConversaoMes: 0,
          rankingConversao: {},
        }),
        diariasConversao: data.diariasConversao || {
          diariasMes: 0,
          convertidasMes: 0,
          taxaConversaoMes: 0,
          rankingConversao: {},
        },
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

  function gerarTopConversao() {
    const aulasPorColaboradora = dashboard.aulasPorColaboradora || {};
    const vendasGeradasPorColaboradora: any = {};

    (dashboard.conversaoAgendouVendeu || []).forEach((item: any) => {
      const colaboradora = item.colaboradora || "NÃO INFORMADO";
      vendasGeradasPorColaboradora[colaboradora] =
        (vendasGeradasPorColaboradora[colaboradora] || 0) + Number(item.quantidade || 0);
    });

    const resultado: any = {};

    Object.entries(aulasPorColaboradora).forEach(([nome, totalAulas]: any) => {
      const vendas = vendasGeradasPorColaboradora[nome] || 0;
      const aulas = Number(totalAulas || 0);
      const taxa = aulas > 0 ? Math.round((vendas / aulas) * 100) : 0;

      resultado[nome] = taxa;
    });

    return resultado;
  }

  function atualizarCheckin(campo: "gympass" | "totalpass", valor: string) {
    const dataHoje = hojeISO();
    const atual = carregarCheckinsStorage();
    const atualizado = {
      ...atual,
      [dataHoje]: {
        ...(atual[dataHoje] || {}),
        [campo]: Number(valor || 0),
      },
    };

    localStorage.setItem(STORAGE_CHECKINS, JSON.stringify(atualizado));
    setCheckins(atualizado);
  }

  function totalCheckinMes(campo: "gympass" | "totalpass") {
    return Object.entries(checkins || {}).reduce((total: number, [data, valores]: any) => {
      if (!String(data).startsWith(mesSelecionado)) return total;
      return total + Number(valores?.[campo] || 0);
    }, 0);
  }

  const topConversao = gerarTopConversao();
  const dataHojeCheckin = hojeISO();
  const checkinHoje = checkins?.[dataHojeCheckin] || {};

  return (
    <main style={{ display: "flex", background: "#f3f4f6", minHeight: "100vh" }}>
      <Sidebar />

      <section style={{ flex: 1, padding: "24px" }}>
        <div style={topo}>
          <div>
            <h1 style={{ fontSize: "34px", fontWeight: "bold" }}>Dashboard Comercial</h1>
            <p style={{ color: "#6b7280", marginTop: "4px" }}>
              Ranking comercial, vendas, contratos e conversão da equipe
            </p>
          </div>

          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {usuario?.cargo === "ADMIN_GERAL" && (
              <div style={filtroBox}>
                <label style={labelFiltro}>Unidade:</label>
                <select value={unidadeSelecionada} onChange={(e) => trocarUnidade(e.target.value)} style={selectFiltro}>
                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={filtroBox}>
              <label style={labelFiltro}>Mês:</label>
              <input type="month" value={mesSelecionado} onChange={(e) => trocarMes(e.target.value)} style={selectFiltro} />
            </div>
          </div>
        </div>

        <CardCheckins
          gympassDia={checkinHoje.gympass || 0}
          totalpassDia={checkinHoje.totalpass || 0}
          gympassMes={totalCheckinMes("gympass")}
          totalpassMes={totalCheckinMes("totalpass")}
          onChange={atualizarCheckin}
        />

        <div style={cardsGrid}>
          <Card icone="📅" titulo="Aulas Hoje" valor={dashboard.aulasHoje} cor="#1d4ed8" />
          <Card icone="📋" titulo="Total Aulas" valor={dashboard.totalAulas} cor="#2563eb" />
          <Card icone="✅" titulo="Compareceu" valor={dashboard.totalCompareceu} cor="#16a34a" />
          <Card icone="❌" titulo="Faltou" valor={dashboard.totalFaltou} cor="#dc2626" />
          <Card icone="📊" titulo="Comparecimento" valor={`${dashboard.taxaComparecimento}%`} cor="#1e40af" />
          <Card icone="📈" titulo="Conversão Aulas" valor={`${dashboard.taxaConversao}%`} cor="#16a34a" />
          <Card icone="💰" titulo="Vendas de Aulas" valor={dashboard.vendasEfetivadas} cor="#ca8a04" />
          <Card icone="🎟️" titulo="Diárias Ativas" valor={dashboard.diariasAtivas} cor="#7c3aed" />
        </div>

        <div style={duploGrid}>
          <CardTipos titulo="🧾 Contratos lançados hoje" subtitulo="Novo, Retorno e Renovação" dados={dashboard.contratosPorTipoDia} cor="#2563eb" fundo="#eff6ff" />
          <CardTipos titulo="📆 Contratos lançados no mês" subtitulo="Novo, Retorno e Renovação" dados={dashboard.contratosPorTipoMes} cor="#7c3aed" fundo="#f3e8ff" />
        </div>

        <div style={nutriGrid}>
          <CardNutri
            titulo="🥗 Nutricionista - Conversão do mês"
            consultas={dashboard.nutricionista.consultasFreeParticularMes}
            convertidos={dashboard.nutricionista.convertidosMes}
            taxa={dashboard.nutricionista.taxaConversaoMes}
          />

          <RankingNutri dados={dashboard.nutricionista.rankingConversao} />
        </div>

        <RankingContratos dados={dashboard.rankingContratosGeral} />

        <div style={rankingGrid}>
          <TopRanking titulo="🏆 Top Agendamentos" subtitulo="Quem mais marcou aulas no mês" dados={dashboard.aulasPorColaboradora} sufixo="aulas" cor="#2563eb" fundo="#eff6ff" />
          <TopRanking titulo="💰 Top Vendas de Aulas Agendadas" subtitulo="Quem mais fechou vendas vindas das aulas" dados={dashboard.vendasPorVendedora} sufixo="vendas" cor="#2563eb" fundo="#eff6ff" />
          <TopRanking titulo="📈 Top Conversão de Aulas Agendadas" subtitulo="Vendas geradas ÷ aulas agendadas" dados={topConversao} sufixo="%" cor="#2563eb" fundo="#eff6ff" porcentagem />
        </div>

        <div style={nutriGrid}>
          <CardDiariaConversao dados={dashboard.diariasConversao} />
          <RankingDiaria dados={dashboard.diariasConversao.rankingConversao} />
        </div>

        <div style={graficoGrid}>
          <div style={bloco}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px", color: "#dc2626" }}>
              Diárias vencendo hoje
            </h2>

            {dashboard.diariasVencendoHoje.length === 0 ? (
              <p style={{ color: "#6b7280" }}>Nenhuma diária vence hoje.</p>
            ) : (
              dashboard.diariasVencendoHoje.map((diaria: any) => (
                <div key={diaria.id} style={linhaLista}>{diaria.nome}</div>
              ))
            )}
          </div>

          <GraficoBarras titulo="🏋️ Modalidades mais solicitadas" dados={dashboard.modalidades} cor="#7c3aed" sufixo="aulas" />
        </div>

        <div style={{ ...bloco, marginTop: "25px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "6px" }}>
            Conversão: quem agendou x quem vendeu
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "18px" }}>
            Mostra quais vendas vieram de aulas marcadas por outra colaboradora.
          </p>

          {dashboard.conversaoAgendouVendeu.length === 0 ? (
            <p style={{ color: "#6b7280" }}>Nenhuma conversão registrada.</p>
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
                {[...dashboard.conversaoAgendouVendeu]
                  .sort((a: any, b: any) => Number(b.quantidade) - Number(a.quantidade))
                  .map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={td}>{item.colaboradora}</td>
                      <td style={td}>{item.vendedora}</td>
                      <td style={td}><strong>{item.quantidade}</strong></td>
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

const topo = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px", flexWrap: "wrap" as const };
const filtroBox = { background: "white", padding: "12px 16px", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "12px" };
const labelFiltro = { fontWeight: "bold", fontSize: "15px" };
const selectFiltro = { padding: "9px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "15px" };
const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(105px, 1fr))",
  gap: "8px",
  marginBottom: "10px",
};
const duploGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
  gap: "10px",
  marginBottom: "10px",
};
const nutriGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "10px",
};
const rankingGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
  gap: "10px",
  marginBottom: "10px",
};
const graficoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "25px" };
const bloco = { background: "white", borderRadius: "16px", padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" };
const linhaLista = { padding: "12px", borderBottom: "1px solid #e5e7eb", fontWeight: "bold" };
const th = { padding: "11px", borderBottom: "2px solid #111827", textAlign: "left" as const, background: "#f9fafb", fontSize: "13px" };
const td = { padding: "11px", borderBottom: "1px solid #e5e7eb", fontSize: "13px" };
const cardCheckins = {
  background: "#f3e8ff",
  border: "1px solid #d8b4fe",
  borderLeft: "5px solid #7c3aed",
  borderRadius: "16px",
  padding: "8px 12px",
  marginBottom: "10px",
  boxShadow: "0 2px 8px rgba(124,58,237,0.12)",
};
const boxCheckin = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid #d8b4fe",
  borderRadius: "12px",
  padding: "6px 8px",
  minHeight: "54px",
};
const labelCheckin = { color: "#581c87", fontWeight: 800, fontSize: "12px", marginBottom: "4px" };
const inputCheckin = {
  width: "100%",
  border: "1px solid #c084fc",
  borderRadius: "9px",
  padding: "3px 8px",
  fontSize: "18px",
  fontWeight: 900,
  color: "#581c87",
  background: "white",
  height: "30px",
};
const valorCheckin = {
  display: "block",
  fontSize: "20px",
  color: "#581c87",
  marginTop: "2px",
};
const pillRoxo = { display: "inline-block", minWidth: "54px", textAlign: "center" as const, padding: "6px 10px", borderRadius: "999px", fontWeight: 900 };

function Card({ icone, titulo, valor, cor }: any) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "14px",
        padding: "9px 10px",
        boxShadow: "0 2px 7px rgba(0,0,0,0.07)",
        minHeight: "68px",
        borderLeft: `5px solid ${cor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: "bold", color: "#374151", lineHeight: 1.15 }}>
          {titulo}
        </h2>
        <span style={{ fontSize: "18px" }}>{icone}</span>
      </div>

      <p style={{ fontSize: "28px", fontWeight: 900, color: cor, marginTop: "5px", lineHeight: 1 }}>
        {valor}
      </p>
    </div>
  );
}

function CardCheckins({ gympassDia, totalpassDia, gympassMes, totalpassMes, onChange }: any) {
  return (
    <div style={cardCheckins}>
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "1px" }}>💜 Check-ins Gympass e TotalPass</h2>
        <p style={{ color: "#6b7280", fontSize: "11px" }}>Os check-ins do dia são lançados manualmente. O mês soma automaticamente.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(95px, 1fr))", gap: "8px", marginTop: "6px" }}>
        <div style={boxCheckin}>
          <p style={labelCheckin}>🏋️ Gympass hoje</p>
          <input type="number" min="0" value={gympassDia} onChange={(e) => onChange("gympass", e.target.value)} style={inputCheckin} />
        </div>
        <div style={boxCheckin}>
          <p style={labelCheckin}>🎫 TotalPass hoje</p>
          <input type="number" min="0" value={totalpassDia} onChange={(e) => onChange("totalpass", e.target.value)} style={inputCheckin} />
        </div>
        <div style={boxCheckin}>
          <p style={labelCheckin}>📆 Gympass mês</p>
          <strong style={valorCheckin}>{gympassMes}</strong>
        </div>
        <div style={boxCheckin}>
          <p style={labelCheckin}>📆 TotalPass mês</p>
          <strong style={valorCheckin}>{totalpassMes}</strong>
        </div>
      </div>
    </div>
  );
}

function CardTipos({ titulo, subtitulo, dados, cor, fundo = "white" }: any) {
  const itens = [
    { label: "Novos", valor: dados?.novo || 0, emoji: "🟢", color: "#16a34a" },
    { label: "Retornos", valor: dados?.retorno || 0, emoji: "🔵", color: "#2563eb" },
    { label: "Renovações", valor: dados?.renovacao || 0, emoji: "🟣", color: "#7c3aed" },
    { label: "Total", valor: dados?.total || 0, emoji: "⚡", color: cor },
  ];

  return (
    <div style={{ ...bloco, background: fundo, border: `1px solid ${cor}33`, borderLeft: `6px solid ${cor}` }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>{titulo}</h2>
      <p style={{ color: "#6b7280", marginTop: "4px", marginBottom: "14px", fontSize: "14px" }}>{subtitulo}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {itens.map((item) => (
          <div key={item.label} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "12px" }}>
            <p style={{ fontSize: "13px", color: "#4b5563", fontWeight: 700 }}>{item.emoji} {item.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 900, color: item.color, marginTop: "6px" }}>{item.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardNutri({ titulo, consultas, convertidos, taxa }: any) {
  return (
    <div style={{ ...bloco, background: "#fef9c3", border: "1px solid #fde68a", borderLeft: "6px solid #ca8a04" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "14px" }}>{titulo}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        <MiniIndicador emoji="🥗" titulo="Free/Particular" valor={consultas} cor="#2563eb" />
        <MiniIndicador emoji="💰" titulo="Convertidos" valor={convertidos} cor="#16a34a" />
        <MiniIndicador emoji="📈" titulo="Taxa" valor={`${taxa}%`} cor="#ca8a04" />
      </div>
    </div>
  );
}

function MiniIndicador({ emoji, titulo, valor, cor }: any) {
  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "12px" }}>
      <p style={{ fontSize: "13px", color: "#4b5563", fontWeight: 700 }}>{emoji} {titulo}</p>
      <p style={{ fontSize: "28px", fontWeight: 900, color: cor, marginTop: "6px" }}>{valor}</p>
    </div>
  );
}

function RankingNutri({ dados }: any) {
  const entradas = ordenarDados(dados).slice(0, 5);

  return (
    <div style={{ ...bloco, background: "#fef9c3", border: "1px solid #fde68a", borderLeft: "6px solid #ca8a04" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>🏅 Ranking Conversão Nutricionista</h2>
      <p style={{ color: "#6b7280", marginBottom: "12px", fontSize: "14px" }}>Quem mais converteu consultas em planos</p>
      {entradas.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Nenhuma conversão registrada.</p>
      ) : entradas.map(([nome, quantidade]: any, index: number) => (
        <div key={nome} style={linhaRankingPequena}>
          <strong>{medalha(index)} {nome}</strong>
          <strong style={{ color: "#16a34a" }}>{quantidade} planos</strong>
        </div>
      ))}
    </div>
  );
}

function TopRanking({ titulo, subtitulo, dados, sufixo, cor, fundo = "white", porcentagem = false }: any) {
  const entradas = ordenarDados(dados).slice(0, 5);

  return (
    <div style={{ ...bloco, background: fundo, border: "1px solid #bfdbfe", borderLeft: `6px solid ${cor}` }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>{titulo}</h2>
      <p style={{ color: "#6b7280", marginBottom: "14px", fontSize: "13px" }}>{subtitulo}</p>
      {entradas.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Nenhum registro encontrado.</p>
      ) : (
        entradas.map(([nome, quantidade]: any, index: number) => (
          <div key={nome} style={linhaRankingPequena}>
            <strong>{medalha(index)} {nome}</strong>
            <strong style={{ color: cor, fontSize: "16px" }}>{quantidade}{porcentagem ? "%" : ` ${sufixo}`}</strong>
          </div>
        ))
      )}
    </div>
  );
}

const linhaRankingPequena = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  marginBottom: "8px",
};

function RankingContratos({ dados }: any) {
  return (
    <div style={{
      ...bloco,
      background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
      border: "1px solid #86efac",
      borderLeft: "8px solid #16a34a",
      marginBottom: "18px",
      padding: "22px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "4px", color: "#064e3b" }}>
            🏆 Ranking Geral de Contratos Lançados
          </h2>
          <p style={{ color: "#166534", fontWeight: 700 }}>
            Contratos totais contam mensal. Contratos válidos não contam mensal.
          </p>
        </div>
        <div style={{ fontSize: "44px" }}>📊</div>
      </div>

      {(dados || []).length === 0 ? (
        <p style={{ color: "#166534" }}>Nenhum contrato lançado neste mês.</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {(dados || []).slice(0, 8).map((item: any, index: number) => (
            <div
              key={item.vendedora}
              style={{
                display: "grid",
                gridTemplateColumns: "86px 1.5fr 1fr 1fr 1fr",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255,255,255,0.88)",
                border: "1px solid #bbf7d0",
                borderRadius: "18px",
                padding: "12px 16px",
                boxShadow: index < 3 ? "0 8px 16px rgba(22,163,74,0.10)" : "none",
              }}
            >
              <div style={{
                width: 58,
                height: 58,
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: index < 3 ? "31px" : "22px",
                fontWeight: 900,
                background: index === 0 ? "#fef3c7" : index === 1 ? "#f1f5f9" : index === 2 ? "#ffedd5" : "#dcfce7",
              }}>
                {medalha(index)}
              </div>

              <div>
                <p style={{ fontSize: "20px", fontWeight: 900, color: "#064e3b" }}>{item.vendedora}</p>
                <p style={{ color: "#16a34a", fontSize: "13px", fontWeight: 800 }}>Vendedora</p>
              </div>

              <PillRanking titulo="Meios pendentes" valor={item.meiosPendentes ? `${item.meiosPendentes} meio` : "0"} cor={item.meiosPendentes ? "#fef3c7" : "#ecfdf5"} />
              <PillRanking titulo="Contratos totais" valor={item.contratosTotais} cor="#dbeafe" />
              <PillRanking titulo="Contratos válidos" valor={item.contratosValidos} cor="#bbf7d0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PillRanking({ titulo, valor, cor }: any) {
  return (
    <div>
      <p style={{ fontSize: "12px", color: "#166534", fontWeight: 900, textTransform: "uppercase" }}>{titulo}</p>
      <strong style={{
        display: "inline-flex",
        justifyContent: "center",
        minWidth: "70px",
        marginTop: "5px",
        padding: "7px 14px",
        borderRadius: "999px",
        background: cor,
        color: "#052e16",
        fontSize: "18px",
        fontWeight: 900,
      }}>
        {valor}
      </strong>
    </div>
  );
}

function CardDiariaConversao({ dados }: any) {
  return (
    <div style={{ ...bloco, background: "#ecfdf5", border: "1px solid #86efac", borderLeft: "6px solid #16a34a" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "14px" }}>🎟️ Diárias - Conversão do mês</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        <MiniIndicador emoji="🎫" titulo="Diárias no mês" valor={dados?.diariasMes || 0} cor="#2563eb" />
        <MiniIndicador emoji="💰" titulo="Convertidas" valor={dados?.convertidasMes || 0} cor="#16a34a" />
        <MiniIndicador emoji="📈" titulo="Taxa" valor={`${dados?.taxaConversaoMes || 0}%`} cor="#047857" />
      </div>
    </div>
  );
}

function RankingDiaria({ dados }: any) {
  const entradas = ordenarDados(dados).slice(0, 5);

  return (
    <div style={{ ...bloco, background: "#ecfdf5", border: "1px solid #86efac", borderLeft: "6px solid #16a34a" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>🏅 Ranking Conversão de Diárias</h2>
      <p style={{ color: "#6b7280", marginBottom: "12px", fontSize: "14px" }}>Quem mais converteu diárias em planos</p>
      {entradas.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Nenhuma conversão registrada.</p>
      ) : entradas.map(([nome, quantidade]: any, index: number) => (
        <div key={nome} style={linhaRankingPequena}>
          <strong>{medalha(index)} {nome}</strong>
          <strong style={{ color: "#16a34a" }}>{quantidade} planos</strong>
        </div>
      ))}
    </div>
  );
}

function GraficoBarras({ titulo, dados, cor, sufixo }: any) {
  const entradas = ordenarDados(dados);
  const maior = Math.max(...entradas.map(([, valor]: any) => Number(valor)), 1);

  return (
    <div style={bloco}>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}>{titulo}</h2>
      {entradas.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Nenhum registro encontrado.</p>
      ) : (
        entradas.map(([nome, quantidade]: any) => {
          const largura = Math.max((Number(quantidade) / maior) * 100, 8);
          return (
            <div key={nome} style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <strong>{nome}</strong>
                <span>{quantidade} {sufixo}</span>
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
