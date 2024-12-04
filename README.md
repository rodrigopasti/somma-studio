# Projeto Somma
Descrição

# Setup Somma Free (Linux)

Este documento técnico descreve o processo de download e configuração da versão free da Somma, que é uma solução dockerizada.  

## Pré-requisitos

Certifique-se de que os seguintes requisitos estão atendidos antes de iniciar o setup:

1. **Python 3.7**
2. **Docker**
   - Versão: `26.1.3` (build `b72abbb`)
   - Pós-instalação do Docker para evitar uso do comando `sudo`:
     [Post-installation steps for Linux](https://docs.docker.com/engine/install/linux-postinstall/)
     ![image](https://github.com/user-attachments/assets/2e2706b7-d274-45df-84ed-1f4827da0de7)

3. **Docker Compose**
   - Versão: `v2.27.0`
4. **Miniconda**
   - Última versão: [Miniconda — Anaconda documentation](https://docs.conda.io/en/latest/miniconda.html)

---

## Etapas de Instalação

### 1. Configurar o ambiente Miniconda

1. Efetue o download do Miniconda:  
   [Miniconda — Anaconda documentation](https://docs.conda.io/en/latest/miniconda.html)

2. Execute os comandos abaixo para criar e ativar o ambiente Python isolado:
   ```bash
   conda create --name setup python=3.7
   conda activate setup

### 2. Baixar os códigos e containers necessários

```bash
# Studio
git clone https://github.com/rodrigopasti/somma-studio.git -b main

# Banco MongoDB
docker pull mongodb/mongodb-community-server:4.4.22-ubi8-20230619T062738Z

# Redis
docker pull redis

# Somma Core
docker pull rodrigopasti/somma-core-local

