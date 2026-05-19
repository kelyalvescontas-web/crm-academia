import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const usuario = await prisma.usuario.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!usuario) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    const senhaCorreta = await bcrypt.compare(
      body.senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return Response.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    return Response.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}