# Start docker-compose and npm in new terminal window
gnome-terminal -- bash -c '
    # Function to cleanup Docker resources
    cleanup() {
        echo "Stopping Docker containers and cleaning up..."
        docker compose -f docker-compose.local.yml down
        exit 0
    }

    # Trap Ctrl+C and process termination
    trap cleanup EXIT SIGINT SIGTERM

    docker compose -f docker-compose.local.yml up -d
    echo "Waiting for containers to be healthy..."
    
    while [[ "$(docker compose -f docker-compose.local.yml ps --format json | grep \"Health\": | grep healthy | wc -l)" != "$(docker compose -f docker-compose.local.yml ps --format json | grep \"Health\": | wc -l)" ]]; do
        echo "Containers still starting... waiting 5s"
        sleep 5
    done
    
    echo "All containers are healthy! Cleaning dist folder..."
    sudo rm -rf dist/
    sudo mkdir dist/
    sudo chown -R $USER:$USER dist/

    echo "Starting npm..."
    export MONGO_DB_HOSTNAME=localhost
    npm run start:dev

    # Cleanup will be called automatically on exit
    read -p "Press Enter to close..."
'

if [ $? -eq 0 ]; then
    echo "Local environment starting in new terminal"
else
    echo "Error: Failed to start Docker environment"
    exit 1
fi
