const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { Op } = require('sequelize');

const teamController = {
  // Listar todas as equipes (apenas owner/admin)
  async listTeams(req, res) {
    try {
      const teams = await Team.findAll({
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
            include: [{
              model: Profile,
              as: 'profile',
              attributes: ['profession', 'city', 'state']
            }]
          },
          {
            model: TeamMember,
            as: 'members',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'role'],
              include: [{
                model: Profile,
                as: 'profile',
                attributes: ['profession', 'city', 'state']
              }]
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const teamsWithStats = teams.map(team => ({
        ...team.toJSON(),
        memberCount: team.members?.length || 0,
        activeMemberCount: team.members?.filter(m => m.status === 'active').length || 0,
        pendingInvites: team.members?.filter(m => m.status === 'invited').length || 0
      }));

      res.json({
        success: true,
        data: {
          teams: teamsWithStats,
          total: teams.length
        }
      });
    } catch (error) {
      console.error('Erro ao listar equipes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Obter detalhes de uma equipe específica
  async getTeam(req, res) {
    try {
      const { id } = req.params;

      const team = await Team.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
            include: [{
              model: Profile,
              as: 'profile',
              attributes: ['profession', 'city', 'state']
            }]
          },
          {
            model: TeamMember,
            as: 'members',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'role'],
              include: [{
                model: Profile,
                as: 'profile',
                attributes: ['profession', 'city', 'state']
              }]
            }]
          }
        ]
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
      }

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      console.error('Erro ao obter equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Criar nova equipe
  async createTeam(req, res) {
    try {
      const { name, description, type, logoUrl, settings } = req.body;
      const ownerId = req.user.id;

      const team = await Team.create({
        name,
        description,
        ownerId,
        type: type || 'professional',
        logoUrl,
        settings: settings || {},
        isActive: true
      });

      // Adicionar o owner como admin da equipe
      await TeamMember.create({
        teamId: team.id,
        userId: ownerId,
        role: 'admin',
        status: 'active',
        joinedAt: new Date(),
        invitedBy: ownerId,
        invitedAt: new Date()
      });

      const teamWithDetails = await Team.findByPk(team.id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          },
          {
            model: TeamMember,
            as: 'members',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'role']
            }]
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: teamWithDetails
      });
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Atualizar equipe
  async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const { name, description, type, logoUrl, settings, isActive } = req.body;

      const team = await Team.findByPk(id);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
      }

      await team.update({
        name: name || team.name,
        description: description !== undefined ? description : team.description,
        type: type || team.type,
        logoUrl: logoUrl !== undefined ? logoUrl : team.logoUrl,
        settings: settings || team.settings,
        isActive: isActive !== undefined ? isActive : team.isActive
      });

      const updatedTeam = await Team.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          },
          {
            model: TeamMember,
            as: 'members',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'role']
            }]
          }
        ]
      });

      res.json({
        success: true,
        data: updatedTeam
      });
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Deletar equipe
  async deleteTeam(req, res) {
    try {
      const { id } = req.params;

      const team = await Team.findByPk(id);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
      }

      // Remover todos os membros primeiro
      await TeamMember.destroy({
        where: { teamId: id }
      });

      // Remover a equipe
      await team.destroy();

      res.json({
        success: true,
        message: 'Equipe removida com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Convidar membro para equipe
  async inviteMember(req, res) {
    try {
      const { teamId } = req.params;
      const { userId, role, permissions } = req.body;
      const invitedBy = req.user.id;

      // Verificar se a equipe existe
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
      }

      // Verificar se o usuário existe
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Verificar se já é membro
      const existingMember = await TeamMember.findOne({
        where: { teamId, userId }
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          error: 'Usuário já é membro desta equipe'
        });
      }

      // Criar convite
      const teamMember = await TeamMember.create({
        teamId,
        userId,
        role: role || 'member',
        status: 'invited',
        invitedBy,
        invitedAt: new Date(),
        permissions: permissions || {}
      });

      const memberWithDetails = await TeamMember.findByPk(teamMember.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          include: [{
            model: Profile,
            as: 'profile',
            attributes: ['profession', 'city', 'state']
          }]
        }]
      });

      res.status(201).json({
        success: true,
        data: memberWithDetails
      });
    } catch (error) {
      console.error('Erro ao convidar membro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Listar membros de uma equipe
  async listMembers(req, res) {
    try {
      const { teamId } = req.params;

      const members = await TeamMember.findAll({
        where: { teamId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          include: [{
            model: Profile,
            as: 'profile',
            attributes: ['profession', 'city', 'state']
          }]
        }],
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          members,
          total: members.length
        }
      });
    } catch (error) {
      console.error('Erro ao listar membros:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Atualizar membro da equipe
  async updateMember(req, res) {
    try {
      const { teamId, memberId } = req.params;
      const { role, status, permissions } = req.body;

      const member = await TeamMember.findOne({
        where: { id: memberId, teamId }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Membro não encontrado'
        });
      }

      await member.update({
        role: role || member.role,
        status: status || member.status,
        permissions: permissions || member.permissions,
        joinedAt: status === 'active' && !member.joinedAt ? new Date() : member.joinedAt
      });

      const updatedMember = await TeamMember.findByPk(memberId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          include: [{
            model: Profile,
            as: 'profile',
            attributes: ['profession', 'city', 'state']
          }]
        }]
      });

      res.json({
        success: true,
        data: updatedMember
      });
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Remover membro da equipe
  async removeMember(req, res) {
    try {
      const { teamId, memberId } = req.params;

      const member = await TeamMember.findOne({
        where: { id: memberId, teamId }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Membro não encontrado'
        });
      }

      await member.destroy();

      res.json({
        success: true,
        message: 'Membro removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  },

  // Buscar usuários para convite (profissionais e pais)
  async searchUsersForInvite(req, res) {
    try {
      const { teamId } = req.params;
      const { search, role } = req.query;

      // Obter IDs dos usuários já membros da equipe
      const existingMembers = await TeamMember.findAll({
        where: { teamId },
        attributes: ['userId']
      });
      const existingUserIds = existingMembers.map(m => m.userId);

      // Construir condições de busca
      const whereConditions = {
        id: { [Op.notIn]: existingUserIds }, // Excluir membros existentes
        status: 'active'
      };

      if (role && role !== 'all') {
        whereConditions.role = role;
      } else {
        whereConditions.role = { [Op.in]: ['professional', 'user'] }; // Apenas profissionais e pais
      }

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const users = await User.findAll({
        where: whereConditions,
        include: [{
          model: Profile,
          as: 'profile',
          attributes: ['profession', 'specialization', 'city', 'state']
        }],
        attributes: ['id', 'name', 'email', 'role'],
        limit: 20,
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          users,
          total: users.length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
};

module.exports = teamController;
