"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Home() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<any>({
    totalAulas: 0,
    aulasHoje: 0,
    totalDiariasAtivas: 0,
    diariasEncerrandoHoje: [],
    totalCompareceu: 0,
    totalFaltou: 0,
    totalConfirmada: 0,
    taxaComparecimento: 0,
    modalidadeMaisProcurada: "Nenhuma",
  });

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    const response = await fetch("/api/dashboard");
    const data = await response.json();

    setDashboard(data);
  }

  const dadosPresenca = [
    {
      nome: "Compareceu",
      total: dashboard.totalCompareceu,
    },
    {
      nome: "Faltou",
      total: dashboard.totalFaltou,
    },
    {
      nome: "Confirmada",
      total: dashboard.totalConfirmada,
    },
  ];

  const dadosPizza = [
    {
      name: "Compareceu",
      value: dashboard.totalCompareceu,
    },
    {
      name: "Faltou",
      value: dashboard.totalFaltou,
    },
    {
      name: "Confirmada",
      value: dashboard.totalConfirmada,
    },
  ];

  const cores = ["#16a34a", "#dc2626", "#2563eb"];

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-4 md:p-10">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6 md:mb-10">
          Dashboard Comercial
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Aulas Hoje
            </h2>

            <p className="text-3xl md:text-4xl font-bold text-blue-900 mt-3">
              {dashboard.aulasHoje}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Total Aulas
            </h2>

            <p className="text-3xl md:text-4xl font-bold text-blue-900 mt-3">
              {dashboard.totalAulas}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Compareceu
            </h2>

            <p className="text-3xl md:text-4xl font-bold text-green-600 mt-3">
              {dashboard.totalCompareceu}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Faltou
            </h2>

            <p className="text-3xl md:text-4xl font-bold text-red-600 mt-3">
              {dashboard.totalFaltou}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Confirmadas
            </h2>

            <p className="text-3xl md:text-4xl font-bold text-blue-600 mt-3">
              {dashboard.totalConfirmada}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Taxa Comparecimento
            </h2>

            <p className="text-3xl md:text-4xl font-bold text-blue-900 mt-3">
              {dashboard.taxaComparecimento}%
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg md:text-xl font-semibold">
              Modalidade Mais Procurada
            </h2>

            <p className="text-xl md:text-2xl font-bold text-blue-900 mt-3">
              {dashboard.modalidadeMaisProcurada}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Presença das Aulas
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPresenca}>
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1e3a8a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Distribuição de Conversão
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {dadosPizza.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={cores[index % cores.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 md:p-6 overflow-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            Diárias Encerrando Hoje
          </h2>

          {dashboard.diariasEncerrandoHoje.length === 0 ? (
            <p>Nenhuma diária encerrando hoje.</p>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-left">Colaboradora</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.diariasEncerrandoHoje.map((diaria: any) => (
                  <tr key={diaria.id} className="border-b">
                    <td className="p-3">{diaria.nome}</td>
                    <td className="p-3">{diaria.telefone}</td>
                    <td className="p-3">{diaria.colaboradora}</td>
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