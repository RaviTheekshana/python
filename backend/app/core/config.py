import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Comma-separated emails that should be treated as admins for demo purposes.
# Example: ADMIN_EMAILS="admin@example.com,vendoradmin@example.com"
ADMIN_EMAILS = [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/partpal"  # Move to env for prod
