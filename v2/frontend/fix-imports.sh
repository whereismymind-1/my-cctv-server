#!/bin/bash

# Fix imports in all TypeScript and TypeScript React files
echo "Fixing imports in frontend..."

# Fix types imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\.\./types'|from '../shared/types'|g" {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\./types'|from './shared/types'|g" {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\.\./\.\./types'|from '../../shared/types'|g" {} \;

# Fix services/api imports  
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\.\./services'|from '../shared/api'|g" {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\./services'|from './shared/api'|g" {} \;

# Fix hooks imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\.\./hooks/|from '../shared/hooks/|g" {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\./hooks/|from './shared/hooks/|g" {} \;

# Fix config imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\.\./config'|from '../shared/config'|g" {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '\./config'|from './shared/config'|g" {} \;

echo "Import fixes completed!"