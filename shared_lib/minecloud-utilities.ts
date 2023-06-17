// Utilities functions that can used both in the main code of MineCloud and the configuration packages.

import {
    InitCommand,
    InitConfig,
    InitFile,
    InitPackage
  } from 'aws-cdk-lib/aws-ec2';

export function setUpShellScript(
    targetDir: string,
    targetFileName: string,
    localFilePath: string
  ) {
    return [
      InitFile.fromFileInline(`${targetDir}/${targetFileName}`, localFilePath),
      InitCommand.shellCommand(`sudo chmod +x ${targetFileName}`, {
        cwd: targetDir
      }),
      // To convert Windows's EOL to Linux
      InitCommand.shellCommand(`sed -i 's/\r//' ${targetFileName}`, {
        cwd: targetDir
      })
    ];
}

export function setUpEnviromentVariable(name: string, value: string) {
    return [
        InitCommand.shellCommand(`echo '${name}=${value}' >> /etc/environment`)
    ];
}