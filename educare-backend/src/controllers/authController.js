const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Profile } = require('../models');
const authConfig = require('../config/auth');
const { validationResult } = require('express-validator');

// Função para gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, authConfig.secret, {
    expiresIn: authConfig.expiresIn
  });
};

// Registrar novo usuário
exports.register = async (req, res) => {
  try {
    console.log('=== REGISTRO - Dados recebidos ===');
    console.log('Body:', req.body);
    
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erros de validação:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    console.log('Validação passou, processando registro...');

    const { email, phone, password, name, firstName, lastName, role } = req.body;

    // Mapear role 'parent' para 'user' (compatibilidade com ENUM do banco)
    const mappedRole = role === 'parent' ? 'user' : role;

    // Verificar se pelo menos email ou telefone foi fornecido
    if (!email && !phone) {
      return res.status(400).json({ error: 'É necessário fornecer email ou telefone' });
    }

    // Processar nome: usar firstName/lastName se fornecidos, ou dividir 'name'
    let finalFirstName = firstName;
    let finalLastName = lastName;
    
    if (!firstName && !lastName && name) {
      const nameParts = name.trim().split(' ');
      finalFirstName = nameParts[0] || name;
      finalLastName = nameParts.slice(1).join(' ') || '';
    }

    // Verificar se o e-mail já está em uso (se fornecido)
    if (email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'E-mail já está em uso' });
      }
    }

    // Verificar se o telefone já está em uso (se fornecido)
    if (phone) {
      const phoneExists = await User.findOne({ where: { phone } });
      if (phoneExists) {
        return res.status(400).json({ error: 'Telefone já está em uso' });
      }
    }

    // Criar usuário
    const user = await User.create({
      email,
      phone,
      password,
      name,
      role: mappedRole || 'user',
      status: 'active'  // Definir como ativo automaticamente para pais/users
    });

    // Criar perfil do usuário
    await Profile.create({
      user_id: user.id,
      name: name,
      type: mappedRole === 'professional' ? 'professional' : 'parent',
      phone: phone
    });

    // Gerar token JWT
    const token = generateToken(user.id);
    const refreshToken = generateToken(user.id); // Por enquanto, mesmo token (pode ser melhorado)

    // Retornar dados do usuário (sem a senha), token e refreshToken
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: name || `${finalFirstName} ${finalLastName}`.trim(),
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, password } = req.body;

    // Verificar se pelo menos email ou telefone foi fornecido
    if (!email && !phone) {
      return res.status(400).json({ error: 'É necessário fornecer email ou telefone' });
    }

    // Buscar usuário pelo e-mail ou telefone
    let whereClause = {};
    if (email) {
      whereClause.email = email;
    } else if (phone) {
      whereClause.phone = phone;
    }

    const user = await User.findOne({ 
      where: whereClause,
      include: [{ model: Profile, as: 'profile' }]
    });

    // Verificar se o usuário existe
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Verificar senha
    const passwordMatch = await user.checkPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Gerar token JWT
    const token = generateToken(user.id);

    // Retornar dados do usuário (sem a senha) e token
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    // O middleware auth.verifyToken já verificou o token
    // e adicionou as informações do usuário ao objeto req.user
    
    // Buscar informações atualizadas do usuário
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Profile, as: 'profile' }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(500).json({ error: 'Erro ao verificar token' });
  }
};

// Solicitar redefinição de senha
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuário pelo e-mail
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Por segurança, não informamos se o e-mail existe ou não
      return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha' });
    }

    // Gerar token para redefinição de senha
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Salvar token e data de expiração no usuário
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    // Aqui seria implementado o envio de e-mail com o token
    // Por simplicidade, apenas retornamos o token na resposta
    
    return res.status(200).json({
      message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha',
      resetToken // Em produção, este token seria enviado por e-mail, não na resposta
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return res.status(500).json({ error: 'Erro ao solicitar redefinição de senha' });
  }
};

// Redefinir senha
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Buscar usuário pelo token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};

// Atualizar senha (usuário logado)
exports.updatePassword = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Buscar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
};

// Logout (opcional, depende da implementação do frontend)
exports.logout = async (req, res) => {
  try {
    // No JWT, o logout geralmente é implementado no cliente
    // Aqui podemos registrar o evento ou invalidar tokens em uma lista negra se necessário
    const userId = req.user.id;
    
    // Registrar evento de logout (opcional)
    console.log(`Usuário ${userId} realizou logout em ${new Date()}`);
    
    return res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao realizar logout:', error);
    return res.status(500).json({ error: 'Erro ao realizar logout' });
  }
};

// Gerar e enviar chave de verificação para telefone
exports.sendPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório' });
    }

    // Gerar código de verificação de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Definir data de expiração (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Verificar se o telefone já está cadastrado
    let user = await User.findOne({ where: { phone } });

    if (user) {
      // Atualizar código de verificação para usuário existente
      user.phone_verification_code = verificationCode;
      user.phone_verification_expires = expiresAt;
      await user.save();
    } else {
      // Criar usuário temporário com telefone e código de verificação
      user = await User.create({
        phone,
        phone_verification_code: verificationCode,
        phone_verification_expires: expiresAt,
        status: 'pending',
        password: await bcrypt.hash(Math.random().toString(36), 10) // Senha temporária aleatória
      });
    }

    // Obter URL do webhook do .env
    const webhookUrl = process.env.PHONE_VERIFICATION_WEBHOOK;
    
    if (!webhookUrl) {
      return res.status(500).json({ error: 'URL do webhook não configurada' });
    }

    // Enviar código via webhook
    try {
      // Aqui você implementaria a chamada ao webhook
      // Por exemplo, usando axios ou fetch:
      // await axios.post(`${webhookUrl}?phone=${phone}&code=${verificationCode}`);
      
      // Por enquanto, apenas simulamos o envio
      console.log(`Enviando código ${verificationCode} para ${phone} via ${webhookUrl}`);
      
      return res.status(200).json({
        message: 'Código de verificação enviado com sucesso',
        expiresAt
      });
    } catch (error) {
      console.error('Erro ao enviar código via webhook:', error);
      return res.status(500).json({ error: 'Erro ao enviar código de verificação' });
    }
  } catch (error) {
    console.error('Erro ao gerar código de verificação:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

// Verificar código de telefone
exports.verifyPhoneCode = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Telefone e código são obrigatórios' });
    }

    // Buscar usuário pelo telefone
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o código é válido e não expirou
    if (user.phone_verification_code !== code) {
      return res.status(400).json({ error: 'Código de verificação inválido' });
    }

    if (new Date() > new Date(user.phone_verification_expires)) {
      return res.status(400).json({ error: 'Código de verificação expirado' });
    }

    // Ativar usuário se estiver pendente
    if (user.status === 'pending') {
      user.status = 'active';
    }

    // Limpar código de verificação
    user.phone_verification_code = null;
    user.phone_verification_expires = null;
    await user.save();

    // Gerar token JWT
    const token = generateToken(user.id);
    const refreshToken = jwt.sign({ id: user.id }, authConfig.refreshSecret, {
      expiresIn: authConfig.refreshExpiresIn
    });

    return res.status(200).json({
      message: 'Telefone verificado com sucesso',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Erro ao verificar código de telefone:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};
