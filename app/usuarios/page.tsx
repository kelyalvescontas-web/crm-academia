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
  const [pinMetas, setPinMetas] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [temaNome, setTemaNome] = useState("AZUL");
  const [temaCor, setTemaCor] = useState("#1e3a8a");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuario);
    const cargoUser = String(user.cargo || "").toUpperCase();

    if (cargoUser !== "ADMIN_GERAL" && cargoUser !== "ADMIN") {
      alert("Você não tem permissão para acessar usuários.");
      router.push("/");
      return;
    }

    setUsuarioLogado(user);
    carregarUsuarios(user);
    carregarUnidades();
  }, [router]);

  function podeGerenciarUsuarios(user = usuarioLogado) {
    const cargoUser = String(user?.cargo || "").toUpperCase();
    return cargoUser === "ADMIN_GERAL" || cargoUser === "ADMIN";
  }

  async function carregarUsuarios(user: any) {
    const response = await fetch("/api/usuarios", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!Array.isArray(data)) {
      setUsuarios([]);
      return;
    }

    setUsuarios(data);
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
    setPinMetas("");
    setFotoUrl("");
    setTemaNome("AZUL");
    setTemaCor("#1e3a8a");

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
    setPinMetas("");
    setFotoUrl(usuario.fotoUrl || "");
    setTemaNome(usuario.temaNome || "AZUL");
    setTemaCor(usuario.temaCor || "#1e3a8a");
  }

  function escolherTema(nomeTema: string, cor: string) {
    setTemaNome(nomeTema);
    setTemaCor(cor);
  }

  function validarPin() {
    if (!pinMetas) return true;

    if (!/^\d{4}$/.test(pinMetas)) {
      alert("O PIN das Metas deve ter exatamente 4 números.");
      return false;
    }

    return true;
  }

  async function salvarUsuario() {
    if (!usuarioLogado) return;

    if (!podeGerenciarUsuarios()) {
      alert("Você não tem permissão para salvar usuários.");
      return;
    }

    if (!nome || !email || (!editandoId && !senha) || !unidadeId) {
      alert("Preencha nome, email, senha e unidade.");
      return;
    }

    if (!validarPin()) return;

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
        pinMetas,
        fotoUrl,
        temaNome,
        temaCor,

        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioCargo: usuarioLogado.cargo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao salvar usuário");
      return;
    }

    if (editandoId === usuarioLogado.id) {
      localStorage.setItem("usuario", JSON.stringify(data));
      setUsuarioLogado(data);
    }

    await carregarUsuarios(usuarioLogado);
    limparFormulario();

    alert(editandoId ? "Usuário editado com sucesso!" : "Usuário cadastrado com sucesso!");
  }

  async function excluirUsuario(id: number) {
    if (!usuarioLogado) return;

    if (String(usuarioLogado.cargo || "").toUpperCase() !== "ADMIN_GERAL") {
      alert("Somente ADMIN_GERAL pode excluir usuários.");
      return;
    }

    if (!confirm("Deseja excluir este usuário?")) return;

    await fetch("/api/usuarios", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioCargo: usuarioLogado.cargo,
      }),
    });

    await carregarUsuarios(usuarioLogado);
  }

  const adminGeral = String(usuarioLogado?.cargo || "").toUpperCase() === "ADMIN_GERAL";
  const podeEditar = podeGerenciarUsuarios();

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-500 mt-1">
              Cadastre usuários, PIN das metas, foto e tema individual.
            </p>
          </div>
        </div>

        {podeEditar && (
          <div className="bg-white p-5 rounded-2xl shadow mb-8">
            <h2 className="text-3xl font-bold mb-6">
              {editandoId ? "Editar Usuário" : "Cadastrar Usuário"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo label="Nome" value={nome} setValue={setNome} />
              <Campo label="Email" value={email} setValue={setEmail} />

              <Campo
                label={editandoId ? "Nova Senha (opcional)" : "Senha"}
                value={senha}
                setValue={setSenha}
                type="password"
              />

              <Campo
                label="PIN das Metas (4 números)"
                value={pinMetas}
                setValue={(valor: string) =>
                  setPinMetas(valor.replace(/\D/g, "").slice(0, 4))
                }
                type="password"
                placeholder={editandoId ? "Deixe vazio para manter" : "Ex: 1234"}
              />

              <div>
                <label className="block mb-2 font-bold">Cargo</label>

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
                <label className="block mb-2 font-bold">Unidade</label>

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

           <label>Foto do usuário</label>

<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    const reader = new FileReader();

    reader.onloadend = () => {
  setFotoUrl(reader.result as string);
};
{fotoUrl && (
  <img
    src={fotoUrl}
    alt="Preview"
    className="w-24 h-24 rounded-full object-cover border mt-3"
  />
)}
    reader.readAsDataURL(arquivo);
  }}
  className="w-full border rounded-xl p-3"
/>
              <div>
                <label className="block mb-2 font-bold">Tema individual</label>

                <div className="grid grid-cols-5 gap-2">
                  <BotaoTema nome="AZUL" cor="#1e3a8a" ativo={temaNome} escolherTema={escolherTema} />
                  <BotaoTema nome="ROXO" cor="#692fc6" ativo={temaNome} escolherTema={escolherTema} />
                  <BotaoTema nome="VERDE" cor="#135f2f" ativo={temaNome} escolherTema={escolherTema} />
                  <BotaoTema nome="VERMELHO" cor="#b91c1c" ativo={temaNome} escolherTema={escolherTema} />
                  <BotaoTema nome="ESCURO" cor="#0f172a" ativo={temaNome} escolherTema={escolherTema} />
                  <BotaoTema nome="AMARELO" cor="#ca8a04" ativo={temaNome} escolherTema={escolherTema} />
                  <BotaoTema nome="LARANJA" cor="#c2410c" ativo={temaNome} escolherTema={escolherTema} />
                   <BotaoTema nome="ROSA" cor="#b62063" ativo={temaNome} escolherTema={escolherTema} />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full border"
                    style={{ backgroundColor: temaCor }}
                  />
                  <span className="text-sm text-gray-600">
                    Tema selecionado: <strong>{temaNome}</strong>
                  </span>
                </div>
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
        )}

        <div className="bg-white p-8 rounded-2xl shadow overflow-x-auto">
          <h2 className="text-3xl font-bold mb-6">
            Usuários Cadastrados
          </h2>

          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Foto</th>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Cargo</th>
                <th className="p-3 text-left">Unidade</th>
                <th className="p-3 text-left">Tema</th>
                <th className="p-3 text-left">PIN Metas</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b">
                  <td className="p-3">
                    {usuario.fotoUrl ? (
                      <img
                        src={usuario.fotoUrl}
                        alt={usuario.nome}
                        className="w-11 h-11 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                        {String(usuario.nome || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-bold">{usuario.nome}</td>
                  <td className="p-3">{usuario.email}</td>
                  <td className="p-3">{usuario.cargo}</td>
                  <td className="p-3">
                    {usuario.unidade?.nome || "Sem unidade"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: usuario.temaCor || "#1e3a8a" }}
                      />
                      <span>{usuario.temaNome || "AZUL"}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {usuario.temPinMetas ? "Cadastrado" : "Não cadastrado"}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarUsuario(usuario)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold"
                      >
                        Editar
                      </button>

                      {adminGeral && (
                        <button
                          onClick={() => excluirUsuario(usuario.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Campo({
  label,
  value,
  setValue,
  type = "text",
  placeholder = "",
}: any) {
  return (
    <div>
      <label className="block mb-2 font-bold">{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}

function BotaoTema({ nome, cor, ativo, escolherTema }: any) {
  return (
    <button
      type="button"
      onClick={() => escolherTema(nome, cor)}
      className={`rounded-xl p-3 border font-bold text-xs ${
        ativo === nome ? "ring-4 ring-blue-200" : ""
      }`}
      style={{
        backgroundColor: cor,
        color: "white",
      }}
    >
      {nome}
    </button>
  );
}
