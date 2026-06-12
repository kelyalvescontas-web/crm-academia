import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const agendaId = Number(body.agendaId);
    const usuariosIds = Array.isArray(body.usuariosIds) ? body.usuariosIds.map(Number) : [];

    if (!agendaId) {
      return Response.json({ error: "Agenda não informada" }, { status: 400 });
    }

    await prisma.agendaPessoalCompartilhamento.deleteMany({
      where: { agendaId },
    });

    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: usuariosIds } },
    });

    for (const usuario of usuarios) {
      await prisma.agendaPessoalCompartilhamento.create({
        data: {
          agendaId,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          status: "PENDENTE",
        },
      });

      await prisma.agendaPessoalNotificacao.create({
        data: {
          usuarioId: usuario.id,
          titulo: "Agenda compartilhada",
          mensagem: `${body.usuarioNome || "Equipe"} compartilhou um item de agenda com você.`,
          agendaId,
          lida: false,
        },
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao compartilhar agenda" }, { status: 500 });
  }
}
