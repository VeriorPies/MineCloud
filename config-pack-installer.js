(async function main() {
  const fs = require('fs');
  const path = require('path');

  let filenames = fs.readdirSync(path.join(__dirname, 'minecloud_configs'));

  packageFileName = '';

  zipFileCount = 0;
  filenames.forEach((file) => {
    if (file.endsWith('.zip')) {
      packageFileName = file;
      zipFileCount++;
    } else if (file.endsWith('.md')) {
      // do nothing
    } else {
      fs.rmSync(path.join(__dirname, 'minecloud_configs', file), {
        recursive: true,
        force: true
      });
    }
  });

  if (zipFileCount == 0) {
    console.error(
      'No configuration package found. Have your placed the configuration package in the /minecloud_configs folder yet?'
    );
    return;
  }
  if (zipFileCount >= 2) {
    console.error(
      'More than 1 configuration packages were found. Make sure to only place 1 configuration package in the /minecloud_configs folder.'
    );
    return;
  }
  console.log('Installing MineCloud Configuration Package: ', packageFileName);

  const extract = require('extract-zip');

  await extract(path.join(__dirname, 'minecloud_configs', packageFileName), {
    dir: path.join(__dirname, 'minecloud_configs')
  });

  if (
    fs.existsSync(
      path.join(__dirname, 'minecloud_configs', 'config-pack-info.json')
    )
  )
    console.log(
      'Successfully installed',
      path.parse(packageFileName).name,
      'configuration package.'
    );
  else
    console.error(
      'Failed to install config pack:',
      '"config-pack-info.json" not found'
    );
})();
