CREATE DATABASE db;

-- Set up user database schema
\c db
CREATE TABLE  IF NOT EXISTS Contact (
    id SERIAL PRIMARY KEY,
    phoneNumber VARCHAR(20),
    email VARCHAR(255),
    linkedId INT REFERENCES Contact(id) ON DELETE SET NULL,
    linkPrecedence VARCHAR(10) CHECK (linkPrecedence IN ('primary', 'secondary')),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);
