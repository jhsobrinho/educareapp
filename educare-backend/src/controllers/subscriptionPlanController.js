const { SubscriptionPlan } = require('../models');
const { validationResult } = require('express-validator');

// Listar todos os planos de assinatura (públicos)
exports.listPlans = async (req, res) => {
  try {
    // Buscar planos ativos e públicos
    const plans = await SubscriptionPlan.findAll({
      where: { 
        isActive: true,
        isPublic: true 
      },
      order: [['price', 'ASC']]
    });
    
    return res.status(200).json({ plans });
  } catch (error) {
    console.error('Erro ao listar planos de assinatura:', error);
    return res.status(500).json({ error: 'Erro ao listar planos de assinatura' });
  }
};

// Listar todos os planos de assinatura (admin/owner)
exports.listAllPlans = async (req, res) => {
  try {
    // Buscar todos os planos
    const plans = await SubscriptionPlan.findAll({
      order: [['price', 'ASC']]
    });
    
    return res.status(200).json({ plans });
  } catch (error) {
    console.error('Erro ao listar planos de assinatura:', error);
    return res.status(500).json({ error: 'Erro ao listar planos de assinatura' });
  }
};

// Obter plano por ID
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar plano pelo ID
    const plan = await SubscriptionPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    // Verificar se o plano é público ou se o usuário é admin/owner
    if (!plan.isPublic && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    return res.status(200).json({ plan });
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return res.status(500).json({ error: 'Erro ao buscar plano' });
  }
};

// Criar plano (apenas admin/owner)
exports.createPlan = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      price, 
      interval, 
      intervalCount, 
      trialDays, 
      features, 
      maxChildren, 
      maxTeams, 
      maxTeamMembers, 
      isActive, 
      isPublic 
    } = req.body;
    
    // Criar plano
    const plan = await SubscriptionPlan.create({
      name,
      description,
      price,
      interval,
      intervalCount,
      trialDays,
      features,
      maxChildren,
      maxTeams,
      maxTeamMembers,
      isActive: isActive !== undefined ? isActive : true,
      isPublic: isPublic !== undefined ? isPublic : true
    });
    
    return res.status(201).json({ plan });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return res.status(500).json({ error: 'Erro ao criar plano' });
  }
};

// Atualizar plano (apenas admin/owner)
exports.updatePlan = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      interval, 
      intervalCount, 
      trialDays, 
      features, 
      maxChildren, 
      maxTeams, 
      maxTeamMembers, 
      isActive, 
      isPublic 
    } = req.body;
    
    // Buscar plano pelo ID
    const plan = await SubscriptionPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    // Atualizar campos do plano
    if (name) plan.name = name;
    if (description) plan.description = description;
    if (price !== undefined) plan.price = price;
    if (interval) plan.interval = interval;
    if (intervalCount !== undefined) plan.intervalCount = intervalCount;
    if (trialDays !== undefined) plan.trialDays = trialDays;
    if (features) plan.features = features;
    if (maxChildren !== undefined) plan.maxChildren = maxChildren;
    if (maxTeams !== undefined) plan.maxTeams = maxTeams;
    if (maxTeamMembers !== undefined) plan.maxTeamMembers = maxTeamMembers;
    if (isActive !== undefined) plan.isActive = isActive;
    if (isPublic !== undefined) plan.isPublic = isPublic;
    
    // Salvar alterações
    await plan.save();
    
    return res.status(200).json({ plan });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
};

// Excluir plano (apenas admin/owner)
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar plano pelo ID
    const plan = await SubscriptionPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    // Verificar se o plano está em uso
    const subscriptionsCount = await plan.countSubscriptions();
    
    if (subscriptionsCount > 0) {
      // Não excluir, apenas desativar
      plan.isActive = false;
      await plan.save();
      
      return res.status(200).json({ 
        message: 'Plano desativado (não excluído pois possui assinaturas ativas)',
        deactivated: true
      });
    }
    
    // Excluir plano
    await plan.destroy();
    
    return res.status(200).json({ message: 'Plano excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    return res.status(500).json({ error: 'Erro ao excluir plano' });
  }
};

// Comparar planos de assinatura
exports.comparePlans = async (req, res) => {
  try {
    // Obter IDs dos planos a serem comparados da query string
    const { ids } = req.query;
    
    if (!ids) {
      // Se não foram especificados IDs, retornar todos os planos públicos e ativos
      const plans = await SubscriptionPlan.findAll({
        where: { 
          isActive: true,
          isPublic: true 
        },
        order: [['price', 'ASC']]
      });
      
      return res.status(200).json({ plans });
    }
    
    // Converter string de IDs em array
    const planIds = ids.split(',').map(id => id.trim());
    
    // Buscar planos pelos IDs
    const plans = await SubscriptionPlan.findAll({
      where: { 
        id: planIds,
        isActive: true
      },
      order: [['price', 'ASC']]
    });
    
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Nenhum plano encontrado com os IDs fornecidos' });
    }
    
    // Preparar dados para comparação
    const comparisonData = {
      plans: plans,
      features: {}
    };
    
    // Extrair todas as features únicas de todos os planos
    plans.forEach(plan => {
      if (plan.features && Array.isArray(plan.features)) {
        plan.features.forEach(feature => {
          if (!comparisonData.features[feature]) {
            comparisonData.features[feature] = {};
          }
          comparisonData.features[feature][plan.id] = true;
        });
      }
    });
    
    return res.status(200).json(comparisonData);
  } catch (error) {
    console.error('Erro ao comparar planos:', error);
    return res.status(500).json({ error: 'Erro ao comparar planos' });
  }
};
