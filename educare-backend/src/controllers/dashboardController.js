const { User, Profile, Subscription, SubscriptionPlan, Team, TeamMember } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Métricas principais do dashboard
exports.getMetrics = async (req, res) => {
  try {
    // Total de usuários
    const totalUsers = await User.count();

    // Novos usuários hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.count({
      where: {
        created_at: {
          [Op.gte]: today
        }
      }
    });

    // Assinaturas ativas
    const activeSubscriptions = await Subscription.count({
      where: {
        status: 'active'
      }
    });

    // Receita mensal (simulada - pode ser calculada com query mais simples)
    const monthlyRevenue = activeSubscriptions * 29.90; // Valor médio simulado

    // Taxa de churn (cancelamentos no último mês)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const canceledSubscriptions = await Subscription.count({
      where: {
        status: 'canceled',
        canceledAt: {
          [Op.gte]: lastMonth
        }
      }
    });

    const churnRate = totalUsers > 0 ? ((canceledSubscriptions / totalUsers) * 100) : 0;

    // Taxa de conversão (assinaturas ativas / total de usuários)
    const conversionRate = totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100) : 0;

    // Saúde do sistema (simulada - pode ser baseada em métricas reais)
    const systemHealth = 99.5; // Pode ser calculada baseada em uptime, erros, etc.
    const uptime = 99.9;

    res.json({
      totalUsers,
      activeSubscriptions,
      monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
      churnRate: parseFloat(churnRate.toFixed(2)),
      systemHealth,
      newUsersToday,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      uptime
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Métricas dos planos de assinatura
exports.getSubscriptionPlanMetrics = async (req, res) => {
  try {
    // Buscar todos os planos
    const allPlans = await SubscriptionPlan.findAll({
      order: [['sort_order', 'ASC']]
    });

    // Para cada plano, contar assinantes e calcular receita
    const plans = [];
    for (const plan of allPlans) {
      const subscriberCount = await Subscription.count({
        where: {
          planId: plan.id,
          status: 'active'
        }
      });

      const revenue = subscriberCount * parseFloat(plan.price);
      const growthPercentage = Math.random() * 20 - 5; // Simulado

      plans.push({
        planName: plan.name,
        subscriberCount,
        revenue,
        growthPercentage
      });
    }

    res.json({ plans });
  } catch (error) {
    console.error('Erro ao buscar métricas dos planos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Dados de crescimento de usuários
exports.getUserGrowthData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userGrowth = await User.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'users']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']]
    });

    const subscriptionGrowth = await Subscription.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'subscriptions']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']]
    });

    // Combinar dados de usuários e assinaturas
    const growthData = [];
    const userMap = new Map();
    const subscriptionMap = new Map();

    userGrowth.forEach(item => {
      userMap.set(item.dataValues.date, parseInt(item.dataValues.users));
    });

    subscriptionGrowth.forEach(item => {
      subscriptionMap.set(item.dataValues.date, parseInt(item.dataValues.subscriptions));
    });

    // Gerar dados para todos os dias no período
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      growthData.push({
        date: dateStr,
        users: userMap.get(dateStr) || 0,
        subscriptions: subscriptionMap.get(dateStr) || 0
      });
    }

    res.json({ growth: growthData });
  } catch (error) {
    console.error('Erro ao buscar dados de crescimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Estatísticas gerais do sistema
exports.getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalPlans,
      activePlans,
      totalTeams,
      activeTeams,
      totalProfiles,
      verifiedProfiles
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      Subscription.count(),
      Subscription.count({ where: { status: 'active' } }),
      SubscriptionPlan.count(),
      SubscriptionPlan.count({ where: { is_active: true } }),
      Team.count(),
      Team.count({ where: { is_active: true } }),
      Profile.count(),
      Profile.count({ where: { is_verified: true } })
    ]);

    // Receita total e mensal (simuladas)
    const totalRevenue = activeSubscriptions * 29.90;
    const monthlyRevenue = totalRevenue; // Assumindo que todas são mensais

    res.json({
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
      totalPlans,
      activePlans,
      totalTeams,
      activeTeams,
      totalProfiles,
      verifiedProfiles
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Usuários por role
exports.getUsersByRole = async (req, res) => {
  try {
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['role'],
      order: [['role', 'ASC']]
    });

    const result = usersByRole.map(item => ({
      role: item.role,
      count: parseInt(item.dataValues.count)
    }));

    res.json({ usersByRole: result });
  } catch (error) {
    console.error('Erro ao buscar usuários por role:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Assinaturas por status
exports.getSubscriptionsByStatus = async (req, res) => {
  try {
    const subscriptionsByStatus = await Subscription.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      order: [['status', 'ASC']]
    });

    const result = subscriptionsByStatus.map(item => ({
      status: item.status,
      count: parseInt(item.dataValues.count)
    }));

    res.json({ subscriptionsByStatus: result });
  } catch (error) {
    console.error('Erro ao buscar assinaturas por status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Análise de receita
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    let dateFormat;
    let dateInterval;

    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        dateInterval = 30; // últimos 30 dias
        break;
      case 'weekly':
        dateFormat = '%Y-%u'; // ano-semana
        dateInterval = 12; // últimas 12 semanas
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        dateInterval = 12; // últimos 12 meses
        break;
    }

    const startDate = new Date();
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - dateInterval);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - (dateInterval * 7));
    } else {
      startDate.setMonth(startDate.getMonth() - dateInterval);
    }

    const revenueData = await Subscription.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('subscriptions.created_at'), dateFormat), 'period'],
        [fn('SUM', literal('CAST(subscription_plan.price AS DECIMAL)')), 'revenue'],
        [fn('COUNT', col('subscriptions.id')), 'subscriptions']
      ],
      include: [{
        model: SubscriptionPlan,
        as: 'subscriptionPlan',
        attributes: []
      }],
      where: {
        created_at: {
          [Op.gte]: startDate
        },
        status: 'active'
      },
      group: [fn('DATE_FORMAT', col('subscriptions.created_at'), dateFormat)],
      order: [[fn('DATE_FORMAT', col('subscriptions.created_at'), dateFormat), 'ASC']]
    });

    const analytics = revenueData.map(item => ({
      period: item.dataValues.period,
      revenue: parseFloat(item.dataValues.revenue) || 0,
      subscriptions: parseInt(item.dataValues.subscriptions) || 0
    }));

    res.json({ analytics, period });
  } catch (error) {
    console.error('Erro ao buscar análise de receita:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
