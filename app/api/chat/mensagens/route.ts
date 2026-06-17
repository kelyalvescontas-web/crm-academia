import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function garantirTabelas() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ChatMensagem" (
      "id" SERIAL PRIMARY KEY,
      "remetenteId" INTEGER NOT NULL,
      "remetenteNome" TEXT NOT NULL,
      "remetenteFoto" TEXT,
      "destinatarioId" INTEGER,
      "destinatarioNome" TEXT,
      "grupo" BOOLEAN NOT NULL DEFAULT false,
      "grupoNome" TEXT,
      "mensagem" TEXT NOT NULL,
      "lida" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET(req: Request) {
  try {
    await garantirTabelas();

    const { searchParams } = new URL(req.url);
    const usuarioId = Number(searchParams.get("usuarioId") || 0);
    const outroUsuarioId = Number(searchParams.get("outroUsuarioId") || 0);
    const grupo = searchParams.get("grupo") === "true";

    if (!usuarioId) {
      return Response.json([]);
    }

    let where: any;

    if (grupo) {
      where = { grupo: true };
    } else if (outroUsuarioId) {
      where = {
        grupo: false,
        OR: [
          { remetenteId: usuarioId, destinatarioId: outroUsuarioId },
          { remetenteId: outroUsuarioId, destinatarioId: usuarioId },
        ],
      };
    } else {
      where = {
        grupo: false,
        OR: [{ remetenteId: usuarioId }, { destinatarioId: usuarioId }],
      };
    }

    const mensagens = await prisma.chatMensagem.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 120,
    });

    return Response.json(mensagens);
  } catch (error) {
    console.log("ERRO GET CHAT:", error);
    return Response.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelas();

    const body = await req.json();

    const remetenteId = Number(body.remetenteId || body.usuarioId);
    const destinatarioId = body.destinatarioId ? Number(body.destinatarioId) : null;
    const grupo = Boolean(body.grupo);

    if (!remetenteId || !body.mensagem) {
      return Response.json({ error: "Mensagem inválida" }, { status: 400 });
    }

    const mensagem = await prisma.chatMensagem.create({
      data: {
        remetenteId,
        remetenteNome: body.remetenteNome || body.usuarioNome || "Usuário",
        remetenteFoto: body.remetenteFoto || "",
        destinatarioId,
        destinatarioNome: body.destinatarioNome || "",
        grupo,
        grupoNome: grupo ? body.grupoNome || "Grupo Geral" : "",
        mensagem: String(body.mensagem || "").trim(),
      },
    });

    return Response.json(mensagem);
  } catch (error) {
    console.log("ERRO POST CHAT:", error);
    return Response.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
