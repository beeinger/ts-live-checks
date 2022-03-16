import * as fs from "fs";
import * as vscode from "vscode";

const TASK = {
  version: "2.0.0",
  tasks: [
    {
      label: "tsc-live-checks",
      type: "typescript",
      tsconfig: "tsconfig.json",
      option: "watch",
      problemMatcher: ["$tsc-watch"],
      group: "build",
      presentation: { reveal: "never" },
    },
  ],
};

function isThisTask(task: any) {
  const thisTask = TASK.tasks[0];
  return (
    task.label === thisTask.label &&
    Object.keys(task).length === Object.keys(thisTask).length &&
    task.type === thisTask.type &&
    task.tsconfig === thisTask.tsconfig &&
    task.option === thisTask.option &&
    task.problemMatcher.length === thisTask.problemMatcher.length &&
    task.problemMatcher[0] === thisTask.problemMatcher[0] &&
    task.group === thisTask.group &&
    Object.keys(task.presentation).length ===
      Object.keys(thisTask.presentation).length &&
    task.presentation.reveal === thisTask.presentation.reveal
  );
}

export async function activate(context: vscode.ExtensionContext) {
  const tsconfigExists =
    (await vscode.workspace.findFiles("tsconfig.json"))[0] !== undefined;

  if (!tsconfigExists) {
    return vscode.window.showInformationMessage(
      "TS Live Checks: No tsconfig.json found"
    );
  }

  const path = ".vscode/tasks.json",
    tasksJson = (await vscode.workspace.findFiles(path))[0];

  let payload: typeof TASK,
    exists = false;

  if (tasksJson !== undefined) {
    let raw = (await vscode.workspace.fs.readFile(tasksJson)).toString();

    try {
      payload = JSON.parse(raw) as typeof TASK;
    } catch (e) {
      console.log(e);
      return vscode.window.showErrorMessage(
        "TS Live Checks: Invalid tasks.json"
      );
    }

    for (let task of payload.tasks) if (isThisTask(task)) exists = true;
    if (!exists) {
      payload.tasks.push(TASK.tasks[0]);
      fs.writeFileSync(tasksJson.fsPath, JSON.stringify(payload, null, 2));
    }
  } else {
    payload = TASK;
    const vsCode =
      vscode.workspace.workspaceFolders![0].uri.fsPath +
      "/" +
      path.split("/")[0];
    if (!fs.existsSync(vsCode)) fs.mkdirSync(vsCode);
    fs.writeFileSync(
      vsCode + "/" + path.split("/")[1],
      JSON.stringify(payload, null, 2)
    );
  }

  vscode.commands.executeCommand(
    "workbench.action.tasks.runTask",
    "tsc-live-checks"
  );
}
