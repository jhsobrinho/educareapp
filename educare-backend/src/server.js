const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerConfig = require('./config/swagger');
require('dotenv').config();

// Importação das rotas
// const routes = require('./routes'); // TODO: Implementar rotas principais
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const childRoutes = require('./routes/childRoutes');
// const teamRoutes = require('./routes/teamRoutes'); // TODO: Implementar rotas de equipes
// const licenseRoutes = require('./routes/licenseRoutes'); // TODO: Implementar rotas de licenças
const quizRoutes = require('./routes/quizRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const subscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const teamRoutes = require('./routes/teamRoutes');

// Inicialização do app Express
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de debug para capturar requisições de registro
app.use('/api/auth/register', (req, res, next) => {
  console.log('=== DEBUG MIDDLEWARE - Requisição de registro ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('=== FIM DEBUG ===');
  next();
});

// Rotas
// app.use('/api', routes); // TODO: Implementar rota principal que gerencia todas as outras

// Rotas específicas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/children', childRoutes);
app.use('/api/teams', teamRoutes);
// app.use('/api/licenses', licenseRoutes); // TODO: Implementar rotas de licenças
app.use('/api/quizzes', quizRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do EducareApp!' });
});

// Configuração do Swagger
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicialização do banco de dados
const { sequelize } = require('./config/database');

// Sincronizar modelos com o banco de dados (em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: true }) // Em produção, usar { force: false }
    .then(() => {
      console.log('Banco de dados sincronizado');
    })
    .catch(err => {
      console.error('Erro ao sincronizar banco de dados:', err);
    });
}

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
