'use strict';

const { ClientePlano, Plano, Departamento } = require('../models');

/**
 * Middleware: verificarLimiteDepartamentos
 *
 * Validates that creating a new department won't exceed plan limit
 *
 * Usage:
 *   router.post(
 *     '/api/admin/departamentos',
 *     verificarAdmin,
 *     verificarLimiteDepartamentos,
 *     AdminController.criarDepartamento
 *   )
 *
 * Behavior:
 *   - Master: allowed (no limits)
 *   - Admin/Atendente: check if current department count < limit in plan
 *
 * Returns:
 *   200: next() → continue
 *   401: not authenticated
 *   403: forbidden (no cliente_id)
 *   404: no active plan
 *   429: limit exceeded (Too Many Requests)
 *   500: database error
 */

const verificarLimiteDepartamentos = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    // Master pode criar sem limite
    if (req.usuario.role === 'master') {
      console.log(
        `[verificarLimiteDepartamentos] Master ${req.usuario.email} criando departamento (sem limite)`
      );
      return next();
    }

    if (!req.usuario.cliente_id) {
      return res.status(403).json({
        erro: 'Acesso negado',
        detalhes: 'Usuário sem cliente associado',
      });
    }

    const clientePlano = await ClientePlano.findOne({
      where: {
        cliente_id: req.usuario.cliente_id,
        status: 'ativo',
      },
      include: [
        {
          model: Plano,
          attributes: ['id', 'departamentos_limite'],
          as: 'Plano',
        },
      ],
    });

    if (!clientePlano || !clientePlano.Plano) {
      return res.status(404).json({
        erro: 'Sem plano ativo',
        detalhes: 'Cliente não tem plano de serviço ativo',
      });
    }

    const limitePermitido = clientePlano.Plano.departamentos_limite;

    const departamentosExistentes = await Departamento.count({
      where: { cliente_id: req.usuario.cliente_id },
    });

    if (departamentosExistentes >= limitePermitido) {
      console.warn(
        `[verificarLimiteDepartamentos] Cliente ${req.usuario.cliente_id} atingiu limite de ${limitePermitido} departamentos`
      );

      return res.status(429).json({
        erro: 'Limite de departamentos atingido',
        detalhes: `Seu plano permite ${limitePermitido} departamentos, você tem ${departamentosExistentes}`,
        limite: limitePermitido,
        atual: departamentosExistentes,
        solucao: 'Solicite upgrade do seu plano para criar mais departamentos',
      });
    }

    const restante = limitePermitido - departamentosExistentes;

    console.log(
      `[verificarLimiteDepartamentos] Cliente ${req.usuario.cliente_id} autorizado (departamentos: ${departamentosExistentes}/${limitePermitido})`
    );

    req.departamentos = {
      limite: limitePermitido,
      atual: departamentosExistentes,
      restante,
    };

    next();
  } catch (erro) {
    console.error('[verificarLimiteDepartamentos] Erro inesperado:', erro);
    return res.status(500).json({
      erro: 'Erro ao verificar limite',
      detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    });
  }
};

module.exports = verificarLimiteDepartamentos;
