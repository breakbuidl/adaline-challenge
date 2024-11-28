## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

- Docker (version 20.10.0 or higher)
- Docker Compose (version 2.0.0 or higher)
- Git

## Getting Started

Follow these steps to get the application running on your local machine:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
   This command will build and start all required services (frontend, backend, and MongoDB).

3. Access the application:
   - Frontend: Open `http://localhost:5173` in your web browser
   - Backend API: Available at `http://localhost:3000`
   - MongoDB: Running on port 27017

