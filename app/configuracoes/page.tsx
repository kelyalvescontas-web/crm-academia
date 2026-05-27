"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

function pegarUnidadeAtual() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (usuario.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId");
  }

  return String(usuario.unidadeId || "");
}

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [nomeAcademia, setNomeAcademia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [metaMensal, setMetaMensal] = useState("");
  const [corSistema, setCorSistema] = useState("#1e3a8a");
  const [logo, setLogo] = useState("");

  const [mensagemConfirmacao, setMensagemConfirmacao] = useState("");
  const [mensagemLembrete, setMensagemLembrete] = useState("");
  const [mensagemPosAula, setMensagemPosAula] = useState("");
  const [mensagemNaoCompareceu, setMensagemNaoCompareceu] = useState("");
  const [mensagemDiaria, setMensagemDiaria] = useState("");

  const adminGeral = usuarioLogado?.cargo === "ADMIN_GERAL";

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    setUsuarioLogado(JSON.parse(usuario));
    carregarConfiguracoes();
  }, [router]);

  async function carregarConfiguracoes() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch(`/api/configuracoes?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    setNomeAcademia(data.nomeAcademia || "");
    setTelefone(data.telefone || "");
    setEndereco(data.endereco || "");
    setMetaMensal(String(data.metaMensal || ""));
    setCorSistema(data.corSistema || "#1e3a8a");
    setLogo(data.logo || "");

    setMensagemConfirmacao(data.mensagemConfirmacao || "");
    setMensagemLembrete(data.mensagemLembrete || "");
    setMensagemPosAula(data.mensagemPosAula || "");
    setMensagemNaoCompareceu(data.mensagemNaoCompareceu || "");
    setMensagemDiaria(data.mensagemDiaria || "");
  }

  function escolherLogo(event: any) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onloadend = () => {
      setLogo(String(leitor.result));
    };

    leitor.readAsDataURL(arquivo);
  }

  async function salvar() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch("/api/configuracoes", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unidadeId: Number(unidadeId),
        nomeAcademia,
        telefone,
        endereco,
        metaMensal,
        corSistema,
        logo,

        mensagemConfirmacao,
        mensagemLembrete,
        mensagemPosAula,
        mensagemNaoCompareceu,
        mensagemDiaria,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      alert(data.error || "Erro ao salvar configurações");
      return;
    }

    alert("Configurações salvas!");

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

      <section style={{ flex: 1, padding: "40px" }}>
        <h1
          style={{
            fontSize: "55px",
            fontWeight: "bold",
            marginBottom: "30px",
          }}
        >
          Configurações
        </h1>

        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            maxWidth: "1000px",
          }}
        >
          <Campo
            label="Nome da Academia"
            value={nomeAcademia}
            setValue={setNomeAcademia}
          />

          <Campo label="Telefone" value={telefone} setValue={setTelefone} />

          <Campo label="Endereço" value={endereco} setValue={setEndereco} />

          <Campo
            label="Meta mensal de vendas"
            value={metaMensal}
            setValue={setMetaMensal}
            type="number"
          />

          <div style={{ marginBottom: "25px" }}>
            <label>Logo da Empresa</label>

            <input
              type="file"
              accept="image/*"
              onChange={escolherLogo}
              style={{
                display: "block",
                marginTop: "10px",
              }}
            />

            {logo && (
              <div style={{ marginTop: "15px" }}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{
                    maxWidth: "220px",
                    maxHeight: "140px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "10px",
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label>Cor do Sistema</label>

            <input
              type="color"
              value={corSistema}
              onChange={(e) => setCorSistema(e.target.value)}
              style={{
                width: "100px",
                height: "50px",
                border: "none",
                marginTop: "10px",
                display: "block",
              }}
            />
          </div>

          {adminGeral && (
            <div
              style={{
                marginTop: "35px",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "30px",
                  fontWeight: "bold",
                  marginBottom: "20px",
                }}
              >
                Mensagens automáticas do WhatsApp
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: "25px",
                }}
              >
                Use as variáveis: {"{aluno}"}, {"{colaboradora}"}, {"{data}"},{" "}
                {"{horario}"}, {"{modalidade}"}, {"{academia}"}, {"{endereco}"}
              </p>

              <Mensagem
                label="Mensagem de confirmação da aula"
                value={mensagemConfirmacao}
                setValue={setMensagemConfirmacao}
              />

              <Mensagem
                label="Mensagem de lembrete da aula"
                value={mensagemLembrete}
                setValue={setMensagemLembrete}
              />

              <Mensagem
                label="Mensagem pós aula"
                value={mensagemPosAula}
                setValue={setMensagemPosAula}
              />

              <Mensagem
                label="Mensagem para não compareceu"
                value={mensagemNaoCompareceu}
                setValue={setMensagemNaoCompareceu}
              />

              <Mensagem
                label="Mensagem de diária"
                value={mensagemDiaria}
                setValue={setMensagemDiaria}
              />
            </div>
          )}

          <button
            onClick={salvar}
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "15px 30px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "18px",
              marginTop: "20px",
            }}
          >
            Salvar Configurações
          </button>
        </div>
      </section>
    </main>
  );
}

function Campo({ label, value, setValue, type = "text" }: any) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={input}
      />
    </div>
  );
}

function Mensagem({ label, value, setValue }: any) {
  return (
    <div style={{ marginBottom: "25px" }}>
      <label
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          height: "140px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          padding: "15px",
          fontSize: "15px",
        }}
      />
    </div>
  );
}

const input = {
  width: "100%",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  marginTop: "10px",
  fontSize: "16px",
};