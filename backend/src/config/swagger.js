const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TeamCal Backend API",
      version: "1.0.0",
      description:
        "Production REST API for TeamCal — a health OS covering fasting, nutrition, sleep, social, AI coaching, and monetisation.",
    },
    servers: [{ url: "/api", description: "API base" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

module.exports = swaggerJsdoc(options);
