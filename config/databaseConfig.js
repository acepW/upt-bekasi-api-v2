const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_ROOT,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectModule: require("mysql2"),

    // Pool configuration - ini yang benar untuk Sequelize
    pool: {
      max: 25, // maksimal 20 koneksi
      min: 0, // minimal 0 koneksi
      acquire: 60000, // waktu maksimal untuk mendapatkan koneksi (60 detik)
      idle: 10000, // waktu idle sebelum disconnect (10 detik)
      evict: 1000, // interval check untuk koneksi idle (1 detik)
    },

    // Dialect options khusus untuk MySQL2
    dialectOptions: {
      // Timeout options yang valid untuk MySQL2
      connectTimeout: 60000, // timeout untuk initial connection
      socketPath: undefined, // jika menggunakan socket
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      trace: false,
      multipleStatements: false,

      // SSL configuration jika diperlukan
      // ssl: {
      //   require: false,
      //   rejectUnauthorized: false
      // }
    },

    // Query options
    query: {
      timeout: 30000, // timeout untuk query individual (30 detik)
    },

    // Retry configuration
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /TIMEOUT/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
      max: 5, // maksimal 3 kali retry
    },

    // Logging
    logging: false,

    // Timezone
    //timezone: "+07:00", // sesuaikan dengan timezone Indonesia
  }
);

// Test connection dengan error handling yang lebih baik
const testConnection = async () => {
  try {
    await db.authenticate();
    console.log("✅ Database connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);

    // Jangan exit process, biarkan aplikasi tetap jalan
    // Process akan di-handle oleh PM2 jika terus error
    setTimeout(testConnection, 5000); // retry setelah 5 detik
  }
};

// Jalankan test connection
testConnection();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Closing database connection...");
  try {
    await db.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Closing database connection...");
  try {
    await db.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
  process.exit(0);
});

module.exports = db;
