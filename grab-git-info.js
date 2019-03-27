const { gitDescribeSync } = require('git-describe');
const branchName = require('branch-name');
const { writeFileSync } = require('fs');
const path = require('path');


branchName.get().then((name) => {
    const info = gitDescribeSync({
        customArguments: [ '--all']
    });
    info.branch = name;
    const infoJson = JSON.stringify(info, null, 2);
    writeFileSync(path.join(__dirname, '/src/git-version.json'), infoJson);
});






