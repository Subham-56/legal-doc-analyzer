import psycopg2

conn = psycopg2.connect("postgresql://legaldoc_db_user:asfZ4T3GgtJKZRB4WYqEYALb7Cidlboq@dpg-d9dhv5v7f7vs738melq0-a.singapore-postgres.render.com/legaldoc_db")
cur = conn.cursor()

# Check if user_id column exists, add if not
cur.execute("""
    ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id INTEGER;
""")

# Delete old analyses with no user_id
cur.execute("DELETE FROM analyses WHERE user_id IS NULL;")

conn.commit()
cur.close()
conn.close()
print("Done")