"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { MdArrowBack, MdDeleteOutline, MdDownload, MdOutlineWhatsapp, MdSave } from "react-icons/md";

type Documento = { nome: string; tipo: string; tamanho: number; dataUrl: string };

type Agendamento = {
  id: string;
  nome: string;
  telefone: string;
  matricula: string;
  unidade: string;
  dataConsulta: string;
  horaConsulta: string;
  tipoConsulta: string;
  statusPresenca: string;
  statusPagamento: string;
  quemAgendou: string;
  tipoAtendimento: string[];
  diasRetorno: string;
  dataRetorno: string;
  horaRetorno?: string;
  cardapioPronto: boolean;
  cardapioEnviado: boolean;
  bioPronta: boolean;
  bioEnviada: boolean;
  cardapioArquivo?: Documento | null;
  bioArquivo?: Documento | null;
  observacoes?: string;
  converteuPlanoPago?: boolean;
  planoConvertido?: string;
  dataConversao?: string;
  vendedoraConversao?: string;
  createdAt: string;
};

type ConfigAgenda = {
  horarios: string[];
  aviso: string;
  bloqueios: { id: string; data: string; tipo: string; motivo: string; horariosLiberados: string[] }[];
};

const STORAGE_AGENDAMENTOS = "prix_nutri_agendamentos";
const STORAGE_CONFIG = "prix_nutri_config";

const horariosPadrao = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "18:15", "18:45", "19:15", "19:45", "20:15", "20:45"];

const tiposConsulta = [
  "Free Consulta + Bioimpedância",
  "Plano Mensal",
  "Plano Trimestral",
  "Plano Semestral",
  "Plano Anual",
  "Particular Consulta + Bioimpedância",
];

const planosConvertidos = ["Anual", "Semestral", "Trimestral", "Mensal"];

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

function formatarDataBR(dataISO: string) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function somarDias(dataISO: string, dias: string) {
  if (!dataISO || !dias) return "";
  const qtd = Number(dias);
  if (Number.isNaN(qtd)) return "";
  const data = new Date(`${dataISO}T12:00:00`);
  data.setDate(data.getDate() + qtd);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function primeiroNome(nome: string) {
  const primeiro = nome.trim().split(" ")[0] || "Aluno";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

function criarLinkWhatsApp(telefone: string, mensagem: string) {
  const numero = telefone.replace(/\D/g, "");
  const numeroComPais = numero.startsWith("55") ? numero : `55${numero}`;
  return `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`;
}

function arquivoParaDocumento(file: File): Promise<Documento> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ nome: file.name, tipo: file.type, tamanho: file.size, dataUrl: String(reader.result) });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function baixarDocumento(doc?: Documento | null) {
  if (!doc?.dataUrl) return alert("Nenhum arquivo anexado para download.");
  const a = document.createElement("a");
  a.href = doc.dataUrl;
  a.download = doc.nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function horariosDaData(config: ConfigAgenda, data: string) {
  const horariosBase = config.horarios.length ? [...config.horarios].sort() : horariosPadrao;
  const bloqueio = config.bloqueios.find((b) => b.data === data);

  if (bloqueio?.tipo === "Feriado") return [];
  if (bloqueio?.tipo === "Horário especial") return [...bloqueio.horariosLiberados].sort();

  return horariosBase;
}

function horarioValido(config: ConfigAgenda, data: string, hora: string) {
  return horariosDaData(config, data).includes(hora);
}

export default function EditarAgendamentoNutricionistaPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [config, setConfig] = useState<ConfigAgenda>({
    horarios: horariosPadrao,
    aviso: "",
    bloqueios: [],
  });

  const [form, setForm] = useState<Agendamento>({
    id: crypto.randomUUID(),
    nome: "",
    telefone: "",
    matricula: "",
    unidade: "",
    dataConsulta: hojeISO(),
    horaConsulta: "",
    tipoConsulta: "",
    statusPresenca: "Aguardando confirmação",
    statusPagamento: "Free",
    quemAgendou: "",
    tipoAtendimento: ["Primeira Consulta"],
    diasRetorno: "30",
    dataRetorno: somarDias(hojeISO(), "30"),
    horaRetorno: "",
    cardapioPronto: false,
    cardapioEnviado: false,
    bioPronta: false,
    bioEnviada: false,
    cardapioArquivo: null,
    bioArquivo: null,
    observacoes: "",
    converteuPlanoPago: false,
    planoConvertido: "",
    dataConversao: "",
    vendedoraConversao: "",
    createdAt: new Date().toISOString(),
  });

  const horariosConsulta = useMemo(() => horariosDaData(config, form.dataConsulta), [config, form.dataConsulta]);
  const horariosRetorno = useMemo(() => horariosDaData(config, form.dataRetorno), [config, form.dataRetorno]);

  function atualizar(campo: keyof Agendamento, valor: any) {
    setForm((atual) => {
      const novo = { ...atual, [campo]: valor } as Agendamento;

      if (campo === "dataConsulta" || campo === "diasRetorno") {
        novo.dataRetorno = somarDias(campo === "dataConsulta" ? valor : atual.dataConsulta, campo === "diasRetorno" ? valor : atual.diasRetorno);
      }

      if (campo === "dataConsulta" && novo.horaConsulta && !horarioValido(config, valor, novo.horaConsulta)) {
        novo.horaConsulta = "";
      }

      if ((campo === "dataRetorno" || campo === "diasRetorno" || campo === "dataConsulta") && novo.horaRetorno && !horarioValido(config, novo.dataRetorno, novo.horaRetorno)) {
        novo.horaRetorno = "";
      }

      return novo;
    });
  }

  function alternarTipoAtendimento(tipo: string) {
    setForm((atual) => {
      const existe = atual.tipoAtendimento.includes(tipo);
      return { ...atual, tipoAtendimento: existe ? atual.tipoAtendimento.filter((t) => t !== tipo) : [...atual.tipoAtendimento, tipo] };
    });
  }

  async function anexarArquivo(campo: "cardapioArquivo" | "bioArquivo", file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("O arquivo deve ter no máximo 10MB.");
    const doc = await arquivoParaDocumento(file);
    atualizar(campo, doc);
  }

  useEffect(() => {
    carregarConfigAgenda();
    carregarAgendamento();
  }, [id]);

  async function carregarConfigAgenda() {
    try {
      const usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
      const unidadeSelecionada =
        usuarioLogado.cargo === "ADMIN_GERAL"
          ? localStorage.getItem("unidadeSelecionadaId")
          : String(usuarioLogado.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");

      const response = await fetch(
        `/api/agenda-nutricionista/configuracoes?unidadeId=${unidadeSelecionada}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!data?.error) {
        setConfig({
          horarios: data.horarios?.length ? data.horarios : horariosPadrao,
          aviso: data.aviso || "",
          bloqueios: Array.isArray(data.bloqueios) ? data.bloqueios : [],
        });
      }
    } catch (error) {
      console.log("Erro ao carregar configurações da nutricionista:", error);
    }
  }

  async function carregarAgendamento() {
    try {
      const response = await fetch(`/api/agenda-nutricionista?id=${id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Agendamento não encontrado.");
        router.push("/agenda-nutricionista");
        return;
      }

      setForm({
        ...data,
        id: String(data.id),
        dataRetorno: data.dataRetorno || somarDias(data.dataConsulta, data.diasRetorno || "30"),
        horaRetorno: data.horaRetorno || "",
      });
    } catch (error) {
      console.log(error);
      alert("Erro ao carregar agendamento.");
      router.push("/agenda-nutricionista");
    }
  }

  async function salvar() {
    if (!form.nome.trim()) return alert("Preencha o nome do aluno.");
    if (!form.telefone.trim()) return alert("Preencha o telefone.");
    if (!form.dataConsulta || !form.horaConsulta) {
      return alert("Preencha data e horário da consulta.");
    }

    if (!horarioValido(config, form.dataConsulta, form.horaConsulta)) {
      return alert(
        "Este horário não está cadastrado nas configurações da agenda para esta data. Selecione um horário permitido."
      );
    }

    if (
      form.dataRetorno &&
      form.horaRetorno &&
      !horarioValido(config, form.dataRetorno, form.horaRetorno)
    ) {
      return alert("O horário selecionado para retorno não está liberado nas configurações desta data.");
    }

    try {
      const usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
      const unidadeSelecionada =
        usuarioLogado.cargo === "ADMIN_GERAL"
          ? localStorage.getItem("unidadeSelecionadaId")
          : String(usuarioLogado.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");

      const response = await fetch("/api/agenda-nutricionista", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id,
          unidadeId: unidadeSelecionada ? Number(unidadeSelecionada) : null,
          usuarioId: usuarioLogado.id,
          usuarioNome: usuarioLogado.nome,
          usuarioCargo: usuarioLogado.cargo,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || "Erro ao editar agendamento");
        return;
      }

      if (form.dataRetorno && form.horaRetorno) {
        await fetch("/api/agenda-nutricionista", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            id: undefined,
            dataConsulta: form.dataRetorno,
            horaConsulta: form.horaRetorno,
            tipoAtendimento: ["Retorno"],
            tipoConsulta: "Retorno",
            observacoes: `Retorno automático de ${form.nome}. Consulta original: ${formatarDataBR(form.dataConsulta)} às ${form.horaConsulta}.`,
            converteuPlanoPago: false,
            planoConvertido: "",
            dataConversao: "",
            vendedoraConversao: "",
            unidadeId: unidadeSelecionada ? Number(unidadeSelecionada) : null,
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioCargo: usuarioLogado.cargo,
          }),
        });
      }

      router.push("/agenda-nutricionista");
    } catch (error) {
      console.log(error);
      alert("Erro ao editar agendamento");
    }
  }

 const dataFormatada = useMemo(() => formatarDataBR(form.dataConsulta), [form.dataConsulta]);
  const mensagemConfirmacao = `Olá, ${primeiroNome(form.nome)}! Tudo bem?\nPosso confirmar sua consulta com nossa nutricionista, dia *${dataFormatada}* às *${form.horaConsulta}hs*?\n\nLembrando que a *tolerância de atraso é 10 minutos*, caso não consiga comparecer pedimos que avise com no mínimo 3 horas de antecedência, caso contrário a consulta será dada como feita.\n\n*Não é recomendado fazer exercícios físicos antes da consulta!*`;
  const mensagemCardapio = `Olá, ${primeiroNome(form.nome)}! Tudo bem?\nEstou te enviando o seu *cardápio* referente à consulta realizada em *${dataFormatada}*.\n\nLembre-se: cada pequena escolha feita hoje é um passo em direção aos seus objetivos. Mantenha o foco, confie no processo e conte conosco nessa jornada de transformação!\n\nQualquer dúvida, estou à disposição para ajudar.\nAtenciosamente,\nAcademia Prix`;
  const mensagemBio = `Olá, ${primeiroNome(form.nome)}!\nSegue em anexo sua *Avaliação de Bioimpedância* referente ao atendimento do dia *${dataFormatada}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\nAcademia Prix`;
  const mensagemAmbos = `Olá, ${primeiroNome(form.nome)}! Tudo bem?\nSegue em anexo seu *cardápio* e sua *Avaliação de Bioimpedância* referentes ao atendimento do dia *${dataFormatada}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\nAcademia Prix`;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <main className="flex-1 p-6">
        <Header titulo="Editar Agendamento" subtitulo="Altere os dados da consulta selecionada" onSalvar={salvar} />
        <Formulario
          form={form}
          atualizar={atualizar}
          alternarTipoAtendimento={alternarTipoAtendimento}
          anexarArquivo={anexarArquivo}
          baixarDocumento={baixarDocumento}
          mensagemConfirmacao={mensagemConfirmacao}
          mensagemCardapio={mensagemCardapio}
          mensagemBio={mensagemBio}
          mensagemAmbos={mensagemAmbos}
          horariosConsulta={horariosConsulta}
          horariosRetorno={horariosRetorno}
        />
      </main>
    </div>
  );
}

function Header({ titulo, subtitulo, onSalvar }: { titulo: string; subtitulo: string; onSalvar: () => void }) {
  return (
    <>
      <header className="mb-6 rounded-2xl bg-slate-950 px-6 py-5 text-white shadow">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-sm text-slate-300">{subtitulo}</p>
      </header>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/agenda-nutricionista" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"><MdArrowBack /> Voltar para Agenda</Link>
        <div className="flex gap-3">
          <Link href="/agenda-nutricionista" className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-100">Cancelar</Link>
          <button onClick={onSalvar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><MdSave /> Salvar Agendamento</button>
        </div>
      </div>
    </>
  );
}

function Formulario(props: any) {
  const { form, atualizar, alternarTipoAtendimento, anexarArquivo, baixarDocumento, mensagemConfirmacao, mensagemCardapio, mensagemBio, mensagemAmbos, horariosConsulta, horariosRetorno } = props;
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        <Card title="Dados do Cliente">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome"><input value={form.nome} onChange={(e) => atualizar("nome", e.target.value.toUpperCase())} placeholder="NOME COMPLETO EM CAIXA ALTA" className="input" /></Field>
            <Field label="Telefone"><input value={form.telefone} onChange={(e) => atualizar("telefone", e.target.value)} placeholder="(00) 00000-0000" className="input" /></Field>
            <Field label="Matrícula"><input value={form.matricula} onChange={(e) => atualizar("matricula", e.target.value)} placeholder="Ex.: 5001" className="input" /></Field>
            <Field label="Unidade"><select value={form.unidade} onChange={(e) => atualizar("unidade", e.target.value)} className="input"><option value="">Selecione</option><option>Matriz</option><option>CT Prix</option><option>Prix Estação</option></select></Field>
          </div>
        </Card>

        <Card title="Dados da Consulta">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Data"><input type="date" value={form.dataConsulta} onChange={(e) => atualizar("dataConsulta", e.target.value)} className="input" /></Field>
            <Field label="Hora">
              <select value={form.horaConsulta} onChange={(e) => atualizar("horaConsulta", e.target.value)} className="input">
                <option value="">Selecione</option>
                {horariosConsulta.map((h: string) => <option key={h} value={h}>{h}</option>)}
              </select>
              {horariosConsulta.length === 0 && <p className="mt-1 text-xs font-semibold text-red-600">Nenhum horário liberado nesta data.</p>}
            </Field>
            <Field label="Tipo"><select value={form.tipoConsulta} onChange={(e) => atualizar("tipoConsulta", e.target.value)} className="input"><option value="">Selecione</option>{tiposConsulta.map((tipo) => <option key={tipo}>{tipo}</option>)}</select></Field>
          </div>
          {form.tipoConsulta.includes("Particular") && (
            <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-bold text-purple-700">Status do pagamento particular</p>
              <div className="mt-4 flex flex-wrap gap-6 text-sm font-semibold">
                <label className="flex items-center gap-2"><input type="radio" checked={form.statusPagamento === "Pago"} onChange={() => atualizar("statusPagamento", "Pago")} /> Já acertou o pagamento</label>
                <label className="flex items-center gap-2"><input type="radio" checked={form.statusPagamento === "Vai acertar na consulta"} onChange={() => atualizar("statusPagamento", "Vai acertar na consulta")} /> Irá pagar no dia da consulta</label>
              </div>
            </div>
          )}
        </Card>

        <Card title="Retorno / Acompanhamento">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Tipo de Atendimento</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {["Primeira Consulta", "Retorno", "Acompanhamento Mensal"].map((tipo) => (
                  <button key={tipo} type="button" onClick={() => alternarTipoAtendimento(tipo)} className={form.tipoAtendimento.includes(tipo) ? "rounded-lg border border-green-300 bg-green-50 px-4 py-2 font-bold text-green-700" : "rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold"}>{tipo}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Dias para retorno"><input value={form.diasRetorno} onChange={(e) => atualizar("diasRetorno", e.target.value)} className="input" /></Field>
              <Field label="Data de retorno"><input type="date" value={form.dataRetorno} onChange={(e) => atualizar("dataRetorno", e.target.value)} className="input" /><p className="mt-1 text-xs text-slate-500">{formatarDataBR(form.dataRetorno)}</p></Field>
              <Field label="Horário do retorno">
                <select value={form.horaRetorno || ""} onChange={(e) => atualizar("horaRetorno", e.target.value)} className="input">
                  <option value="">Não agendar</option>
                  {horariosRetorno.map((h: string) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Ao selecionar data e horário de retorno, o sistema cria/atualiza automaticamente o agendamento de retorno.</p>
        </Card>

        <Card title="Observações"><textarea value={form.observacoes || ""} onChange={(e) => atualizar("observacoes", e.target.value)} placeholder="Digite aqui alguma observação importante sobre o agendamento..." className="input min-h-[110px]" /></Card>
      </div>

      <div className="space-y-5">
        <Card title="Status e Informações">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status de Presença"><select value={form.statusPresenca} onChange={(e) => atualizar("statusPresenca", e.target.value)} className="input"><option>Aguardando confirmação</option><option>Confirmado</option><option>Cancelou</option><option>Faltou</option></select></Field>
            <Field label="Status de Pagamento"><select value={form.statusPagamento} onChange={(e) => atualizar("statusPagamento", e.target.value)} className="input"><option>Free</option><option>Vai acertar na consulta</option><option>Pago</option></select></Field>
          </div>
          <div className="mt-4"><Field label="Quem Agendou"><input value={form.quemAgendou} onChange={(e) => atualizar("quemAgendou", e.target.value)} placeholder="Nome da atendente" className="input" /></Field></div>
        </Card>

        <Card title="Conversão em Plano Pago">
          <div className="mb-4 flex gap-3">
            <button type="button" onClick={() => atualizar("converteuPlanoPago", true)} className={form.converteuPlanoPago ? "rounded-lg border border-green-300 bg-green-50 px-4 py-2 font-bold text-green-700" : "rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold"}>Converteu</button>
            <button type="button" onClick={() => atualizar("converteuPlanoPago", false)} className={!form.converteuPlanoPago ? "rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-700" : "rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold"}>Não converteu</button>
          </div>
          {form.converteuPlanoPago && (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tipo do plano"><select value={form.planoConvertido || ""} onChange={(e) => atualizar("planoConvertido", e.target.value)} className="input"><option value="">Selecione</option>{planosConvertidos.map((p) => <option key={p}>{p}</option>)}</select></Field>
              <Field label="Data da conversão"><input type="date" value={form.dataConversao || ""} onChange={(e) => atualizar("dataConversao", e.target.value)} className="input" /></Field>
              <Field label="Vendedora"><input value={form.vendedoraConversao || ""} onChange={(e) => atualizar("vendedoraConversao", e.target.value)} placeholder="Nome da vendedora" className="input" /></Field>
            </div>
          )}
        </Card>

        <Card title="Acompanhamento e Documentos">
          <div className="grid gap-4 md:grid-cols-4">
            <Toggle label="Cardápio Pronto?" ativo={form.cardapioPronto} onChange={(v: boolean) => atualizar("cardapioPronto", v)} />
            <Toggle label="Cardápio Enviado?" ativo={form.cardapioEnviado} onChange={(v: boolean) => atualizar("cardapioEnviado", v)} />
            <Toggle label="Bioimpedância Pronta?" ativo={form.bioPronta} onChange={(v: boolean) => atualizar("bioPronta", v)} />
            <Toggle label="Bioimpedância Enviada?" ativo={form.bioEnviada} onChange={(v: boolean) => atualizar("bioEnviada", v)} />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <DocumentoCard titulo="Cardápio" doc={form.cardapioArquivo} onUpload={(file) => anexarArquivo("cardapioArquivo", file)} onDownload={() => baixarDocumento(form.cardapioArquivo)} onDelete={() => atualizar("cardapioArquivo", null)} />
            <DocumentoCard titulo="Avaliação de Bioimpedância" doc={form.bioArquivo} onUpload={(file) => anexarArquivo("bioArquivo", file)} onDownload={() => baixarDocumento(form.bioArquivo)} onDelete={() => atualizar("bioArquivo", null)} />
          </div>
        </Card>

        <Card title="Ações rápidas WhatsApp">
          <div className="grid gap-3 md:grid-cols-2">
            <a href={criarLinkWhatsApp(form.telefone, mensagemConfirmacao)} target="_blank" className="whats"><MdOutlineWhatsapp /> Confirmar Presença</a>
            <a href={criarLinkWhatsApp(form.telefone, mensagemCardapio)} target="_blank" className="whats"><MdOutlineWhatsapp /> Enviar Cardápio</a>
            <a href={criarLinkWhatsApp(form.telefone, mensagemBio)} target="_blank" className="whats"><MdOutlineWhatsapp /> Enviar Bioimpedância</a>
            <a href={criarLinkWhatsApp(form.telefone, mensagemAmbos)} target="_blank" className="whats"><MdOutlineWhatsapp /> Cardápio + Bioimpedância</a>
          </div>
        </Card>
      </div>
      <style jsx global>{`.input{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;background:white;padding:.75rem 1rem;font-size:.875rem;outline:none}.input:focus{border-color:#2563eb}.whats{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:.5rem;border:1px solid #86efac;background:white;padding:.85rem 1rem;font-size:.875rem;font-weight:700;color:#15803d}.whats:hover{background:#f0fdf4}`}</style>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-5 text-sm font-bold uppercase text-slate-900">{title}</h2>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function Toggle({ label, ativo, onChange }: { label: string; ativo: boolean; onChange: (v: boolean) => void }) { return <div><p className="mb-2 text-sm font-semibold text-slate-700">{label}</p><div className="flex gap-2"><button type="button" onClick={() => onChange(true)} className={ativo ? "rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-bold text-green-700" : "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold"}>Sim</button><button type="button" onClick={() => onChange(false)} className={!ativo ? "rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700" : "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold"}>Não</button></div></div>; }
function DocumentoCard({ titulo, doc, onUpload, onDownload, onDelete }: { titulo: string; doc?: Documento | null; onUpload: (file?: File) => void; onDownload: () => void; onDelete: () => void }) { return <div><p className="mb-2 text-sm font-semibold text-slate-700">{titulo} (PDF ou Imagem)</p>{doc && <div className="mb-3 rounded-xl border border-green-200 bg-green-50 p-4"><p className="truncate text-sm font-bold text-green-800">{doc.nome}</p><p className="text-xs text-slate-500">{(doc.tamanho / 1024 / 1024).toFixed(1)} MB</p><div className="mt-3 flex gap-2"><button type="button" onClick={onDownload} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-bold text-green-700"><MdDownload /> Download</button><button type="button" onClick={onDelete} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-600"><MdDeleteOutline /></button></div></div>}<label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"><input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />Clique para escolher ou arraste o arquivo<br /><span className="text-xs">PDF, JPG, PNG até 10MB</span></label></div>; }
