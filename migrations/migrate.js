const db = require('../db');

async function migrate() {
  console.log('Running migrations...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user','admin') DEFAULT 'user',
      email_verified TINYINT(1) DEFAULT 0,
      verify_token VARCHAR(100),
      reset_token VARCHAR(100),
      reset_token_expires DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      completed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      month DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS debts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      remaining_amount DECIMAL(10,2) NOT NULL,
      interest_rate DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const bcrypt = require('bcryptjs');
  const [existing] = await db.query("SELECT id FROM users WHERE email = 'admin@rebuildyourlife.eu'");
  if (!existing.length) {
    const hash = await bcrypt.hash('ChangeMe123!', 12);
    await db.query(
      "INSERT INTO users (name, email, password_hash, role, email_verified) VALUES (?, ?, ?, 'admin', 1)",
      ['Admin', 'admin@rebuildyourlife.eu', hash]
    );
    console.log('Admin user created: admin@rebuildyourlife.eu / ChangeMe123!');
  }

  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
