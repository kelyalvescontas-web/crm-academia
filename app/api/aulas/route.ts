import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function dadosUsuario(req: Request, body: any = {}) {
  return {
    usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
    usuarioNome:
      body.usuarioNome ||
      req.headers.get("x-usuario-nome") ||
      "NÃO IDENTIFICADO",
    usuarioCargo:
      body.usuarioCargo ||
      req.headers.get("x-usuario-cargo") ||
      "",
  };
}

async function registrarHistorico({
  req,
  body,
  acao,
  tela,
  registroId,
  registroNome,
  unidadeId,
  dadosAntes,
  dadosDepois,
}: any) {
  const usuario = dadosUsuario(req, body);

  await prisma.historico.create({
    data: {
      usuarioId: usuario.usuarioId,
      usuarioNome: usuario.usuarioNome,
      usuarioCargo: usuario.usuarioCargo,
      acao,
      tela,
      registroId,
      registroNome,
      descricao: `${acao} em ${tela}: ${registroNome || ""}`,
      dadosAntes: dadosAntes ? JSON.stringify(dadosAntes) : "",
      dadosDepois: dadosDepois ? JSON.stringify(dadosDepois) : "",
      unidadeId,
    },
  });
}

function hojeBrasilISO() {
  const agora = new Date();

  const dataBrasil = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);

  return dataBrasil;
}

async function marcarFaltasAutomaticas(unidadeId: number | null) {
  const hoje = hojeBrasilISO();

  await prisma.aula.updateMany({
    where: {
      ...(unidadeId ? { unidadeId } : {}),
      data: {
        lt: hoje,
      },
      OR: [{ status: "AGENDADA" }, { status: "AGENDADO" }, { status: "" }],
    },
    data: {
      status: "FALTOU",
      faltou: true,
      veio: false,
      remarcou: false,
      cancelou: false,
      atualizadoEm: new Date(),
      alteradoPorNome: "SISTEMA AUTOMÁTICO",
    },
  });
}

export async function GET(req: Request) {
  try {
    const unidadeId = getUnidadeId(req);

    await marcarFaltasAutomaticas(unidadeId);

    const aulas = await prisma.aula.findMany({
      where: unidadeId ? { unidadeId } : {},
      orderBy: [{ data: "desc" }, { horario: "desc" }, { createdAt: "desc" }],
    });

    return Response.json(aulas);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao buscar aulas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);
    const usuario = dadosUsuario(req, body);

    if (!unidadeId) {
      return Response.json({ error: "Unidade não informada" }, { status: 400 });
    }

    const aula = await prisma.aula.create({
      data: {
        nomeAluno: body.nomeAluno,
        telefone: body.telefone,
        data: body.data,
        horario: body.horario,
        modalidade: body.modalidade,
        colaboradora: body.colaboradora,
        observacoes: body.observacoes || "",
        status: body.status || "AGENDADA",
        veio: Boolean(body.veio),
        faltou: Boolean(body.faltou),
        remarcou: Boolean(body.remarcou),
        cancelou: Boolean(body.cancelou),
        posAulaRealizado: Boolean(body.posAulaRealizado),
        vendaEfetivada: Boolean(body.vendaEfetivada),
        codigoMatricula: body.codigoMatricula || "",
        planoFechado: body.planoFechado || "",
        vendedora: body.vendedora || "",
        dataConversao: body.dataConversao || "",
        tipoAluno: body.tipoAluno || "NOVO",
        criadoPorId: usuario.usuarioId,
        criadoPorNome: usuario.usuarioNome,
        alteradoPorId: usuario.usuarioId,
        alteradoPorNome: usuario.usuarioNome,
        atualizadoEm: new Date(),
        unidadeId,
      },
    });

    await registrarHistorico({
      req,
      body,
      acao: "CRIOU",
      tela: "AULAS",
      registroId: aula.id,
      registroNome: aula.nomeAluno,
      unidadeId,
      dadosAntes: null,
      dadosDepois: aula,
    });

    return Response.json(aula);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao criar aula" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);
    const usuario = dadosUsuario(req, body);

    const aulaAntes = await prisma.aula.findUnique({
      where: { id: Number(body.id) },
    });

    const aula = await prisma.aula.update({
      where: { id: Number(body.id) },
      data: {
        nomeAluno: body.nomeAluno,
        telefone: body.telefone,
        data: body.data,
        horario: body.horario,
        modalidade: body.modalidade,
        colaboradora: body.colaboradora,
        observacoes: body.observacoes || "",
        status: body.status || "AGENDADA",
        veio: Boolean(body.veio),
        faltou: Boolean(body.faltou),
        remarcou: Boolean(body.remarcou),
        cancelou: Boolean(body.cancelou),
        posAulaRealizado: Boolean(body.posAulaRealizado),
        vendaEfetivada: Boolean(body.vendaEfetivada),
        codigoMatricula: body.codigoMatricula || "",
        planoFechado: body.planoFechado || "",
        vendedora: body.vendedora || "",
        dataConversao: body.dataConversao || "",
        tipoAluno: body.tipoAluno || "NOVO",
        alteradoPorId: usuario.usuarioId,
        alteradoPorNome: usuario.usuarioNome,
        atualizadoEm: new Date(),
        unidadeId,
      },
    });

    await registrarHistorico({
      req,
      body,
      acao: "EDITOU",
      tela: "AULAS",
      registroId: aula.id,
      registroNome: aula.nomeAluno,
      unidadeId,
      dadosAntes: aulaAntes,
      dadosDepois: aula,
    });

    return Response.json(aula);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao editar aula" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const aulaAntes = await prisma.aula.findUnique({
      where: { id: Number(body.id) },
    });

    await prisma.aula.delete({
      where: { id: Number(body.id) },
    });

    await registrarHistorico({
      req,
      body,
      acao: "EXCLUIU",
      tela: "AULAS",
      registroId: Number(body.id),
      registroNome: aulaAntes?.nomeAluno || "",
      unidadeId: aulaAntes?.unidadeId || null,
      dadosAntes: aulaAntes,
      dadosDepois: null,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao excluir aula" }, { status: 500 });
  }
}
