const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Ensure the build directory exists
if (!fs.existsSync('./build')) {
  console.log('No build directory found. Running build...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Deploy to Vercel
console.log(`Deploying to Vercel${isDryRun ? ' (DRY RUN)' : ''}...`);

if (isDryRun) {
  console.log('This is a dry run. Would have deployed with:');
  console.log('vercel --prod');
} else {
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('Deployment complete!');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you are logged in to Vercel. Run: vercel login');
    console.log('2. Make sure your project is properly configured');
    console.log('3. Try running with --dry-run to check configuration');
  }
}
