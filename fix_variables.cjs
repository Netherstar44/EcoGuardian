const fs = require('fs');

const files = [
  'client/src/pages/Community.tsx',
  'client/src/pages/SearchResults.tsx',
  'client/src/pages/UserProfile.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  content = content.replace(/fetch\(reactionsUrl/g, 'fetch(apiBase + reactionsUrl');
  content = content.replace(/fetch\(commentsUrl/g, 'fetch(apiBase + commentsUrl');
  content = content.replace(/fetch\(endpoint/g, 'fetch(apiBase + endpoint');
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
