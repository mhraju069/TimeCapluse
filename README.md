# Relic - Django + Next Fullstack Application with IaC (Terraform)

Welcome to **Relic**, a full-stack web application consisting of a React frontend and a Django backend. This repository also includes Infrastructure as Code (IaC) files using Terraform to automate deployment on AWS (EC2 with Docker & Docker Compose).

---

## Project Structure

*   **`Backend/`**: Django REST framework application (Python) running with Gunicorn/Uvicorn on port `8000`.
*   **`Frontend/`**: Vite-based React application running with Nginx on port `3000` (mapped from container port `80`).
*   **`Terraform/`**: Infrastructure files to deploy the application on AWS.
*   **`docker-compose.yml`**: Docker Compose configuration for orchestrating local development.

---

## Local Development (Quick Start)

To run the application locally on your computer, ensure you have **Docker** and **Docker Compose** installed.

### 1. Configure Environments
Create a `.env` file inside the `Backend/` directory:
```bash
# Backend/.env
DEBUG=True
SECRET_KEY=your-django-secret-key
# Add other backend configurations here
```

### 2. Start Containers
From the root of the repository, run:
```bash
docker compose up --build
```

*   **Frontend**: Accessible at [http://localhost:3000](http://localhost:3000)
*   **Backend (API)**: Accessible at [http://localhost:8000](http://localhost:8000)

---

## Cloud Deployment (AWS & Terraform)

The `Terraform/` directory contains all the automation files to provision a virtual server (EC2) in AWS. It automatically sets up network rules and installs Docker / Docker Compose on boot.

### Features
1.  **Region**: `us-west-2` (US West - Oregon)
2.  **EC2 Instance Type**: `t3.small`
3.  **Security Group Rules**:
    *   `22` (SSH) — For administrator shell access.
    *   `80` (HTTP) — For default web servers or test containers.
    *   `3000` (Frontend) — For accessing the React Frontend.
    *   `8000` (Backend) — For accessing the Django Backend API.
4.  **Auto Setup (User Data)**: Automatically installs Docker, Docker Compose, and starts an Nginx server on instance launch.

### Deployment Instructions

#### Prerequisites
*   AWS CLI installed and configured with credentials.
*   Terraform installed (`v1.15.x` or later recommended).

#### Steps to Deploy
1.  Navigate to the Terraform directory:
    ```bash
    cd Terraform
    ```
2.  Initialize the provider:
    ```bash
    terraform init
    ```
3.  Generate an execution plan to verify the infrastructure:
    ```bash
    terraform plan
    ```
4.  Apply the configuration to provision resources in AWS:
    ```bash
    terraform apply -auto-approve
    ```

Once completed, the public IP address of the instance will be printed as an output in the terminal:
```bash
Outputs:
instance_id = "i-xxxxxx"
instance_public_ip = "54.xxx.xxx.xxx"
```

#### Accessing the Instance
To SSH into your newly created EC2 instance:
```bash
ssh -i relic-key ubuntu@<YOUR_INSTANCE_PUBLIC_IP>
```

#### Verifying Automation Status on Server
The server runs an installation script on first boot. To check the logs of the installation:
```bash
tail -f /var/log/user_data.log
```
Check if Docker and Docker Compose are installed:
```bash
docker --version
docker compose version
docker ps
```
