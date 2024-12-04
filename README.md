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
git clone https://github.com/rodrigopasti/somma-studio.git -b somma-local

# Banco MongoDB
docker pull mongodb/mongodb-community-server:4.4.22-ubi8-20230619T062738Z

# Redis
docker pull redis

# Somma Core
docker pull rodrigopasti/somma-core-local
```
## **Setup**

1. Dentro da pasta do somma-studio, executar o comando mkdir data/ para criar a pasta referência do container MongoDB em seguida executar o seguinte comando para liberação de permissão
da pasta para ser lida pelo container
```bash
   mkdir data/
```
```bash
   sudo chmod -R go+w data/
```

   ![image](https://github.com/user-attachments/assets/1f6dfc85-f6b6-40a5-b02f-9a6ee52c5e30)
   
   ![image](https://github.com/user-attachments/assets/85f9116c-cea2-4109-883f-4c1d564bfda5)


2. No arquivo docker-compose.yml, efetuar as seguintes alterações:
   
   2.1 Trocar as chaves de integração da OpenAI. Necessário para utilizar features de geração de schemas e componentes customizados utilizando promps to chatGPT.

   2.2 Trocar o PATH do volume do serviço do Mongo para o diretório onde foi feito o clone do somma-studio, conforme imagem abaixo:
   
   ![image](https://github.com/user-attachments/assets/b3ed1203-eeed-4505-9342-0e551d478b3e)

3. Após ter feito todos os downloads, o primeiro passo é gerar imagem do Studio. Basta apenas executar o comando docker compose up --build. 

**Obs: A flag --build pode ser utilizada apenas na primeira vez**

4. Verifique se os containers estão rodando com o comando docker ps. Resultado esperado:

   ![image](https://github.com/user-attachments/assets/341a34de-dacb-4d32-a885-e46c92baf89d)

5. Execute o comando pip3 install -r requirements.txt para instalar dependências necessárias, dentro da pasta somma-studio/studio:

   ```bash
   pip3 install -r requirements.txt
   ```
   ![image](https://github.com/user-attachments/assets/b8a8e0b7-5e49-4643-88e1-e19e59894783)

6. Executar o arquivo database_setup.py localizado dentro de somma-studio/studio (python3 database_setup.py) e seguir os passos:

   6.1 Digite o nome da empresa
   
   6.2 Para os planos de execução, digite 0
   
   6.3 Para os clusters de execução de administrador, digite 0
   
   6.4 Para os clusters de execução, digite 0
   
   6.5 Digite o usuário (user@email.com)
   
   6.6 Para o tipo de usuário, selecione 1 (Admin)
   
   6.7 Após a senha, digite -1 para sair do loop de criação de usuários. Exemplo de como os campos foram preenchidos:

![image](https://github.com/user-attachments/assets/e3c6b0bd-0910-48dc-86fd-b5b109845080)



   


