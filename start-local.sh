
#!/bin/bash

# Start docker-compose in new terminal window
gnome-terminal -- bash -c '
    cleanup() {
        echo "Stopping Docker containers and cleaning up..."
        sudo docker compose -f docker-compose.local.yml down
        exit 0
    }

    trap cleanup EXIT SIGINT SIGTERM

    echo "Building and starting local development environment..."
    sudo docker compose -f docker-compose.local.yml up --build

    read -p "Press Enter to close..."
'

if [ $? -eq 0 ]; then
    echo "Local development environment starting in new terminal"
    echo "Your app will be available at http://localhost:3000"
    echo "Hot-reload is enabled - changes to your code will automatically restart the app"
else
    echo "Error: Failed to start Docker environment"
    exit 1
fi
