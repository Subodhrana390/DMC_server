# DMC Server

This repository contains the backend server for the **Digital Marketing Club (DMC)** application. The server is built using **Node.js** and **Express.js** to handle requests, manage authentication, and perform various other backend operations. The API interacts with a database (e.g., MongoDB) to store and retrieve data related to the digital marketing club, its events, members, and other functionalities.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **RESTful API** for managing data
- **User Authentication** with JWT tokens
- CRUD operations for events, members, and more
- Data validation and error handling
- Secure API routes with role-based access control
- Integration with a database (MongoDB)

## Technologies Used

- **Node.js**: JavaScript runtime for the backend
- **Express.js**: Web framework for building the API
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB
- **JWT (JSON Web Token)**: For secure user authentication
- **bcrypt.js**: To hash passwords for secure storage
- **dotenv**: To manage environment variables

## Installation

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v12 or higher)
- **MongoDB** (if using locally)
- **Git**

### Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/Subodhrana390/DMC_server.git
    ```

2. Navigate to the project directory:

    ```bash
    cd DMC_server
    ```

3. Install the dependencies:

    ```bash
    npm install
    ```

4. Create a `.env` file in the root directory and add your environment variables:

    ```env
    PORT=5000
    MONGO_URI=<your_mongoDB_connection_string>
    JWT_SECRET=<your_jwt_secret>
    ```

5. Start the server:

    ```bash
    npm start
    ```

The server will run on `http://localhost:5000`.

## Usage

Once the server is running, you can use tools like Postman or curl to interact with the API. Make sure to include the necessary authentication headers for protected routes.

### Example Request

```bash
GET /api/events

API Endpoints
Authentication
POST /api/auth/register - Register a new user
POST /api/auth/login - Login with email and password
PUT /api/auth/:id - Update a user
GET /api/auth/:id - get a user by Id
GET /api/auth/ - Get all user
DEL /api/auth/:id - Delete user
Events
GET /api/events - Get all events
POST /api/events - Create a new event
GET /api/events/:id - Get a specific event by ID
PUT /api/events/:id - Update an event by ID
DELETE /api/events/:id - Delete an event by ID

Updates
GET /api/updates - Get all updates
POST /api/updates - Create a new updates
POST /api/updates/user - get update by creator
POST /api/updates/public - get updates by guest
GET /api/updates/:id - Get a specific updates by ID
PUT /api/updates/:id - Update a updates by ID
DELETE /api/updates/:id - Delete a updates by ID
