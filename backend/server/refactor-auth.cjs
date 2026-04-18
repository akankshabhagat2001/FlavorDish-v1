const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace imports
    if (content.includes('../middleware/auth.js')) {
        let newContent = content.replace(
            /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/middleware\/auth\.js['"];/g,
            (match, p1) => {
                let imports = p1.split(',').map(s => s.trim());
                let result = '';
                
                let authImports = [];
                let roleImports = [];

                imports.forEach(imp => {
                    if (imp === 'authenticate' || imp === 'authenticate as authMiddleware') authImports.push('authMiddleware as authenticate');
                    else if (imp === 'optionalAuth') authImports.push('optionalAuth');
                    else if (imp === 'requireAdmin') roleImports.push('requireAdmin');
                    else if (imp === 'authorize') roleImports.push('authorizeRoles as authorize');
                });

                if (authImports.length > 0) {
                    result += `import { ${authImports.join(', ')} } from '../middleware/authMiddleware.js';\n`;
                }
                if (roleImports.length > 0) {
                    result += `import { ${roleImports.join(', ')} } from '../middleware/roleMiddleware.js';\n`;
                }
                
                return result.trim() + ';';
            }
        );
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
