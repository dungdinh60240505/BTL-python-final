import sqlite3

with open("database/migration_add_useful_life.sql") as f:
    sql = f.read()

conn = sqlite3.connect("ptit_assets.db")
conn.executescript(sql)
conn.commit()
conn.close()