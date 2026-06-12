import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function dataLocalISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function calcularDataFinal(dataInicio: string, quantidadeDias: number) {
  if (!dataInicio) return "";

  const data = new Date(dataInicio + "T00:00:00");
  data.setDate(data.getDate() + quantidadeDias - 1);

  return dataLocalISO(data);
}

function calcularStatus(dataFinal: string) {
  if (!dataFinal) return "ATIVA";
  return dataFinal >= hojeISO() ? "ATIVA" : "FINALIZADA";
}

function dadosUsuario(body: any) {
  return {
    usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
    usuarioNome: body.usuarioNome || "NÃO IDENTIFICADO",
    usuarioCargo: body.usuarioCargo || "",
  };
}

async function garantirColunasConversaoDiarias() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Diaria"
    ADD COLUMN IF NOT EXISTS "converteuVenda" BOOLEAN NOT NULL DEFAULT false
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Diaria"
    ADD COLUMN IF NOT EXISTS "planoConvertido" TEXT
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Diaria"
    ADD COLUMN IF NOT EXISTS "vendedoraConversao" TEXT
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Diaria"
    ADD COLUMN IF NOT EXISTS "dataConversao" TEXT
  `);
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
  try {
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
  } catch (error) {
    console.log("Histórico não registrado:", error);
  }
}

export async function GET(req: Request) {
  try {
    await garantirColunasConversaoDiarias();

    const unidadeId = getUnidadeId(req);

    const diarias: any[] = unidadeId
      ? await prisma.$queryRaw`
          SELECT *
          FROM "Diaria"
          WHERE "unidadeId" = ${unidadeId}
          ORDER BY "dataInicio" DESC, "dataFinal" DESC, "createdAt" DESC
        `
      : await prisma.$queryRaw`
          SELECT *
          FROM "Diaria"
          ORDER BY "dataInicio" DESC, "dataFinal" DESC, "createdAt" DESC
        `;

    return Response.json(diarias);
  } catch (error: any) {
    console.log(error);
    return Response.json(
      { error: error?.message || "Erro ao carregar diárias" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await garantirColunasConversaoDiarias();

    const body = await req.json();

    const unidadeId = getUnidadeId(req, body);
    const usuario = dadosUsuario(body);

    if (!unidadeId) {
      return Response.json({ error: "Unidade não informada" }, { status: 400 });
    }

    const quantidadeDias = Number(body.quantidadeDias || 1);
    const dataFinal = calcularDataFinal(body.dataInicio, quantidadeDias);
    const status = body.status || calcularStatus(dataFinal);

    const nome = body.nome || "";
    const telefone = body.telefone || "";
    const cpf = body.cpf || "";
    const dataInicio = body.dataInicio || "";
    const colaboradora = body.colaboradora || "";
    const observacoes = body.observacoes || "";
    const tipoDiaria = body.tipoDiaria || "PAGA";

    const converteuVenda = Boolean(body.converteuVenda);
    const planoConvertido = converteuVenda ? body.planoConvertido || "" : "";
    const vendedoraConversao = converteuVenda ? body.vendedoraConversao || "" : "";
    const dataConversao = converteuVenda ? body.dataConversao || "" : "";

    const criada: any[] = await prisma.$queryRaw`
      INSERT INTO "Diaria" (
        "nome",
        "telefone",
        "cpf",
        "dataInicio",
        "dataFinal",
        "quantidadeDias",
        "observacoes",
        "colaboradora",
        "status",
        "tipoDiaria",
        "converteuVenda",
        "planoConvertido",
        "vendedoraConversao",
        "dataConversao",
        "criadoPorId",
        "criadoPorNome",
        "alteradoPorId",
        "alteradoPorNome",
        "atualizadoEm",
        "unidadeId",
        "createdAt"
      )
      VALUES (
        ${nome},
        ${telefone},
        ${cpf},
        ${dataInicio},
        ${dataFinal},
        ${quantidadeDias},
        ${observacoes},
        ${colaboradora},
        ${status},
        ${tipoDiaria},
        ${converteuVenda},
        ${planoConvertido},
        ${vendedoraConversao},
        ${dataConversao},
        ${usuario.usuarioId},
        ${usuario.usuarioNome},
        ${usuario.usuarioId},
        ${usuario.usuarioNome},
        NOW(),
        ${unidadeId},
        NOW()
      )
      RETURNING *
    `;

    const diaria = criada[0];

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
  } catch (error: any) {
    console.log(error);
    return Response.json(
      { error: error?.message || "Erro ao salvar diária" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await garantirColunasConversaoDiarias();

    const body = await req.json();

    const unidadeId = getUnidadeId(req, body);
    const usuario = dadosUsuario(body);
    const id = Number(body.id);

    if (!id) {
      return Response.json({ error: "ID da diária não informado" }, { status: 400 });
    }

    const diariaAntesLista: any[] = await prisma.$queryRaw`
      SELECT *
      FROM "Diaria"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    const diariaAntes = diariaAntesLista[0] || null;

    const quantidadeDias = Number(body.quantidadeDias || 1);
    const dataFinal = calcularDataFinal(body.dataInicio, quantidadeDias);
    const status = body.status || calcularStatus(dataFinal);

    const nome = body.nome || "";
    const telefone = body.telefone || "";
    const cpf = body.cpf || "";
    const dataInicio = body.dataInicio || "";
    const colaboradora = body.colaboradora || "";
    const observacoes = body.observacoes || "";
    const tipoDiaria = body.tipoDiaria || "PAGA";

    const converteuVenda = Boolean(body.converteuVenda);
    const planoConvertido = converteuVenda ? body.planoConvertido || "" : "";
    const vendedoraConversao = converteuVenda ? body.vendedoraConversao || "" : "";
    const dataConversao = converteuVenda ? body.dataConversao || "" : "";

    const atualizada: any[] = await prisma.$queryRaw`
      UPDATE "Diaria"
      SET
        "nome" = ${nome},
        "telefone" = ${telefone},
        "cpf" = ${cpf},
        "dataInicio" = ${dataInicio},
        "dataFinal" = ${dataFinal},
        "quantidadeDias" = ${quantidadeDias},
        "observacoes" = ${observacoes},
        "colaboradora" = ${colaboradora},
        "status" = ${status},
        "tipoDiaria" = ${tipoDiaria},
        "converteuVenda" = ${converteuVenda},
        "planoConvertido" = ${planoConvertido},
        "vendedoraConversao" = ${vendedoraConversao},
        "dataConversao" = ${dataConversao},
        "alteradoPorId" = ${usuario.usuarioId},
        "alteradoPorNome" = ${usuario.usuarioNome},
        "atualizadoEm" = NOW(),
        "unidadeId" = ${unidadeId}
      WHERE "id" = ${id}
      RETURNING *
    `;

    const diaria = atualizada[0];

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
  } catch (error: any) {
    console.log(error);
    return Response.json(
      { error: error?.message || "Erro ao editar diária" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await garantirColunasConversaoDiarias();

    const body = await req.json();
    const id = Number(body.id);

    const diariaAntesLista: any[] = await prisma.$queryRaw`
      SELECT *
      FROM "Diaria"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    const diariaAntes = diariaAntesLista[0] || null;

    await prisma.$executeRaw`
      DELETE FROM "Diaria"
      WHERE "id" = ${id}
    `;

    await registrarHistorico({
      body,
      acao: "EXCLUIU",
      tela: "DIARIAS",
      registroId: id,
      registroNome: diariaAntes?.nome || "",
      unidadeId: diariaAntes?.unidadeId || null,
      dadosAntes: diariaAntes,
      dadosDepois: null,
    });

    return Response.json({ ok: true });
  } catch (error: any) {
    console.log(error);
    return Response.json(
      { error: error?.message || "Erro ao excluir diária" },
      { status: 500 }
    );
  }
}
