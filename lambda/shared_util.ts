import { DISCORD_COMMAND_PREFIX } from '../minecloud_configs/MineCloud-Configs';

export function getFullDiscordCommand(command: string) {
  return `${DISCORD_COMMAND_PREFIX}_${command}`;
}
