import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const usuarioId = Number(body.usuarioId);
    const pin = String(body.pin || "").trim();

    if (!usuarioId) {
      return Response.json(
        { ok: false, error: "Usuário não informado." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return Response.json(
        { ok: false, error: "Digite o PIN com 4 números." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        cargo: true,
        pinMetas: true,
      },
    });

    if (!usuario) {
      return Response.json(
        { ok: false, error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    if (String(usuario.cargo || "").toUpperCase() === "ADMIN_GERAL") {
      return Response.json({ ok: true });
    }

    if (!usuario.pinMetas) {
      return Response.json(
        { ok: false, error: "Este usuário ainda não tem PIN cadastrado." },
        { status: 400 }
      );
    }

    const pinCorreto = await bcrypt.compare(pin, usuario.pinMetas);

    if (!pinCorreto) {
      return Response.json(
        { ok: false, error: "PIN incorreto." },
        { status: 401 }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json(
      { ok: false, error: "Erro ao validar PIN das metas." },
      { status: 500 }
    );
  }
}
