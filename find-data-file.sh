#!/bin/bash
# find-data-file.sh - Locate the game-state.json file

echo "🔍 Finding game-state.json file..."
echo "=================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "📁 Looking in server directory:"
echo "   $SCRIPT_DIR"
echo ""

# Check if file exists
if [ -f "$SCRIPT_DIR/game-state.json" ]; then
    echo "✅ FOUND! game-state.json"
    echo ""
    echo "📍 Full path:"
    echo "   $SCRIPT_DIR/game-state.json"
    echo ""
    echo "📊 File info:"
    ls -lh "$SCRIPT_DIR/game-state.json"
    echo ""
    echo "📏 File size: $(du -h "$SCRIPT_DIR/game-state.json" | cut -f1)"
    echo "⏰ Last modified: $(stat -c %y "$SCRIPT_DIR/game-state.json" 2>/dev/null || stat -f "%Sm" "$SCRIPT_DIR/game-state.json")"
    echo ""
    echo "👁️  To view contents:"
    echo "   cat $SCRIPT_DIR/game-state.json"
    echo ""
    echo "👁️  To view formatted:"
    echo "   node view-saved-data.js"
else
    echo "⚠️  File NOT found yet!"
    echo ""
    echo "💡 This is NORMAL if:"
    echo "   - Server has never been started"
    echo "   - No one has registered yet"
    echo "   - No actions have been taken"
    echo ""
    echo "📍 File will be created at:"
    echo "   $SCRIPT_DIR/game-state.json"
    echo ""
    echo "🚀 To create it:"
    echo "   1. Start the server: npm start"
    echo "   2. Register a user in the browser"
    echo "   3. File will be created automatically"
    echo ""
    echo "✅ Then run this script again to see it!"
fi

echo ""
echo "=================================="

# Also check for backups
if [ -d "$SCRIPT_DIR/backups" ]; then
    BACKUP_COUNT=$(ls "$SCRIPT_DIR/backups/"*.json 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo ""
        echo "📦 Found $BACKUP_COUNT backup file(s) in:"
        echo "   $SCRIPT_DIR/backups/"
    fi
fi

# Check for backup file
if [ -f "$SCRIPT_DIR/game-state-backup.json" ]; then
    echo ""
    echo "💾 Automatic backup found:"
    echo "   $SCRIPT_DIR/game-state-backup.json"
fi
