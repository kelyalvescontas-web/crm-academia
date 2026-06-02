import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function calcularDataFinal(dataInicio: string, quantidadeDias: number) {
  if (!dataInicio) return "";

  const data = new Date(dataInicio + "T00:00:00");
  data.setDate(data.getDate() + quantidadeDias - 1);

  return data.toISOString().split("T")[0];
}

function calcularStatus(dataFinal: string) {
  if (!dataFinal) return "ATIVA";

  const hoje = new Date().toISOString().split("T")[0];

  return dataFinal >= hoje ? "ATIVA" : "FINALIZADA";
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

  const diarias = await prisma.diaria.findMany({
    where: { unidadeId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(diarias);
}

export async function POST(req: Request) {
  const body = await req.json();

  const unidadeId = getUnidadeId(req, body);
  const usuario = dadosUsuario(body);

  if (!unidadeId) {
    return Response.json(
      { error: "Unidade não informada" },
      { status: 400 }
    );
  }

  const quantidadeDias = Number(body.quantidadeDias || 1);
  const dataFinal = calcularDataFinal(body.dataInicio, quantidadeDias);
  const status = body.status || calcularStatus(dataFinal);

  const diaria = await prisma.diaria.create({
    data: {
      nome: body.nome || "",
      telefone: body.telefone || "",
      cpf: body.cpf || "",
      dataInicio: body.dataInicio || "",
      dataFinal,
      quantidadeDias,
      colaboradora: body.colaboradora || "",
      observacoes: body.observacoes || "",

      status,
      tipoDiaria: body.tipoDiaria || "PAGA",

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
    tela: "DIARIAS",
    registroId: diaria.id,
    registroNome: diaria.nome,
    unidadeId,
    dadosAntes: null,
    dadosDepois: diaria,
  });

  return Response.json(diaria);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const unidadeId = getUnidadeId(req, body);
  const usuario = dadosUsuario(body);

  const diariaAntes = await prisma.diaria.findUnique({
    where: {
      id: Number(body.id),
    },
  });

  const quantidadeDias = Number(body.quantidadeDias || 1);
  const dataFinal = calcularDataFinal(body.dataInicio, quantidadeDias);
  const status = body.status || calcularStatus(dataFinal);

  const diaria = await prisma.diaria.update({
    where: { id: Number(body.id) },
    data: {
      nome: body.nome || "",
      telefone: body.telefone || "",
      cpf: body.cpf || "",
      dataInicio: body.dataInicio || "",
      dataFinal,
      quantidadeDias,
      colaboradora: body.colaboradora || "",
      observacoes: body.observacoes || "",

      status,
      tipoDiaria: body.tipoDiaria || "PAGA",

      alteradoPorId: usuario.usuarioId,
      alteradoPorNome: usuario.usuarioNome,
      atualizadoEm: new Date(),

      unidadeId,
    },
  });

  await registrarHistorico({
    body,
    acao: "EDITOU",
    tela: "DIARIAS",
    registroId: diaria.id,
    registroNome: diaria.nome,
    unidadeId,
    dadosAntes: diariaAntes,
    dadosDepois: diaria,
  });

  return Response.json(diaria);
}

export async function DELETE(req: Request) {
  const body = await req.json();

  const diariaAntes = await prisma.diaria.findUnique({
    where: {
      id: Number(body.id),
    },
  });

  await prisma.diaria.delete({
    where: {
      id: Number(body.id),
    },
  });

  await registrarHistorico({
    body,
    acao: "EXCLUIU",
    tela: "DIARIAS",
    registroId: Number(body.id),
    registroNome: diariaAntes?.nome || "",
    unidadeId: diariaAntes?.unidadeId || null,
    dadosAntes: diariaAntes,
    dadosDepois: null,
  });

  return Response.json({ ok: true });
}