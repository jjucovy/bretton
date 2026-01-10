#!/bin/bash

# Bretton Woods Simulation - Quick Start Script

echo "============================================"
echo "Bretton Woods Conference Simulation Setup"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✓ npm is installed: $(npm --version)"

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client is not installed"
    echo "You'll need it to import the database schema"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "============================================"
echo "Step 1: Installing Node.js dependencies"
echo "============================================"
echo ""

npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✓ Dependencies installed successfully"
echo ""

echo "============================================"
echo "Step 2: Environment Configuration"
echo "============================================"
echo ""

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and:"
    echo "   1. Change DB_PASSWORD"
    echo "   2. Set a random SESSION_SECRET"
    echo "   3. Update other settings as needed"
    echo ""
else
    echo "✓ .env file already exists"
fi

echo ""
echo "============================================"
echo "Step 3: Database Setup"
echo "============================================"
echo ""

echo "Do you want to import the database schema now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please enter your database details:"
    read -p "Host [86.38.202.154]: " db_host
    db_host=${db_host:-86.38.202.154}
    
    read -p "Username [u585377912_keynes]: " db_user
    db_user=${db_user:-u585377912_keynes}
    
    read -p "Database [u585377912_bretton]: " db_name
    db_name=${db_name:-u585377912_bretton}
    
    echo ""
    echo "Importing schema..."
    mysql -h "$db_host" -u "$db_user" -p "$db_name" < bretton_woods_schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Database schema imported successfully"
    else
        echo "❌ Failed to import schema"
        echo "You can import it manually later with:"
        echo "mysql -h $db_host -u $db_user -p $db_name < bretton_woods_schema.sql"
    fi
else
    echo "Skipping database import."
    echo "You can import it manually later with:"
    echo "mysql -h 86.38.202.154 -u u585377912_keynes -p u585377912_bretton < bretton_woods_schema.sql"
fi

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file and change passwords/secrets"
echo "2. Import database schema (if not done above)"
echo "3. Start the server:"
echo "   npm start"
echo ""
echo "4. Open a web browser and visit:"
echo "   http://localhost:3000/api/health"
echo ""
echo "5. Open index.html in a browser or integrate"
echo "   BrettonWoodsGame.jsx into your React app"
echo ""
echo "============================================"
echo ""

# Make the script itself executable
chmod +x setup.sh

echo "✓ Setup script complete"
