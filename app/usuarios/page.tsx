"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function UsuariosPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState("COLABORADORA");
  const [unidadeId, setUnidadeId] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuario);

    setUsuarioLogado(user);
    carregarUsuarios(user);
    carregarUnidades();
  }, [router]);

  async function carregarUsuarios(user: any) {
    const response = await fetch("/api/usuarios", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!Array.isArray(data)) {
      setUsuarios([]);
      return;
    }

    if (user.cargo === "ADMIN_GERAL") {
      setUsuarios(data);
    } else {
      setUsuarios(data.filter((u: any) => u.id === user.id));
    }
  }

  async function carregarUnidades() {
    const response = await fetch("/api/unidades", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!Array.isArray(data)) return;

    setUnidades(data);

    const unidadeSalva = localStorage.getItem("unidadeSelecionadaId");

    if (unidadeSalva) {
      setUnidadeId(unidadeSalva);
    }
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setSenha("");
    setCargo("COLABORADORA");

    const unidadeSalva = localStorage.getItem("unidadeSelecionadaId");

    if (unidadeSalva) {
      setUnidadeId(unidadeSalva);
    }
  }

  function editarUsuario(usuario: any) {
    setEditandoId(usuario.id);
    setNome(usuario.nome || "");
    setEmail(usuario.email || "");
    setSenha("");
    setCargo(usuario.cargo || "COLABORADORA");
    setUnidadeId(String(usuario.unidadeId || ""));
  }

  async function salvarUsuario() {
    if (!usuarioLogado) return;

    const adminGeral = usuarioLogado.cargo === "ADMIN_GERAL";

    if (!adminGeral) {
      if (!senha) {
        alert("Digite uma nova senha.");
        return;
      }

      const response = await fetch("/api/usuarios", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: usuarioLogado.id,
          nome: usuarioLogado.nome,
          email: usuarioLogado.email,
          senha,
          cargo: usuarioLogado.cargo,
          unidadeId: usuarioLogado.unidadeId,
        }),
      });

      if (!response.ok) {
        alert("Erro ao alterar senha");
        return;
      }

      alert("Senha alterada com sucesso!");
      setSenha("");
      return;
    }

    if (!nome || !email || (!editandoId && !senha) || !unidadeId) {
      alert("Preencha todos os campos.");
      return;
    }

    const response = await fetch("/api/usuarios", {
      method: editandoId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: editandoId,
        nome,
        email,
        senha,
        cargo,
        unidadeId: Number(unidadeId),
      }),
    });

    if (!response.ok) {
      alert("Erro ao salvar usuário");
      return;
    }

    await carregarUsuarios(usuarioLogado);
    limparFormulario();
  }

  async function excluirUsuario(id: number) {
    if (!confirm("Deseja excluir este usuário?")) return;

    await fetch("/api/usuarios", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    await carregarUsuarios(usuarioLogado);
  }

  const adminGeral = usuarioLogado?.cargo === "ADMIN_GERAL";

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-8">Usuários</h1>

        {adminGeral ? (
          <div className="bg-white p-5 rounded-2xl shadow mb-8">
            <h2 className="text-3xl font-bold mb-6">
              {editandoId ? "Editar Usuário" : "Cadastrar Usuário"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo label="Nome" value={nome} setValue={setNome} />
              <Campo label="Email" value={email} setValue={setEmail} />

              <Campo
                label={editandoId ? "Nova Senha" : "Senha"}
                value={senha}
                setValue={setSenha}
                type="password"
              />

              <div>
                <label className="block mb-2">Cargo</label>

                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="ADMIN_GERAL">ADMIN GERAL</option>
                  <option value="COLABORADORA">COLABORADORA</option>
                  <option value="INSTRUTOR">INSTRUTOR</option>
                </select>
              </div>

              <div>
                <label className="block mb-2">Unidade</label>

                <select
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option value="">Selecione</option>

                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={salvarUsuario}
                className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold"
              >
                {editandoId ? "Salvar Edição" : "Salvar Usuário"}
              </button>

              <button
                onClick={limparFormulario}
                className="bg-gray-500 text-white px-8 py-4 rounded-xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow mb-8">
            <h2 className="text-3xl font-bold mb-6">Alterar minha senha</h2>

            <Campo
              label="Nova senha"
              value={senha}
              setValue={setSenha}
              type="password"
            />

            <button
              onClick={salvarUsuario}
              className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold mt-6"
            >
              Salvar nova senha
            </button>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow">
          <h2 className="text-3xl font-bold mb-6">
            {adminGeral ? "Usuários Cadastrados" : "Meu Usuário"}
          </h2>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Cargo</th>
                <th className="p-3 text-left">Unidade</th>
                {adminGeral && <th className="p-3 text-left">Ações</th>}
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b">
                  <td className="p-3">{usuario.nome}</td>
                  <td className="p-3">{usuario.email}</td>
                  <td className="p-3">{usuario.cargo}</td>
                  <td className="p-3">
                    {usuario.unidade?.nome || "Sem unidade"}
                  </td>

                  {adminGeral && (
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarUsuario(usuario)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => excluirUsuario(usuario.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Campo({ label, value, setValue, type = "text" }: any) {
  return (
    <div>
      <label className="block mb-2">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}