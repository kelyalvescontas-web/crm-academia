"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MdLockOutline,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
  MdOutlinePersonOutline,
  MdShield,
  MdTrendingUp,
  MdGroups,
  MdChecklist,
} from "react-icons/md";
import { FaBullseye } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarAcesso, setLembrarAcesso] = useState(true);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      alert("Digite seu usuário e senha.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao fazer login");
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(data));

      if (data.unidadeId) {
        localStorage.setItem("unidadeSelecionadaId", String(data.unidadeId));
      }

      if (lembrarAcesso) {
        localStorage.setItem("lembrarAcesso", "SIM");
      } else {
        localStorage.removeItem("lembrarAcesso");
      }

      const cargoUsuario = String(data.cargo || "").toUpperCase();

      if (cargoUsuario === "NUTRICIONISTA") {
        router.push("/agenda-nutricionista");
      } else if (cargoUsuario === "INSTRUTOR") {
        router.push("/calendario");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao fazer login");
    } finally {
      setCarregando(false);
    }
  }

  function aoPressionarEnter(event: any) {
    if (event.key === "Enter") entrar();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#061329] via-[#030712] to-[#130508]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(37,99,235,0.22),transparent_33%),radial-gradient(circle_at_88%_30%,rgba(220,38,38,0.17),transparent_31%),radial-gradient(circle_at_45%_88%,rgba(245,158,11,0.10),transparent_28%)]" />
      <div className="absolute left-0 top-0 h-full w-[48%] bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_28%,transparent_100%)]" />

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden lg:flex items-center justify-center px-10 xl:px-16 py-10">
          <div className="w-full max-w-[720px] flex flex-col items-center text-center">
            <div className="relative w-full flex justify-center mb-10">
              <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-3xl" />
              <img
                src="/kedial-performance-logo-clean.png"
                alt="KeDiAl Performance"
                className="relative w-[620px] max-w-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.22)]"
              />
            </div>

            <div className="max-w-[620px]">
              <h1 className="text-[42px] xl:text-[46px] font-extrabold leading-tight tracking-tight">
                Gestão comercial para academias
              </h1>

              <p className="mt-5 text-[19px] text-slate-300 leading-relaxed">
                Mais organização, mais controle, mais resultados para o seu time.
              </p>
            </div>

            <div className="w-full max-w-[650px] grid grid-cols-4 gap-0 mt-14 rounded-3xl bg-white/[0.025] border border-white/10 overflow-hidden">
              <Recurso
                icone={<FaBullseye />}
                titulo="Metas"
                texto="Acompanhe metas diárias e mensais."
                cor="text-red-400"
              />

              <Recurso
                icone={<MdTrendingUp />}
                titulo="Resultados"
                texto="Ranking e indicadores em tempo real."
                cor="text-amber-300"
              />

              <Recurso
                icone={<MdChecklist />}
                titulo="Diárias"
                texto="Controle diárias, conversões e desempenho."
                cor="text-blue-300"
              />

              <Recurso
                icone={<MdGroups />}
                titulo="Equipe"
                texto="Gestão completa do time comercial."
                cor="text-slate-200"
              />
            </div>

            <div className="mt-10 w-full max-w-[610px] border border-white/10 rounded-2xl px-7 py-5 bg-white/[0.045] backdrop-blur-sm flex items-center gap-5 text-left shadow-[0_0_35px_rgba(0,0,0,0.22)]">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-400/10 border border-amber-300/30 flex items-center justify-center text-amber-300">
                <MdShield className="text-3xl" />
              </div>

              <p className="text-slate-300 text-lg leading-relaxed">
                Segurança e performance para impulsionar os resultados da sua academia.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 lg:px-10 py-10">
          <div className="w-full max-w-[660px]">
            <div className="lg:hidden flex justify-center mb-8">
              <img
                src="/kedial-performance-logo-clean.png"
                alt="KeDiAl Performance"
                className="w-[340px] max-w-full object-contain"
              />
            </div>

            <div className="relative rounded-[34px] border border-white/15 bg-black/35 backdrop-blur-xl shadow-[0_0_70px_rgba(0,0,0,0.55)] p-8 sm:p-12">
              <div className="absolute inset-0 rounded-[34px] pointer-events-none bg-[linear-gradient(135deg,rgba(59,130,246,0.32),transparent_25%,transparent_70%,rgba(220,38,38,0.32))] opacity-40" />

              <div className="relative z-10">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-bold mb-3">Bem-vindo(a)!</h2>
                  <p className="text-slate-300 text-lg">Acesse sua conta para continuar</p>

                  <div className="h-[2px] w-64 mx-auto mt-8 bg-gradient-to-r from-transparent via-blue-400 to-transparent relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-white to-red-500 blur-sm" />
                  </div>
                </div>

                <div className="space-y-7">
                  <div>
                    <label className="block mb-3 text-slate-100 font-medium">Usuário</label>

                    <div className="relative">
                      <MdOutlinePersonOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl text-slate-400" />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={aoPressionarEnter}
                        placeholder="Digite seu usuário"
                        className="w-full h-16 rounded-2xl bg-[#060b16]/80 border border-white/15 pl-16 pr-5 text-white placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-3 text-slate-100 font-medium">Senha</label>

                    <div className="relative">
                      <MdLockOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl text-slate-400" />

                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        onKeyDown={aoPressionarEnter}
                        placeholder="Digite sua senha"
                        className="w-full h-16 rounded-2xl bg-[#060b16]/80 border border-white/15 pl-16 pr-16 text-white placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition"
                      />

                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                      >
                        {mostrarSenha ? <MdOutlineVisibilityOff className="text-3xl" /> : <MdOutlineVisibility className="text-3xl" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm sm:text-base">
                    <label className="flex items-center gap-3 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={lembrarAcesso}
                        onChange={(e) => setLembrarAcesso(e.target.checked)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      Lembrar meu acesso
                    </label>

                    <button
                      type="button"
                      onClick={() => alert("Solicite a redefinição da senha ao administrador do sistema.")}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={entrar}
                    disabled={carregando}
                    className="w-full h-18 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-700 to-red-600 text-white text-2xl font-bold shadow-[0_0_35px_rgba(37,99,235,0.28)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition flex items-center justify-center gap-4"
                  >
                    {carregando ? "Entrando..." : "Entrar"}
                    {!carregando && <span className="text-4xl leading-none">→</span>}
                  </button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-center gap-3 text-slate-400">
                  <MdShield className="text-2xl text-amber-300" />
                  <span>Seus dados protegidos com segurança</span>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-500 mt-8">© 2026 Kedial Tecnologia. Todos os direitos reservados.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Recurso({ icone, titulo, texto, cor }: any) {
  return (
    <div className="px-4 py-7 border-r border-white/10 last:border-r-0 flex flex-col items-center justify-start text-center min-h-[160px]">
      <div className={`text-5xl mb-4 flex justify-center ${cor}`}>{icone}</div>
      <h3 className={`uppercase font-bold mb-3 text-sm tracking-wide ${cor}`}>{titulo}</h3>
      <p className="text-slate-300 text-xs leading-relaxed max-w-[120px]">{texto}</p>
    </div>
  );
}
