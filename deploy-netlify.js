const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the build directory exists
if (!fs.existsSync('./build')) {
  console.log('No build directory found. Running build...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Ensure the _redirects file exists
const redirectsPath = path.join('./build', '_redirects');
if (!fs.existsSync(redirectsPath)) {
  console.log('Creating _redirects file...');
  fs.writeFileSync(redirectsPath, '/*    /index.html   200');
}

// Deploy to Netlify
console.log('Deploying to Netlify...');
execSync('netlify deploy --prod', { stdio: 'inherit' });

console.log('Deployment complete!');
