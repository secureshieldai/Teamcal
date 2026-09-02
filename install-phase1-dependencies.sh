#!/bin/bash

echo "========================================="
echo "TeamCal Phase 1 Dependencies Installation"
echo "========================================="
echo ""

echo "Installing production dependencies..."
npm install @tanstack/react-query@^5.0.0 \
  expo-secure-store@~13.0.0 \
  zod@^3.22.0 \
  react-hook-form@^7.48.0 \
  @hookform/resolvers@^3.3.0

echo ""
echo "Installing development dependencies..."
npm install --save-dev \
  @testing-library/react-native@^12.4.0 \
  @testing-library/jest-native@^5.4.0

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review QUICK_START_GUIDE.md"
echo "2. Test the app: npm start"
echo "3. Follow INTEGRATION_CHECKLIST.md"
echo ""
