const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

// Regex sederhana untuk parsing URL MySQL: mysql://user:pass@host:port/database
const match = dbUrl.match(/mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);
if (!match) {
  console.error("Format DATABASE_URL tidak cocok dengan format koneksi MySQL.");
  process.exit(1);
}

let [_, user, password, host, port, database] = match;
// Hapus parameter URL tambahan jika ada (seperti ?schema=public)
if (database.includes('?')) {
  database = database.split('?')[0];
}

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const date = new Date().toISOString().split('T')[0];
const backupFile = path.join(backupDir, `jubagi_backup_${date}.sql`);

// Catatan: Pastikan 'mysqldump' sudah terinstal di environment/server Anda (seperti XAMPP/MySQL)
const cmd = `mysqldump -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} ${database} > "${backupFile}"`;

console.log(`Memulai backup database '${database}' ke ${backupFile}...`);

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Gagal melakukan backup: ${error.message}`);
    console.error('Pastikan mysqldump sudah dimasukkan ke dalam PATH sistem Anda (biasanya ada di C:\\xampp\\mysql\\bin).');
    return;
  }
  console.log(`✅ Backup berhasil disimpan di: ${backupFile}`);
});
