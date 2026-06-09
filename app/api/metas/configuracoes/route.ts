import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function mesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function numeroSeguro(valor: any, padrao: number) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
}

function textoSeguro(valor: any, padrao = "") {
  const texto = String(valor ?? padrao ?? "");
  return texto.replace(/'/g, "''");
}

async function garantirColunaFuncionarias() {
  // Apenas 1 coluna nova. As demais já devem estar no schema.prisma/db push.
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ConfiguracaoMeta" ADD COLUMN IF NOT EXISTS "campanhaFuncionarias" TEXT DEFAULT ''`
  );
}

async function buscarConfiguracaoCompleta(id: number) {
  const linhas: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "ConfiguracaoMeta" WHERE id = ${Number(id)} LIMIT 1`
  );

  return linhas?.[0] || null;
}

async function buscarOuCriarConfiguracao(unidadeId: number, mes: string) {
  let configuracao = await prisma.configuracaoMeta.findFirst({
    where: {
      unidadeId,
      mes,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!configuracao) {
    configuracao = await prisma.configuracaoMeta.create({
      data: {
        unidadeId,
        mes,
        meta1Qtd: 30,
        meta1Valor: 300,
        meta2Qtd: 40,
        meta2Valor: 500,
        meta3Qtd: 50,
        meta3Valor: 800,
        meta4Qtd: 60,
        meta4Valor: 1200,
        mensagemMotivacional:
          "Você é capaz de mais do que imagina! Cada contrato é um passo para sua vitória.",
        mensagemCrista:
          "Tudo posso naquele que me fortalece. Filipenses 4:13",
      },
    });
  }

  return configuracao;
}

export async function GET(req: Request) {
  try {
    await garantirColunaFuncionarias();

    const { searchParams } = new URL(req.url);
    const unidadeId = getUnidadeId(req);
    const mes = searchParams.get("mes") || mesAtual();

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    const configuracao = await buscarOuCriarConfiguracao(unidadeId, mes);
    const completa = await buscarConfiguracaoCompleta(configuracao.id);

    return Response.json({
      ...configuracao,
      ...completa,
      metaEmpresa: numeroSeguro(completa?.metaEmpresa, Number(configuracao.meta4Qtd || 60)),
      campanhaAtiva:
        completa?.campanhaAtiva === false ||
        completa?.campanhaAtiva === 0 ||
        completa?.campanhaAtiva === "false"
          ? false
          : true,
      campanhaTitulo: completa?.campanhaTitulo ?? "Desafio Indicação Premiada",
      campanhaRegra: completa?.campanhaRegra ?? "Meta: 2 indicações fechadas",
      campanhaPremio: completa?.campanhaPremio ?? "Vale R$50,00",
      campanhaProgresso: numeroSeguro(completa?.campanhaProgresso, 1),
      campanhaObjetivo: numeroSeguro(completa?.campanhaObjetivo, 2),
      campanhaUnidade: completa?.campanhaUnidade ?? "indicações fechadas",
      campanhaFuncionarias: completa?.campanhaFuncionarias ?? "",
      comunicado1Titulo: completa?.comunicado1Titulo ?? "Reunião Comercial",
      comunicado1Mensagem:
        completa?.comunicado1Mensagem ?? "Sexta-feira às 08:00 na sala da gerência.",
      comunicado2Titulo: completa?.comunicado2Titulo ?? "Nova Campanha",
      comunicado2Mensagem:
        completa?.comunicado2Mensagem ?? "Indique 2 amigos e ganhe um vale R$50!",
      lancamentoTitulo: completa?.lancamentoTitulo ?? "Novo Plano",
      lancamentoMensagem:
        completa?.lancamentoMensagem ?? "Conheça nosso novo plano Musculação + Ritmos.",
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao buscar configuração de metas" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await garantirColunaFuncionarias();

    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);
    const mes = body.mes || mesAtual();

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    const configuracaoAtual = await buscarOuCriarConfiguracao(unidadeId, mes);

    const meta1Qtd = numeroSeguro(body.meta1Qtd, 30);
    const meta1Valor = numeroSeguro(body.meta1Valor, 300);
    const meta2Qtd = numeroSeguro(body.meta2Qtd, 40);
    const meta2Valor = numeroSeguro(body.meta2Valor, 500);
    const meta3Qtd = numeroSeguro(body.meta3Qtd, 50);
    const meta3Valor = numeroSeguro(body.meta3Valor, 800);
    const meta4Qtd = numeroSeguro(body.meta4Qtd, 60);
    const meta4Valor = numeroSeguro(body.meta4Valor, 1200);

    const configuracao = await prisma.configuracaoMeta.update({
      where: {
        id: configuracaoAtual.id,
      },
      data: {
        mes,
        meta1Qtd,
        meta1Valor,
        meta2Qtd,
        meta2Valor,
        meta3Qtd,
        meta3Valor,
        meta4Qtd,
        meta4Valor,
        mensagemMotivacional:
          body.mensagemMotivacional ??
          "Você é capaz de mais do que imagina! Cada contrato é um passo para sua vitória.",
        mensagemCrista:
          body.mensagemCrista ??
          "Tudo posso naquele que me fortalece. Filipenses 4:13",
      },
    });

    const metaEmpresa = numeroSeguro(body.metaEmpresa, meta4Qtd);
    const campanhaAtiva = body.campanhaAtiva === true || body.campanhaAtiva === "true";
    const campanhaProgresso = numeroSeguro(body.campanhaProgresso, 0);
    const campanhaObjetivo = numeroSeguro(body.campanhaObjetivo, 1);

    await prisma.$executeRawUnsafe(`
      UPDATE "ConfiguracaoMeta"
      SET
        "metaEmpresa" = ${metaEmpresa},
        "campanhaAtiva" = ${campanhaAtiva ? "true" : "false"},
        "campanhaTitulo" = '${textoSeguro(body.campanhaTitulo, "Desafio Indicação Premiada")}',
        "campanhaRegra" = '${textoSeguro(body.campanhaRegra, "Meta: 2 indicações fechadas")}',
        "campanhaPremio" = '${textoSeguro(body.campanhaPremio, "Vale R$50,00")}',
        "campanhaProgresso" = ${campanhaProgresso},
        "campanhaObjetivo" = ${campanhaObjetivo},
        "campanhaUnidade" = '${textoSeguro(body.campanhaUnidade, "indicações fechadas")}',
        "campanhaFuncionarias" = '${textoSeguro(body.campanhaFuncionarias, "")}',
        "comunicado1Titulo" = '${textoSeguro(body.comunicado1Titulo, "Reunião Comercial")}',
        "comunicado1Mensagem" = '${textoSeguro(body.comunicado1Mensagem, "Sexta-feira às 08:00 na sala da gerência.")}',
        "comunicado2Titulo" = '${textoSeguro(body.comunicado2Titulo, "Nova Campanha")}',
        "comunicado2Mensagem" = '${textoSeguro(body.comunicado2Mensagem, "Indique 2 amigos e ganhe um vale R$50!")}',
        "lancamentoTitulo" = '${textoSeguro(body.lancamentoTitulo, "Novo Plano")}',
        "lancamentoMensagem" = '${textoSeguro(body.lancamentoMensagem, "Conheça nosso novo plano Musculação + Ritmos.")}'
      WHERE "id" = ${Number(configuracaoAtual.id)}
    `);

    const completa = await buscarConfiguracaoCompleta(configuracaoAtual.id);

    return Response.json({
      ok: true,
      ...configuracao,
      ...completa,
    });
  } catch (error: any) {
    console.log(error);

    return Response.json(
      {
        error: "Erro ao salvar configuração de metas",
        detalhe: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}
