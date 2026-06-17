import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizarCargo(cargo: any) {
  return String(cargo || "").toUpperCase().trim().replace(/\s+/g, "_");
}

function dadosUsuario(body: any) {
  return {
    usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
    usuarioNome: body.usuarioNome || "NÃO IDENTIFICADO",
    usuarioCargo: body.usuarioCargo || "",
  };
}

function tipoAtendimentoParaFlags(tipoAtendimento: any) {
  const lista = Array.isArray(tipoAtendimento) ? tipoAtendimento : [];
  const texto = lista.join(" ").toUpperCase();

  return {
    primeiraConsulta: texto.includes("PRIMEIRA"),
    retorno: texto.includes("RETORNO"),
    acompanhamentoMensal: texto.includes("ACOMPANHAMENTO"),
  };
}

function flagsParaTipoAtendimento(a: any) {
  const lista: string[] = [];

  if (a.primeiraConsulta) lista.push("Primeira Consulta");
  if (a.retorno) lista.push("Retorno");
  if (a.acompanhamentoMensal) lista.push("Acompanhamento Mensal");

  return lista.length ? lista : ["Primeira Consulta"];
}

function documento(nome?: string | null, dataUrl?: string | null) {
  if (!nome && !dataUrl) return null;

  return {
    nome: nome || "documento",
    tipo: "",
    tamanho: 0,
    dataUrl: dataUrl || "",
  };
}

function converterParaTela(a: any) {
  return {
    id: String(a.id),
    nome: a.nomeAluno || "",
    telefone: a.telefone || "",
    matricula: a.matricula || "",
    unidade: a.unidade?.nome || "",
    unidadeId: a.unidadeId || null,

    dataConsulta: a.dataConsulta || "",
    horaConsulta: a.horaConsulta || "",

    tipoConsulta: a.tipoConsulta || "",
    statusPresenca: a.statusPresenca || "Aguardando confirmação",
    statusPagamento: a.statusPagamento || "Free",
    quemAgendou: a.criadoPorNome || "",

    tipoAtendimento: flagsParaTipoAtendimento(a),

    diasRetorno: a.diasParaRetorno ? String(a.diasParaRetorno) : "30",
    dataRetorno: a.dataRetorno || "",
    horaRetorno: a.horaRetorno || "",

    cardapioPronto: Boolean(a.cardapioPronto),
    cardapioEnviado: Boolean(a.cardapioEnviado),
    bioPronta: Boolean(a.bioimpedanciaPronta),
    bioEnviada: Boolean(a.bioimpedanciaEnviada),

    cardapioArquivo: documento(a.cardapioNome, a.cardapioUrl),
    bioArquivo: documento(a.bioimpedanciaNome, a.bioimpedanciaUrl),

    observacoes: a.observacoes || "",

    converteuPlanoPago: Boolean(a.converteuPlanoPago),
    planoConvertido: a.planoConvertido || "",
    dataConversao: a.dataConversao || "",
    vendedoraConversao: a.vendedoraConversao || "",

    createdAt: a.createdAt?.toISOString?.() || String(a.createdAt || ""),
  };
}

function dadosAgendamento(body: any) {
  const usuario = dadosUsuario(body);
  const flags = tipoAtendimentoParaFlags(body.tipoAtendimento);

  return {
    nomeAluno: body.nome || body.nomeAluno || "",
    telefone: body.telefone || "",
    matricula: body.matricula || "",

    dataConsulta: body.dataConsulta || "",
    horaConsulta: body.horaConsulta || "",

    tipoConsulta: body.tipoConsulta || "",
    observacoes: body.observacoes || "",

    statusPresenca: body.statusPresenca || "Aguardando confirmação",
    statusPagamento: body.statusPagamento || "Free",

    primeiraConsulta: flags.primeiraConsulta,
    retorno: flags.retorno,
    acompanhamentoMensal: flags.acompanhamentoMensal,

    diasParaRetorno: body.diasRetorno ? Number(body.diasRetorno) : null,
    dataRetorno: body.dataRetorno || "",
    horaRetorno: body.horaRetorno || "",

    cardapioPronto: Boolean(body.cardapioPronto),
    cardapioEnviado: Boolean(body.cardapioEnviado),
    cardapioUrl: body.cardapioArquivo?.dataUrl || body.cardapioUrl || "",
    cardapioNome: body.cardapioArquivo?.nome || body.cardapioNome || "",

    bioimpedanciaPronta: Boolean(body.bioPronta || body.bioimpedanciaPronta),
    bioimpedanciaEnviada: Boolean(body.bioEnviada || body.bioimpedanciaEnviada),
    bioimpedanciaUrl: body.bioArquivo?.dataUrl || body.bioimpedanciaUrl || "",
    bioimpedanciaNome: body.bioArquivo?.nome || body.bioimpedanciaNome || "",

    converteuPlanoPago: Boolean(body.converteuPlanoPago),
    planoConvertido: body.planoConvertido || "",
    vendedoraConversao: body.vendedoraConversao || "",
    dataConversao: body.dataConversao || "",

    unidadeId: body.unidadeId ? Number(body.unidadeId) : null,

    criadoPorId: usuario.usuarioId,
    criadoPorNome: usuario.usuarioNome,
  };
}

async function garantirColunaHoraRetorno() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AgendaNutricionista"
    ADD COLUMN IF NOT EXISTS "horaRetorno" TEXT
  `);
}

export async function GET(req: Request) {
  try {
    await garantirColunaHoraRetorno();

    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const data = searchParams.get("data");
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    if (id) {
      const agendamento = await prisma.agendaNutricionista.findUnique({
        where: { id: Number(id) },
        include: { unidade: true },
      });

      if (!agendamento) {
        return Response.json({ error: "Agendamento não encontrado" }, { status: 404 });
      }

      return Response.json(converterParaTela(agendamento));
    }

    const where: any = {};

    if (data) {
      where.dataConsulta = data;
    } else if (inicio || fim) {
      where.dataConsulta = {};
      if (inicio) where.dataConsulta.gte = inicio;
      if (fim) where.dataConsulta.lte = fim;
    }

    const agendamentos = await prisma.agendaNutricionista.findMany({
      where,
      include: { unidade: true },
      orderBy: [{ dataConsulta: "asc" }, { horaConsulta: "asc" }, { createdAt: "desc" }],
    });

    return Response.json(agendamentos.map(converterParaTela));
  } catch (error) {
    console.log("ERRO GET AGENDA NUTRICIONISTA:", error);
    return Response.json({ error: "Erro ao buscar agenda nutricionista" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirColunaHoraRetorno();

    const body = await req.json();
    const data = dadosAgendamento(body);

    if (!data.nomeAluno || !data.telefone || !data.dataConsulta || !data.horaConsulta) {
      return Response.json({ error: "Preencha nome, telefone, data e horário" }, { status: 400 });
    }

    const duplicado = await prisma.agendaNutricionista.findFirst({
      where: {
        dataConsulta: data.dataConsulta,
        horaConsulta: data.horaConsulta,
      },
    });

    if (duplicado) {
      return Response.json({ error: "Já existe uma consulta agendada neste horário" }, { status: 400 });
    }

    const agendamento = await prisma.agendaNutricionista.create({
      data,
      include: { unidade: true },
    });

    return Response.json(converterParaTela(agendamento));
  } catch (error) {
    console.log("ERRO POST AGENDA NUTRICIONISTA:", error);
    return Response.json({ error: "Erro ao salvar agendamento" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await garantirColunaHoraRetorno();

    const body = await req.json();
    const id = Number(body.id);

    if (!id) {
      return Response.json({ error: "Agendamento não informado" }, { status: 400 });
    }

    const usuario = dadosUsuario(body);
    const data = {
      ...dadosAgendamento(body),
      alteradoPorId: usuario.usuarioId,
      alteradoPorNome: usuario.usuarioNome,
      atualizadoEm: new Date(),
    };

    const duplicado = await prisma.agendaNutricionista.findFirst({
      where: {
        id: { not: id },
        dataConsulta: data.dataConsulta,
        horaConsulta: data.horaConsulta,
      },
    });

    if (duplicado) {
      return Response.json({ error: "Já existe uma consulta agendada neste horário" }, { status: 400 });
    }

    const agendamento = await prisma.agendaNutricionista.update({
      where: { id },
      data,
      include: { unidade: true },
    });

    return Response.json(converterParaTela(agendamento));
  } catch (error) {
    console.log("ERRO PUT AGENDA NUTRICIONISTA:", error);
    return Response.json({ error: "Erro ao editar agendamento" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!id) {
      return Response.json({ error: "Agendamento não informado" }, { status: 400 });
    }

    await prisma.agendaNutricionista.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log("ERRO DELETE AGENDA NUTRICIONISTA:", error);
    return Response.json({ error: "Erro ao excluir agendamento" }, { status: 500 });
  }
}
