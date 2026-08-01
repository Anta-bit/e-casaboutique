const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  console.log('Démarrage de la migration de la base de données...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'casa_boutique',
  });

  try {
    // 1. Ajouter le statut à la table users
    const [userColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'status'");
    if (userColumns.length === 0) {
      console.log("Ajout de la colonne 'status' dans la table users...");
      await connection.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended') DEFAULT 'active'");
      console.log("Colonne 'status' ajoutée avec succès.");
    } else {
      console.log("La colonne 'status' existe déjà dans la table users.");
    }

    // 2. Ajouter la colonne user_id dans la table suppliers
    const [supplierUserIdColumn] = await connection.query("SHOW COLUMNS FROM suppliers LIKE 'user_id'");
    if (supplierUserIdColumn.length === 0) {
      console.log("Ajout de la colonne 'user_id' dans la table suppliers...");
      await connection.query("ALTER TABLE suppliers ADD COLUMN user_id INT, ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
      console.log("Colonne 'user_id' et clé étrangère ajoutées avec succès.");
    } else {
      console.log("La colonne 'user_id' existe déjà dans la table suppliers.");
    }

    // 3. Ajouter la colonne status dans la table suppliers
    const [supplierStatusColumn] = await connection.query("SHOW COLUMNS FROM suppliers LIKE 'status'");
    if (supplierStatusColumn.length === 0) {
      console.log("Ajout de la colonne 'status' dans la table suppliers...");
      await connection.query("ALTER TABLE suppliers ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
      console.log("Colonne 'status' ajoutée avec succès.");
    } else {
      console.log("La colonne 'status' existe déjà dans la table suppliers.");
    }

    // Mettre à jour les utilisateurs existants ayant le rôle 'supplier' ou 'admin'
    // Pour tout fournisseur existant dans la table users, s'il n'y a pas d'entrée correspondante dans la table suppliers, on peut en créer une fictive ou lier celle existante
    console.log("Mise en correspondance des comptes existants...");
    const [suppliers] = await connection.query("SELECT * FROM suppliers");
    const [users] = await connection.query("SELECT * FROM users WHERE role = 'supplier'");

    for (const user of users) {
      // Trouver si un fournisseur a le même email
      const [matchingSuppliers] = await connection.query("SELECT id FROM suppliers WHERE email = ?", [user.email]);
      if (matchingSuppliers.length > 0) {
        const supplierId = matchingSuppliers[0].id;
        await connection.query("UPDATE suppliers SET user_id = ?, status = 'approved' WHERE id = ?", [user.id, supplierId]);
        console.log(`Compte fournisseur lié : ${user.email} (User ID ${user.id} <-> Supplier ID ${supplierId})`);
      } else {
        // Créer l'entrée correspondante dans la table suppliers
        const [result] = await connection.query(
          "INSERT INTO suppliers (name, email, phone, address, city, country, company_name, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')",
          [
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Fournisseur',
            user.email,
            user.phone || '',
            user.address || '',
            user.city || '',
            user.country || 'Senegal',
            user.company_name || 'Ma Boutique Locale',
            user.id
          ]
        );
        console.log(`Profil fournisseur créé et lié pour ${user.email} (Supplier ID ${result.insertId})`);
      }
    }

    console.log('✅ Migration complétée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
