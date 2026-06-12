import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const usuarioId = Number(searchParams.get("usuarioId") || 0);

    if (!usuarioId) {
      return Response.json([]);
    }

    const limite24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await prisma.agendaPessoalNotificacao.deleteMany({
      where: {
        usuarioId,
        lida: true,
        createdAt: { lt: limite24h },
      },
    });

    const notificacoes = await prisma.agendaPessoalNotificacao.findMany({
      where: { usuarioId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return Response.json(notificacoes);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao buscar notificações" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const notificacao = await prisma.agendaPessoalNotificacao.create({
      data: {
        usuarioId: Number(body.usuarioId),
        titulo: body.titulo || "Notificação",
        mensagem: body.mensagem || "",
        agendaId: body.agendaId ? Number(body.agendaId) : null,
        lida: false,
      },
    });

    return Response.json(notificacao);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao criar notificação" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const notificacao = await prisma.agendaPessoalNotificacao.update({
      where: { id: Number(body.id) },
      data: { lida: true },
    });

    return Response.json(notificacao);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao atualizar notificação" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    await prisma.agendaPessoalNotificacao.deleteMany({
      where: {
        usuarioId: Number(body.usuarioId),
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao excluir notificações" }, { status: 500 });
  }
}
