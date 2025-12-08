FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
COPY pip.conf /etc/pip.conf
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
