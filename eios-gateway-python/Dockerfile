FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
# In a real build, publish eios-sdk to PyPI and add it to requirements.txt.
# For now we install it as a local path mount (override at build time via
# --build-arg or by building eios-sdk-python first).
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
