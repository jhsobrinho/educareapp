const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuração básica do Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EducareApp API',
      version: '1.0.0',
      description: 'Documentação da API do EducareApp',
      contact: {
        name: 'Suporte EducareApp',
        email: 'suporte@educareapp.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.educareapp.com',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Caminhos para os arquivos que contêm anotações JSDoc
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/*.js',
    './src/server.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs),
  specs,
};
