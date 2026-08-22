#!/bin/bash
# Log output to /var/log/user_data.log for troubleshooting
exec > >(tee /var/log/user_data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== Updating System Packages ==="
apt-get update -y

echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

echo "=== Configuring Docker Services ==="
systemctl enable --now docker
usermod -aG docker ubuntu

echo "=== Installing Docker Compose ==="
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "=== Running Test Container (Nginx) ==="
docker run -d --name web-server -p 80:80 nginx  

echo "=== Setup Completed successfully! ==="
