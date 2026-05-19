"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] =
    useState("");

  const [cargo, setCargo] =
    useState("ADMIN");

  useEffect(() => {
    const usuarioSalvo =
      localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const usuario =
      JSON.parse(usuarioSalvo);

    if (usuario.cargo !== "ADMIN") {
      router.push("/");
    }
  }, []);

  async function cadastrar() {
    try {
      const response = await fetch(
        "/api/usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            nome,
            email,
            senha,
            cargo,
          }),
        }
      );

      const data =
        await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert(
        "Usuário criado com sucesso!"
      );

      setNome("");
      setEmail("");
      setSenha("");
    } catch (error) {
      alert("Erro ao cadastrar");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white p-10 rounded-2xl shadow w-[500px]">

        <h1 className="text-4xl font-bold mb-8 text-center">
          Cadastro Usuário
        </h1>

        <div className="space-y-5">

          <div>
            <label>Nome</label>

            <input
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(
                  e.target.value.toUpperCase()
                )
              }
              className="w-full border p-3 rounded-xl"
            />
          </div>

          <div>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            />
          </div>

          <div>
            <label>Senha</label>

            <input
              type="password"
              value={senha}
              onChange={(e) =>
                setSenha(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            />
          </div>

          <div>
            <label>Cargo</label>

            <select
              value={cargo}
              onChange={(e) =>
                setCargo(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            >

              <option>
                ADMIN
              </option>

              <option>
                COMERCIAL
              </option>

              <option>
                RECEPCAO
              </option>

              <option>
                FINANCEIRO
              </option>

            </select>
          </div>

          <button
            onClick={cadastrar}
            className="w-full bg-blue-900 text-white p-4 rounded-xl font-bold"
          >
            Cadastrar Usuário
          </button>

        </div>

      </div>

    </main>
  );
}