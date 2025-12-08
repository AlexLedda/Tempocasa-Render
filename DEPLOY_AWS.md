# AWS EC2 Deployment Guide

Follow these steps to set up your AWS EC2 instance for hosting the application.

## 1. Launch EC2 Instance
1.  Log in to [AWS Console](https://console.aws.amazon.com/).
2.  Go to **EC2** -> **Instances** -> **Launch Instances**.
3.  **Name**: `Vision3D-Server`.
4.  **OS Image**: `Ubuntu Server 24.04 LTS` (Free Tier eligible).
5.  **Instance Type**: `t2.micro` (Free Tier) or `t3.small` (Recommended for better performance).
6.  **Key Pair**: Create a new key pair (e.g., `vision3d-key`), download the `.pem` file.
7.  **Network Settings**:
    *   Allow SSH traffic from Anywhere (0.0.0.0/0).
    *   Allow HTTP traffic from the internet.
    *   Allow HTTPS traffic from the internet.
8.  **Launch Instance**.

## 2. Configure Security Group
1.  Go to the running instance -> **Security** tab -> Click the **Security Group**.
2.  **Edit inbound rules**:
    *   Add Rule: `Custom TCP`, Port `8000`, Source `0.0.0.0/0` (For Backend API).
    *   Ensure SSH (22) and HTTP (80) are open.

## 3. Prepare Server
1.  Open Terminal and locate your key file.
2.  Set permissions: `chmod 400 vision3d-key.pem`
3.  Connect via SSH:
    ```bash
    ssh -i "vision3d-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
    ```
4.  Run these commands to install Docker:
    ```bash
    # Update packages
    sudo apt update && sudo apt upgrade -y

    # Install Docker
    sudo apt install -y docker.io docker-compose-v2

    # Add user to docker group (avoids sudo)
    sudo usermod -aG docker $USER
    newgrp docker
    ```

## 4. GitHub Configuration
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**. Add these **Repository secrets**:

| Name | Value |
|------|-------|
| `EC2_HOST` | Public IP address of your EC2 instance (e.g., `54.123.45.67`) |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | Content of your `.pem` key file (Open with text editor and copy all) |
| `MONGO_URL` | Your MongoDB Atlas Connection String |
| `DB_NAME` | `vision3d_production` |
| `OPENAI_API_KEY` | Your OpenAI API Key |
| `EMERGENT_LLM_KEY` | Your Emergent Key |
| `CLOUDINARY_CLOUD_NAME` | `dywaykio8` |
| `CLOUDINARY_API_KEY` | `936424415516613` |
| `CLOUDINARY_API_SECRET` | Your Cloudinary Secret |

## 5. Deploy
1.  Push your code to the `main` branch.
2.  Go to **Actions** tab in GitHub to see the deployment running.
3.  Once finished, visit `http://<YOUR_EC2_PUBLIC_IP>` to see the app!
