#!/bin/bash
# Get the local IP address
IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

if [ -z "$IP" ]; then
    echo "❌ Could not find local IP address. Please check your network connection."
    exit 1
fi

# Update or create .env file
if [ -f .env ]; then
    # If EXPO_PUBLIC_API_URL exists, replace it
    if grep -q "EXPO_PUBLIC_API_URL" .env; then
        sed -i '' "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$IP:3000/api|g" .env
    else
        echo "EXPO_PUBLIC_API_URL=http://$IP:3000/api" >> .env
    fi
else
    echo "EXPO_PUBLIC_API_URL=http://$IP:3000/api" > .env
fi

echo "✅ Successfully updated .env with IP: $IP"
echo "🔗 API URL: http://$IP:3000/api"
