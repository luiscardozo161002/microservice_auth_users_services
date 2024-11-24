# Dockerfile
FROM node:18

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de tu proyecto al contenedor
COPY . .

# Instalar dockerize para esperar que PostgreSQL esté disponible
RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
    && tar -xzvf dockerize-linux-amd64-v0.6.1.tar.gz \
    && mv dockerize /usr/local/bin/

# Instala las dependencias de la aplicación
RUN npm install

# Expone el puerto
EXPOSE 3000

# Comando para ejecutar la aplicación, espera la base de datos primero
CMD ["dockerize", "-wait", "tcp://postgres_db:5432", "-timeout", "30s", "npm", "run", "start:prod"]
