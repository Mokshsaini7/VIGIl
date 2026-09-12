from sqlalchemy import text
from app.db.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("\n================================")
        print("VIGIL DATABASE CONNECTION")
        print("================================")
        print("Database connected successfully!")
        print("Test result:", result.scalar())
        print("================================\n")

except Exception as e:
    print("\n================================")
    print("DATABASE CONNECTION FAILED")
    print("================================")
    print(e)
    print("================================\n")