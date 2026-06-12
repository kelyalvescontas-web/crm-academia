import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

async function garantirColunasMensagens() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Configuracao"
    ADD COLUMN IF NOT EXISTS "mensagemCancelou" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemDiariaUltimoDia" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemDiariaConversao" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemNutriConfirmacao" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemNutriLembrete" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemNutriCardapio" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemNutriBio" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemNutriCardapioBio" TEXT,
    ADD COLUMN IF NOT EXISTS "mensagemNutriRetorno" TEXT
  `);
}

const mensagensPadrao = {
  mensagemConfirmacao:
    "Oie {aluno}, tudo bem?\n\nSua aula experimental foi agendada pela atendente *{colaboradora}*.\n\nData: *{data}*\nHorário: *{horario}*\nModalidade: *{modalidade}*\n\nTe esperamos por aqui!\n\n*{academia}*\n{endereco}",
  mensagemLembrete:
    "Oie {aluno}, tudo bem?\n\nPassando para te lembrar que sua aula experimental é *Hoje*.\n\nHorário: *{horario}*\nModalidade: *{modalidade}*\n\nEstamos te esperando! Venha com roupa confortável, tênis e sua garrafinha de água para aproveitar ao máximo seu treino experimental!\n\n*{colaboradora}*\n\n*{academia}*\n{endereco}",
  mensagemPosAula:
    "Oie {aluno}, tudo bem?\n\nAqui é a {colaboradora} da {academia}.\n\nQueria saber se gostou da sua aula experimental 😊\n\nMontamos uma ficha de treino personalizada para te ajudar a alcançar seus objetivos da melhor forma!\n\nAproveita para começar ainda essa semana com a gente 🚀\nQualquer dúvida, estou por aqui 😊",
  mensagemNaoCompareceu:
    "Oie {aluno}\n\nAqui é a {colaboradora} da {academia}.\n\nFicamos te esperando para sua aula experimental, mas você não compareceu.\n\nQueremos remarcar para você conhecer a academia e já deixar um treino personalizado preparado para seus objetivos 😊\n\nVamos agendar ainda essa semana?",
  mensagemCancelou:
    "Olá, {aluno}! Tudo bem?\n\nAqui é a {colaboradora} da Prix.\n\nVi que você cancelou sua aula experimental que estava agendada. Que tal remarcarmos para hoje no mesmo horário? Será um prazer receber você!\n\nAguardo sua resposta.",
  mensagemDiaria:
    "Olá, {aluno}! Tudo bem?\n\nSua diária na {academia} está liberada para o dia *{data}*.\n\nQualquer dúvida, estamos à disposição.",
  mensagemDiariaUltimoDia:
    "Olá, {aluno}! Tudo bem?\n\nHoje é o último dia da sua diária na {academia}. Que tal conhecer nossos planos e continuar treinando com a gente?",
  mensagemDiariaConversao:
    "Olá, {aluno}! Tudo bem?\n\nVi que você fez diária conosco. Temos uma condição especial para você continuar treinando na {academia}.",
  mensagemNutriConfirmacao:
    "Olá, {aluno}! Tudo bem?\nPosso confirmar sua consulta com nossa nutricionista, dia *{data}* às *{horario}hs*?\n\nLembrando que a *tolerância de atraso é 10 minutos*, caso não consiga comparecer pedimos que avise com no mínimo 3 horas de antecedência, caso contrário a consulta será dada como feita.\n\n*Não é recomendado fazer exercícios físicos antes da consulta!*",
  mensagemNutriLembrete:
    "Olá, {aluno}! Tudo bem?\n\nPassando para lembrar da sua consulta com a nutricionista hoje às *{horario}hs*.\n\nNão recomendamos fazer exercícios físicos antes da consulta.",
  mensagemNutriCardapio:
    "Olá, {aluno}! Tudo bem?\nEstou te enviando o seu *cardápio* referente à consulta realizada em *{data}*.\n\nLembre-se: cada pequena escolha feita hoje é um passo em direção aos seus objetivos. Mantenha o foco, confie no processo e conte conosco nessa jornada de transformação!\n\nQualquer dúvida, estou à disposição para ajudar.\nAtenciosamente,\n{academia}",
  mensagemNutriBio:
    "Olá, {aluno}!\nSegue em anexo sua *Avaliação de Bioimpedância* referente ao atendimento do dia *{data}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\n{academia}",
  mensagemNutriCardapioBio:
    "Olá, {aluno}! Tudo bem?\nSegue em anexo seu *cardápio* e sua *Avaliação de Bioimpedância* referentes ao atendimento do dia *{data}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\n{academia}",
  mensagemNutriRetorno:
    "Olá, {aluno}! Tudo bem?\n\nSeu retorno com a nutricionista está previsto para *{data}* às *{horario}hs*.\n\nConte conosco!",
};

export async function GET(req: Request) {
  try {
    await garantirColunasMensagens();

    const unidadeId = getUnidadeId(req);

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    let configuracao = await prisma.configuracao.findFirst({
      where: { unidadeId },
    });

    if (!configuracao) {
      configuracao = await prisma.configuracao.create({
        data: {
          nomeAcademia: "CRM Academia",
          telefone: "",
          endereco: "",
          metaMensal: 0,
          corSistema: "#1e3a8a",
          logo: "",
          ...mensagensPadrao,
          unidadeId,
        },
      });
    }

    return Response.json({
      ...mensagensPadrao,
      ...configuracao,
    });
  } catch (error) {
    console.log("ERRO GET CONFIG:", error);

    return Response.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await garantirColunasMensagens();

    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    let configuracao = await prisma.configuracao.findFirst({
      where: { unidadeId },
    });

    const dados = {
      nomeAcademia: body.nomeAcademia || "CRM Academia",
      telefone: body.telefone || "",
      endereco: body.endereco || "",
      metaMensal: Number(body.metaMensal || 0),
      corSistema: body.corSistema || "#1e3a8a",
      logo: body.logo || "",

      mensagemConfirmacao: body.mensagemConfirmacao ?? mensagensPadrao.mensagemConfirmacao,
      mensagemLembrete: body.mensagemLembrete ?? mensagensPadrao.mensagemLembrete,
      mensagemPosAula: body.mensagemPosAula ?? mensagensPadrao.mensagemPosAula,
      mensagemNaoCompareceu: body.mensagemNaoCompareceu ?? mensagensPadrao.mensagemNaoCompareceu,
      mensagemCancelou: body.mensagemCancelou ?? mensagensPadrao.mensagemCancelou,

      mensagemDiaria: body.mensagemDiaria ?? mensagensPadrao.mensagemDiaria,
      mensagemDiariaUltimoDia: body.mensagemDiariaUltimoDia ?? mensagensPadrao.mensagemDiariaUltimoDia,
      mensagemDiariaConversao: body.mensagemDiariaConversao ?? mensagensPadrao.mensagemDiariaConversao,

      mensagemNutriConfirmacao: body.mensagemNutriConfirmacao ?? mensagensPadrao.mensagemNutriConfirmacao,
      mensagemNutriLembrete: body.mensagemNutriLembrete ?? mensagensPadrao.mensagemNutriLembrete,
      mensagemNutriCardapio: body.mensagemNutriCardapio ?? mensagensPadrao.mensagemNutriCardapio,
      mensagemNutriBio: body.mensagemNutriBio ?? mensagensPadrao.mensagemNutriBio,
      mensagemNutriCardapioBio: body.mensagemNutriCardapioBio ?? mensagensPadrao.mensagemNutriCardapioBio,
      mensagemNutriRetorno: body.mensagemNutriRetorno ?? mensagensPadrao.mensagemNutriRetorno,

      unidadeId,
    };

    if (!configuracao) {
      configuracao = await prisma.configuracao.create({
        data: dados,
      });

      return Response.json(configuracao);
    }

    const atualizado = await prisma.configuracao.update({
      where: { id: configuracao.id },
      data: dados,
    });

    return Response.json(atualizado);
  } catch (error) {
    console.log("ERRO PUT CONFIG:", error);

    return Response.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
