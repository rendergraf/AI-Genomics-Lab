#!/bin/bash
# ============================================
# 🧬 AI Genomics Lab - Development Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Function to show help
show_help() {
    echo -e "${BLUE}🧬 AI Genomics Lab - Development Script${NC}"
    echo ""
    echo "Usage: ./docker/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services in development mode"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        Show logs from all services"
    echo "  logs-api    Show logs from API service"
    echo "  logs-frontend Show logs from frontend service"
    echo "  logs-bio    Show logs from bio-pipeline service"
    echo "  build       Build all Docker images"
    echo "  rebuild     Rebuild and start all services"
    echo "  clean       Stop and remove all containers and volumes"
    echo "  status      Show status of all services"
    echo "  shell-api   Open shell in API container"
    echo "  shell-bio   Open shell in bio-pipeline container"
    echo "  help        Show this help message"
    echo ""
    echo "Environment:"
    echo "  Make sure .env file is configured with OPENROUTER_API_KEY"
}

# Function to check prerequisites
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    fi
    
    # Check for API key
    if grep -q "your_openrouter_api_key_here" "$PROJECT_ROOT/.env"; then
        echo -e "${YELLOW}Warning: OPENROUTER_API_KEY is not set in .env file${NC}"
        echo -e "${YELLOW}Please edit .env and add your API key from https://openrouter.ai/${NC}"
    fi
}

# Use docker compose (v2) or docker-compose (v1)
DOCKER_COMPOSE="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
fi

# Command handler
case "$1" in
    start)
        echo -e "${GREEN}🧬 Starting AI Genomics Lab services...${NC}"
        check_prerequisites
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE up -d
        echo ""
        echo -e "${GREEN}✅ Services started successfully!${NC}"
        echo ""
        echo "Access points:"
        echo "  - Frontend:  http://localhost:3000"
        echo "  - API:       http://localhost:8000"
        echo "  - API Docs:  http://localhost:8000/docs"
        echo "  - Neo4j:     http://localhost:7474"
        echo "  - MinIO:     http://localhost:9000"
        ;;
        
    stop)
        echo -e "${YELLOW}🛑 Stopping AI Genomics Lab services...${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE stop
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
        
    restart)
        echo -e "${YELLOW}🔄 Restarting AI Genomics Lab services...${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE restart
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
        
    logs)
        echo -e "${BLUE}📋 Showing logs from all services (Ctrl+C to exit)...${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE logs -f
        ;;
        
    logs-api)
        echo -e "${BLUE}📋 Showing logs from API...${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE logs -f api
        ;;
        
    logs-frontend)
        echo -e "${BLUE}📋 Showing logs from Frontend...${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE logs -f frontend
        ;;
        
    logs-bio)
        echo -e "${BLUE}📋 Showing logs from Bio-Pipeline...${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE logs -f bio-pipeline
        ;;
        
    build)
        echo -e "${BLUE}🔨 Building Docker images...${NC}"
        check_prerequisites
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE build
        echo -e "${GREEN}✅ Build complete${NC}"
        ;;
        
    rebuild)
        echo -e "${BLUE}🔨 Rebuilding and starting services...${NC}"
        check_prerequisites
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE up -d --build
        echo -e "${GREEN}✅ Services rebuilt and started${NC}"
        ;;
        
    clean)
        echo -e "${RED}⚠️  This will remove all containers and volumes!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$PROJECT_ROOT/docker"
            $DOCKER_COMPOSE down -v
            echo -e "${GREEN}✅ All containers and volumes removed${NC}"
        else
            echo "Cancelled"
        fi
        ;;
        
    status)
        echo -e "${BLUE}📊 Service Status:${NC}"
        cd "$PROJECT_ROOT/docker"
        $DOCKER_COMPOSE ps
        ;;
        
    shell-api)
        echo -e "${BLUE}🐚 Opening shell in API container...${NC}"
        docker exec -it ai-genomics-api /bin/bash
        ;;
        
    shell-bio)
        echo -e "${BLUE}🐚 Opening shell in bio-pipeline container...${NC}"
        docker exec -it ai-genomics-bio /bin/bash
        ;;
        
    help|--help|-h)
        show_help
        ;;
        
    *)
        show_help
        exit 1
        ;;
esac
