"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Home() {
  const [dashboard, setDashboard] = useState<any>({
    totalAulas: 0,
    aulasHoje: 0,
    totalDiariasAtivas: 0,
    totalCompareceu: 0,
    totalFaltou: 0,
    totalConfirmada: 0,
    taxaComparecimento: 0,
  });

  async function carregarDashboard() {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();

      setDashboard(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <div style={{ display: "flex", background: "#f3f4f6" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "40px" }}>
        <h1
          style={{
            fontSize: "60px",
            fontWeight: "bold",
            marginBottom: "40px",
          }}
        >
          Dashboard Comercial
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          <Card titulo="Aulas Hoje" valor={dashboard.aulasHoje} cor="#1e40af" />
          <Card titulo="Total Aulas" valor={dashboard.totalAulas} cor="#1e40af" />

          <Card
            titulo="Compareceu"
            valor={dashboard.totalCompareceu}
            cor="#16a34a"
          />

          <Card
            titulo="Faltou"
            valor={dashboard.totalFaltou}
            cor="#dc2626"
          />

          <Card
            titulo="Confirmadas"
            valor={dashboard.totalConfirmada}
            cor="#2563eb"
          />

          <Card
            titulo="Taxa Comparecimento"
            valor={`${dashboard.taxaComparecimento}%`}
            cor="#1d4ed8"
          />
        </div>
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: any;
  cor: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "35px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        {titulo}
      </h2>

      <p
        style={{
          fontSize: "55px",
          fontWeight: "bold",
          color: cor,
        }}
      >
        {valor}
      </p>
    </div>
  );
}