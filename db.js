const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'stats.db'), (err) => {
      if (err) {
        console.error('Error opening database:', err);
      }
    });
  }

  init() {
    // Create stats table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        name TEXT,
        level INTEGER,
        experience INTEGER,
        energy INTEGER,
        max_energy INTEGER,
        nerve INTEGER,
        max_nerve INTEGER,
        happy INTEGER,
        max_happy INTEGER,
        health INTEGER,
        max_health INTEGER,
        data JSON
      )
    `);

    // Create xanax log table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS xanax_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        date DATE,
        amount REAL,
        notes TEXT
      )
    `);

    // Create activity log table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE,
        last_action TEXT,
        activity_minutes INTEGER DEFAULT 0,
        first_check DATETIME,
        last_check DATETIME,
        check_count INTEGER DEFAULT 0
      )
    `);

    console.log('Database initialized');
  }

  saveStats(stats) {
    const basic = stats.basic || {};
    const bars = stats.bars || {};
    
    const query = `
      INSERT INTO stats (user_id, name, level, experience, energy, max_energy, nerve, max_nerve, happy, max_happy, health, max_health, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(query, [
      basic.id,
      basic.name,
      basic.level,
      basic.experience || 0,
      bars.energy?.current || 0,
      bars.energy?.maximum || 0,
      bars.nerve?.current || 0,
      bars.nerve?.maximum || 0,
      bars.happy?.current || 0,
      bars.happy?.maximum || 0,
      bars.health?.current || 0,
      bars.health?.maximum || 0,
      JSON.stringify(stats)
    ]);
  }

  getStatsHistory(limit = 30) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM stats ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  logXanax(amount, notes) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      INSERT INTO xanax_log (date, amount, notes)
      VALUES (?, ?, ?)
    `;
    this.db.run(query, [today, amount, notes]);
  }

  getXanaxToday() {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      this.db.all(
        `SELECT * FROM xanax_log WHERE date = ? ORDER BY timestamp DESC`,
        [today],
        (err, rows) => {
          if (err) reject(err);
          else {
            const total = (rows || []).reduce((sum, row) => sum + row.amount, 0);
            resolve({
              date: today,
              total: total,
              entries: rows || []
            });
          }
        }
      );
    });
  }

  getXanaxHistory(days = 7) {
    return new Promise((resolve, reject) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString().split('T')[0];

      this.db.all(
        `SELECT date, SUM(amount) as total, COUNT(*) as count FROM xanax_log 
         WHERE date >= ? 
         GROUP BY date 
         ORDER BY date DESC`,
        [start],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // Activity tracking - calculate minutes based on last_action
  logActivity(lastActionTime) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    return new Promise((resolve, reject) => {
      // Check if activity entry exists for today
      this.db.get(
        `SELECT * FROM activity_log WHERE date = ?`,
        [today],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            // Update existing entry
            const newCheckCount = row.check_count + 1;
            
            // Calculate minutes from last_action time
            let activityMinutes = row.activity_minutes;
            
            if (lastActionTime) {
              const actionTime = new Date(lastActionTime);
              const dayStart = new Date(today);
              dayStart.setHours(0, 0, 0, 0);
              
              // If last action is today, calculate minutes from day start to last action
              if (actionTime >= dayStart) {
                activityMinutes = Math.floor((actionTime - dayStart) / 60000);
              }
            }

            this.db.run(
              `UPDATE activity_log SET activity_minutes = ?, last_check = ?, check_count = ? WHERE date = ?`,
              [activityMinutes, now, newCheckCount, today],
              (updateErr) => {
                if (updateErr) reject(updateErr);
                else resolve({ date: today, activityMinutes, checkCount: newCheckCount });
              }
            );
          } else {
            // Create new entry for today
            let activityMinutes = 0;
            
            if (lastActionTime) {
              const actionTime = new Date(lastActionTime);
              const dayStart = new Date(today);
              dayStart.setHours(0, 0, 0, 0);
              
              if (actionTime >= dayStart) {
                activityMinutes = Math.floor((actionTime - dayStart) / 60000);
              }
            }

            this.db.run(
              `INSERT INTO activity_log (date, last_action, activity_minutes, first_check, last_check, check_count)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [today, lastActionTime, activityMinutes, now, now, 1],
              (insertErr) => {
                if (insertErr) reject(insertErr);
                else resolve({ date: today, activityMinutes, checkCount: 1 });
              }
            );
          }
        }
      );
    });
  }

  getActivityToday() {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      this.db.get(
        `SELECT * FROM activity_log WHERE date = ?`,
        [today],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || { date: today, activity_minutes: 0, check_count: 0 });
        }
      );
    });
  }

  getActivityHistory(days = 7) {
    return new Promise((resolve, reject) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString().split('T')[0];

      this.db.all(
        `SELECT date, activity_minutes, check_count FROM activity_log 
         WHERE date >= ? 
         ORDER BY date DESC`,
        [start],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}

module.exports = Database;
