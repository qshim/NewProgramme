import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

export function getRightDrawerCopy(uiLanguage = "en") {
  const drawer = getWorkspaceCopy(uiLanguage).drawer;
  return {
    ...drawer,
    workspaceInputTab: drawer.workspace,
    meetingTab: drawer.meeting,
  };
}
