import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

const dir = process.cwd();

async function run() {
  console.log('1. Initializing / checking git repo in', dir);
  try {
    await git.init({ fs, dir, defaultBranch: 'main' });
    console.log('Git repo initialized with branch main.');
  } catch (e) {
    console.log('Init note:', e.message);
  }

  console.log('2. Adding files to staging...');
  
  // Custom recursive walk respecting .gitignore
  const ignores = ['.git', 'node_modules', '.next', '.env.local', '.DS_Store', 'dist', 'build'];
  
  async function addFilesRecursively(currentDir, relativePath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignores.includes(entry.name)) continue;
      
      const fullPath = path.join(currentDir, entry.name);
      const rel = path.join(relativePath, entry.name).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        await addFilesRecursively(fullPath, rel);
      } else {
        await git.add({ fs, dir, filepath: rel });
      }
    }
  }

  await addFilesRecursively(dir);
  console.log('Files staged.');

  console.log('3. Committing...');
  try {
    const sha = await git.commit({
      fs,
      dir,
      author: {
        name: 'Kanyoza2096',
        email: 'watsonkanyoza@gmail.com',
      },
      message: 'Initial production-ready release: HAPPY TOOTH v2 with dark mode fixes and Render deployment config',
    });
    console.log('Committed successfully with SHA:', sha);
  } catch (err) {
    console.log('Commit note:', err.message);
  }

  console.log('4. Setting remote origin to https://github.com/Kanyoza2096/HappyTooth.git');
  try {
    await git.addRemote({
      fs,
      dir,
      remote: 'origin',
      url: 'https://github.com/Kanyoza2096/HappyTooth.git',
      force: true,
    });
    console.log('Remote origin configured.');
  } catch (e) {
    console.log('Remote note:', e.message);
  }

  console.log('5. Checking if push can proceed...');
  const currentBranch = await git.currentBranch({ fs, dir });
  console.log('Current branch:', currentBranch);

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.log('STATUS: Commit ready! A GitHub Personal Access Token (GITHUB_TOKEN) is needed for authentication to push directly via HTTPS.');
    return;
  }

  console.log('Pushing to GitHub with provided credentials...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: currentBranch || 'main',
    onAuth: () => ({ username: token }),
  });
  console.log('Push completed:', pushResult);
}

run().catch(err => {
  console.error('Error during git operation:', err);
});
