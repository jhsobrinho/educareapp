const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { User } = require('../models');

// Middleware para verificar token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    // Verificar formato do token (Bearer <token>)
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Erro no formato do token' });
    }
    
    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }
    
    // Verificar validade do token
    jwt.verify(token, authConfig.secret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }
      
      // Verificar se o usuário existe e está ativo
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }
      
      // Adicionar informações do usuário ao objeto de requisição
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      return next();
    });
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(500).json({ error: 'Erro na autenticação' });
  }
};

// Middleware para verificar se o usuário é admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  
  return next();
};

// Middleware para verificar se o usuário é owner
exports.isOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Acesso restrito ao proprietário do sistema' });
  }
  
  return next();
};

// Middleware para verificar se o usuário é admin ou owner
exports.isAdminOrOwner = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Acesso restrito a administradores ou proprietários' });
  }
  
  return next();
};

// Middleware para verificar se o usuário é professional
exports.isProfessional = (req, res, next) => {
  if (req.user.role !== 'professional' && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Acesso restrito a profissionais' });
  }
  
  return next();
};

// Middleware para verificar se o usuário é admin, owner ou professional
exports.isAdminOwnerOrProfessional = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'professional') {
    return res.status(403).json({ error: 'Acesso restrito a administradores, proprietários ou profissionais' });
  }
  
  return next();
};
