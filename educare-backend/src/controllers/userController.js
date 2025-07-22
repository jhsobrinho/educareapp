const { User, Profile } = require('../models');
const { validationResult } = require('express-validator');

// Listar todos os usuários (apenas para admin/owner)
exports.listUsers = async (req, res) => {
  try {
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Opções de filtro
    const filter = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Buscar usuários com paginação
    const { count, rows: users } = await User.findAndCountAll({
      where: filter,
      include: [{ model: Profile, as: 'profile' }],
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expires', 'phone_verification_code', 'phone_verification_expires'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return res.status(200).json({
      users,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

// Obter usuário por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário tem permissão para acessar os dados
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar usuário pelo ID
    const user = await User.findByPk(id, {
      include: [{ model: Profile, as: 'profile' }],
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

// Atualizar usuário
exports.updateUser = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { email, role, status } = req.body;
    
    // Verificar se o usuário tem permissão para atualizar os dados
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Apenas admin/owner pode alterar role e status
    if ((role || status !== undefined) && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar role e status' });
    }
    
    // Buscar usuário pelo ID
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se o e-mail já está em uso por outro usuário
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'E-mail já está em uso' });
      }
      user.email = email;
    }
    
    // Atualizar role e status (apenas para admin/owner)
    if (req.user.role === 'admin' || req.user.role === 'owner') {
      if (role) user.role = role;
      if (status !== undefined) user.status = status;
    }
    
    // Salvar alterações
    await user.save();
    
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Verificar se o usuário tem permissão para alterar a senha
    if (req.user.id !== id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar usuário pelo ID
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Se não for admin/owner, verificar senha atual
    if (req.user.id === id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      const passwordMatch = await user.checkPassword(currentPassword);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
    }
    
    // Atualizar senha
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};

// Excluir usuário (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário tem permissão para excluir
    if (req.user.id !== id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar usuário pelo ID
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Soft delete (marcar como inativo)
    user.status = 'inactive';
    await user.save();
    
    return res.status(200).json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
};

// Buscar usuários por nome ou email (apenas admin/owner)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }
    
    // Buscar usuários que correspondam ao termo de busca
    const users = await User.findAll({
      where: {
        [User.sequelize.Op.or]: [
          { email: { [User.sequelize.Op.iLike]: `%${query}%` } },
          { '$profile.firstName$': { [User.sequelize.Op.iLike]: `%${query}%` } },
          { '$profile.lastName$': { [User.sequelize.Op.iLike]: `%${query}%` } }
        ]
      },
      include: [{ model: Profile, as: 'profile' }],
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

// Atualizar status de um usuário (apenas admin/owner)
exports.updateUserStatus = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Buscar usuário pelo ID
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Atualizar status
    user.status = status;
    await user.save();
    
    return res.status(200).json({
      message: `Status do usuário alterado com sucesso`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status do usuário' });
  }
};
