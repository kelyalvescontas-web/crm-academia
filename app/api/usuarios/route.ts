import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const usuarioExiste =
      await prisma.usuario.findUnique({
        where: {
          email: body.email,
        },
      });

    if (usuarioExiste) {
      return Response.json(
        {
          error: "Usuário já existe",
        },
        {
          status: 400,
        }
      );
    }

    const senhaHash = await bcrypt.hash(
      body.senha,
      10
    );

    const usuario =
      await prisma.usuario.create({
        data: {
          nome: body.nome,
          email: body.email,
          senha: senhaHash,
          cargo: body.cargo,
        },
      });

    return Response.json(usuario);
  } catch (error) {
    console.log(error);

    return Response.json(
      {
        error: "Erro ao criar usuário",
      },
      {
        status: 500,
      }
    );
  }
}