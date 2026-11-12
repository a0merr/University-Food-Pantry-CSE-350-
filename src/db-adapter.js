// Self-contained adapter. Existing src/db.js was not provided; do not overwrite it.
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
function openDatabase(filename='data/pantry.db') {
 if(filename!==':memory:') fs.mkdirSync(path.dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);
 db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
 db.exec(`
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('student','staff')));
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,dietary_tags TEXT NOT NULL DEFAULT '[]',quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0),reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved>=0 AND reserved<=quantity),per_visit_limit INTEGER NOT NULL DEFAULT 3,threshold INTEGER NOT NULL DEFAULT 3,active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS donations(id INTEGER PRIMARY KEY,item_id INTEGER NOT NULL REFERENCES items(id),quantity INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS slots(id INTEGER PRIMARY KEY,starts_at INTEGER NOT NULL,capacity INTEGER NOT NULL CHECK(capacity>0));
 CREATE TABLE IF NOT EXISTS requests(id INTEGER PRIMARY KEY,student_id INTEGER NOT NULL REFERENCES users(id),slot_id INTEGER REFERENCES slots(id),status TEXT NOT NULL,reminder_sent INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS request_items(request_id INTEGER NOT NULL REFERENCES requests(id),item_id INTEGER NOT NULL REFERENCES items(id),quantity INTEGER NOT NULL,PRIMARY KEY(request_id,item_id));
 CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),request_id INTEGER REFERENCES requests(id),type TEXT NOT NULL,message TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS email_outbox(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS low_stock_alerts(id INTEGER PRIMARY KEY,item_id INTEGER NOT NULL REFERENCES items(id),opened_at INTEGER NOT NULL,resolved_at INTEGER);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 INSERT OR IGNORE INTO settings(key,value) VALUES('visit_item_limit','10');
 CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_request ON requests(student_id) WHERE status IN ('submitted','scheduled','prepared');
 CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,read,created_at);
 `);
 // Databases created before request_id existed: add the column in place.
 const notificationColumns=db.prepare('PRAGMA table_info(notifications)').all().map(c=>c.name);
 if(!notificationColumns.includes('request_id'))db.exec('ALTER TABLE notifications ADD COLUMN request_id INTEGER REFERENCES requests(id)');
 db.transaction=(fn)=>{db.exec('BEGIN IMMEDIATE');try {const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 return db;
}
module.exports={openDatabase};
