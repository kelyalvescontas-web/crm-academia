import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function garantirTabelas() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UsuarioOnline" (
      "id" SERIAL PRIMARY KEY,
      "usuarioId" INTEGER NOT NULL UNIQUE,
      "usuarioNome" TEXT NOT NULL,
      "usuarioCargo" TEXT,
      "fotoUrl" TEXT,
      "unidadeId" INTEGER,
      "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET() {
  try {
    await garantirTabelas();

    const limite = new Date(Date.now() - 2 * 60 * 1000);

    const usuarios = await prisma.usuarioOnline.findMany({
      where: {
        lastSeen: {
          gte: limite,
        },
      },
      orderBy: {
        usuarioNome: "asc",
      },
    });

    return Response.json(usuarios);
  } catch (error) {
    console.log("ERRO GET USUÁRIOS ONLINE:", error);
    return Response.json({ error: "Erro ao buscar usuários online" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelas();

    const body = await req.json();

    const usuarioId = Number(body.usuarioId || body.id);
    const usuarioNome = body.usuarioNome || body.nome || "Usuário";

    if (!usuarioId) {
      return Response.json({ error: "Usuário não informado" }, { status: 400 });
    }

    const online = await prisma.usuarioOnline.upsert({
      where: { usuarioId },
      update: {
        usuarioNome,
        usuarioCargo: body.usuarioCargo || body.cargo || "",
        fotoUrl: body.fotoUrl || "",
        unidadeId: body.unidadeId ? Number(body.unidadeId) : null,
        lastSeen: new Date(),
      },
      create: {
        usuarioId,
        usuarioNome,
        usuarioCargo: body.usuarioCargo || body.cargo || "",
        fotoUrl: body.fotoUrl || "",
        unidadeId: body.unidadeId ? Number(body.unidadeId) : null,
        lastSeen: new Date(),
      },
    });

    return Response.json(online);
  } catch (error) {
    console.log("ERRO POST USUÁRIO ONLINE:", error);
    return Response.json({ error: "Erro ao atualizar usuário online" }, { status: 500 });
  }
}
