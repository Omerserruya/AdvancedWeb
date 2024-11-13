# AdvancedWeb
Advanced Web Development

# Node.js Project with MongoDB in Dev Container

This project is set up to run a Node.js application with MongoDB using a development container. Follow the instructions below to set up your environment and run the project.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [VS Code](https://code.visualstudio.com/) with the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension (optional but recommended)

## Getting Started

1. **Open the Dev Container for Node.js and MongoDB**:

   - Open VS Code, navigate to **Remote - Containers** and open the **Node.js and MongoDB** Dev Container.
   - VS Code should prompt you to reopen the project in this container environment, allowing it to build and initialize with Node.js and MongoDB.

2. **Clone the Repository**:

   Once inside the dev container, clone the repository:

   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```


## Important: Environment Variables

> [!WARNING] 
> 
> **ALERT: Create a `.env` File**

Before running the project, you must create a `.env` file in the root directory. This file should contain the following environment variables:

```plaintext
PORT=3000             # or any port number you prefer
MONGODB_URL=mongodb://localhost:27017/your_database_name
```


- PORT: The port on which your Node.js application will run.
- MONGODB_URL: The connection URL for your MongoDB database.

Note: Ensure the .env file is added to your .gitignore to prevent it from being tracked by version control for security purposes.

**Running the Application**

Once the environment is set up, you can start the application by running:
```bash 
npm start
```
