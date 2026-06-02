import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function dadosUsuario(body: any) {
  return {
    usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
    usuarioNome: body.usuarioNome || "NÃO IDENTIFICADO",
    usuarioCargo: body.usuarioCargo || "",
  };
}

async function registrarHistorico({
  body,
  acao,
  tela,
  registroId,
  registroNome,
  unidadeId,
  dadosAntes,
  dadosDepois,
}: any) {
  const usuario = dadosUsuario(body);

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

export async function GET(req: Request) {
  const unidadeId = getUnidadeId(req);

  const aulas = await prisma.aula.findMany({
    where: { unidadeId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(aulas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const unidadeId = getUnidadeId(req, body);
  const usuario = dadosUsuario(body);

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
}

export async function PUT(req: Request) {
  const body = await req.json();
  const unidadeId = getUnidadeId(req, body);
  const usuario = dadosUsuario(body);

  const aulaAntes = await prisma.aula.findUnique({
    where: { id: Number(body.id) },
  });

  const aula = await prisma.aula.update({
    where: {
      id: Number(body.id),
    },
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
}

export async function DELETE(req: Request) {
  const body = await req.json();

  const aulaAntes = await prisma.aula.findUnique({
    where: {
      id: Number(body.id),
    },
  });

  await prisma.aula.delete({
    where: {
      id: Number(body.id),
    },
  });

  await registrarHistorico({
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
}