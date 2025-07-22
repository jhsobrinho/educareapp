const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         role:
 *           type: string
 *           enum: [user, professional, admin, owner]
 *           description: Papel do usuário no sistema
 *         status:
 *           type: string
 *           enum: [active, inactive, pending, blocked]
 *           description: Status da conta do usuário
 *         email_verified:
 *           type: boolean
 *           description: Indica se o email foi verificado
 *         last_login:
 *           type: string
 *           format: date-time
 *           description: Data e hora do último login
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do perfil
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID do usuário associado
 *         name:
 *           type: string
 *           description: Nome do perfil
 *         type:
 *           type: string
 *           enum: [personal, professional, parent]
 *           description: Tipo do perfil
 *         phone:
 *           type: string
 *           description: Número de telefone
 *         address:
 *           type: string
 *           description: Endereço
 *         city:
 *           type: string
 *           description: Cidade
 *         state:
 *           type: string
 *           description: Estado
 *         country:
 *           type: string
 *           description: País
 *         zip_code:
 *           type: string
 *           description: CEP
 *         bio:
 *           type: string
 *           description: Biografia ou descrição
 *         professional_id:
 *           type: string
 *           description: ID profissional (CRM, CRP, etc)
 *         professional_specialty:
 *           type: string
 *           description: Especialidade profissional
 *         is_primary:
 *           type: boolean
 *           description: Indica se é o perfil principal do usuário
 *         is_verified:
 *           type: boolean
 *           description: Indica se o perfil foi verificado
 */

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Gerenciamento de usuários
 */



// Middleware para verificar se o usuário é admin ou owner
const isAdminOrOwner = [
  authMiddleware.verifyToken,
  authMiddleware.isAdminOrOwner
];

// Rota para listar todos os usuários (apenas admin/owner)
router.get('/', isAdminOrOwner, userController.listUsers);

// Rota para obter um usuário pelo ID (próprio usuário ou admin/owner)
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);

// Rota para atualizar um usuário (próprio usuário ou admin/owner)
router.put(
  '/:id',
  authMiddleware.verifyToken,
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('role').optional().isIn(['user', 'professional', 'admin', 'owner']).withMessage('Papel inválido')
  ],
  userController.updateUser
);

// Rota para excluir um usuário (próprio usuário ou admin/owner)
router.delete('/:id', authMiddleware.verifyToken, userController.deleteUser);

// Rota para buscar usuários por nome ou email (apenas admin/owner)
router.get('/search', isAdminOrOwner, userController.searchUsers);

// Rota para alterar status de um usuário (apenas admin/owner)
router.patch(
  '/:id/status',
  isAdminOrOwner,
  [
    body('isActive').isBoolean().withMessage('isActive deve ser um booleano')
  ],
  userController.updateUserStatus
);

module.exports = router;
