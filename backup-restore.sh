#!/bin/bash
# backup-restore.sh - Backup and restore game data

STATE_FILE="game-state.json"
BACKUP_DIR="backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create backup
backup() {
    if [ ! -f "$STATE_FILE" ]; then
        echo -e "${RED}❌ No game-state.json file found!${NC}"
        exit 1
    fi
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/game-state-$TIMESTAMP.json"
    
    cp "$STATE_FILE" "$BACKUP_FILE"
    
    echo -e "${GREEN}✅ Backup created!${NC}"
    echo -e "   File: $BACKUP_FILE"
    echo -e "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Show what's in the backup
    USER_COUNT=$(grep -o '"password"' "$BACKUP_FILE" | wc -l)
    echo -e "   Users: $USER_COUNT"
}

# Function to list backups
list() {
    echo -e "${YELLOW}📋 Available Backups:${NC}"
    echo "================================"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
        echo "No backups found."
        exit 0
    fi
    
    ls -lh "$BACKUP_DIR"/*.json 2>/dev/null | while read -r line; do
        echo "$line"
    done
}

# Function to restore from backup
restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Please specify backup file!${NC}"
        echo "Usage: ./backup-restore.sh restore <backup-file>"
        echo ""
        echo "Available backups:"
        ls "$BACKUP_DIR"/*.json 2>/dev/null | xargs -n 1 basename
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    # Create safety backup of current state
    if [ -f "$STATE_FILE" ]; then
        cp "$STATE_FILE" "$STATE_FILE.before-restore"
        echo -e "${YELLOW}⚠️  Current state backed up to: $STATE_FILE.before-restore${NC}"
    fi
    
    # Restore
    cp "$BACKUP_FILE" "$STATE_FILE"
    
    echo -e "${GREEN}✅ Restored from backup!${NC}"
    echo -e "   From: $BACKUP_FILE"
    echo -e "   To: $STATE_FILE"
    echo ""
    echo -e "${YELLOW}⚠️  Restart the server for changes to take effect:${NC}"
    echo "   ./stop-and-restart.sh"
}

# Function to export data (human-readable)
export_data() {
    if [ ! -f "$STATE_FILE" ]; then
        echo -e "${RED}❌ No game-state.json file found!${NC}"
        exit 1
    fi
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    EXPORT_FILE="$BACKUP_DIR/export-$TIMESTAMP.txt"
    
    echo "Bretton Woods - Data Export" > "$EXPORT_FILE"
    echo "Generated: $(date)" >> "$EXPORT_FILE"
    echo "================================" >> "$EXPORT_FILE"
    echo "" >> "$EXPORT_FILE"
    
    # Extract users
    echo "REGISTERED USERS:" >> "$EXPORT_FILE"
    node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('$STATE_FILE')); Object.keys(data.users).forEach(u => console.log('- ' + u));" >> "$EXPORT_FILE"
    
    echo "" >> "$EXPORT_FILE"
    echo "GAME STATUS:" >> "$EXPORT_FILE"
    node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$STATE_FILE')); console.log('Phase:', d.gamePhase); console.log('Started:', d.gameStarted);" >> "$EXPORT_FILE"
    
    echo -e "${GREEN}✅ Data exported!${NC}"
    echo -e "   File: $EXPORT_FILE"
    cat "$EXPORT_FILE"
}

# Main menu
case "$1" in
    backup)
        backup
        ;;
    list)
        list
        ;;
    restore)
        restore "$2"
        ;;
    export)
        export_data
        ;;
    *)
        echo "🗄️  Bretton Woods - Backup & Restore Utility"
        echo "=========================================="
        echo ""
        echo "Usage: ./backup-restore.sh [command]"
        echo ""
        echo "Commands:"
        echo "  backup          Create a backup of current data"
        echo "  list            List all available backups"
        echo "  restore <file>  Restore from a backup file"
        echo "  export          Export data in human-readable format"
        echo ""
        echo "Examples:"
        echo "  ./backup-restore.sh backup"
        echo "  ./backup-restore.sh list"
        echo "  ./backup-restore.sh restore game-state-20231209_143022.json"
        echo "  ./backup-restore.sh export"
        ;;
esac
