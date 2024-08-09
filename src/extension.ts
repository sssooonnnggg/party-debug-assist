import * as vscode from 'vscode';
import * as path from 'path';
import * as process from 'child_process';
import * as fs from 'fs';
import { TextDecoder } from 'util';

async function execWithLog(command: string) {
    console.log(command);
    await process.execSync(command);
}

async function pushLuaFileOrFolderToAndroid(sourcePath: string) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const androidAppRoot = vscode.workspace.getConfiguration('party-debug-assist').get('androidRoot') as string;
    let partyRoot = vscode.workspace.getConfiguration('party-debug-assist').get('partyRoot') as string;
    partyRoot = partyRoot.replace("${workspaceRoot}", workspaceRoot!);
    const relativePath = path.relative(partyRoot, sourcePath);
    let targetPath = path.posix.join(androidAppRoot, relativePath).normalize().replace(/\\/g, '/');
    let targetDir = path.posix.dirname(targetPath);

    let isDir = false;
    if (fs.lstatSync(sourcePath).isDirectory()) {
        sourcePath += "/.";
        isDir = true;
    }

    console.log(`from: ${sourcePath}`);
    console.log(`to: ${targetPath}`);

    vscode.window.showInformationMessage(`Pushing to Android: ${sourcePath} => ${targetPath}`);

    await execWithLog(`adb shell rm ${isDir ? "-rf" : "-f"} ${targetPath}`);
    await execWithLog(`adb shell mkdir -p ${targetDir}`);
    await execWithLog(`adb push ${sourcePath} ${targetPath}`);
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('party-debug-assist.push', async (uri: vscode.Uri) => {
        try {
            if (uri) {
                await pushLuaFileOrFolderToAndroid(uri.fsPath);
                vscode.window.showInformationMessage(`Pushed to Android: ${uri.fsPath}`);
            }
        } catch (error) {
            const gb2312Message = (error as any).stderr;
            const gb2312Buffer = Buffer.from(gb2312Message, 'binary');
            const gb2312Decoder = new TextDecoder('gbk');
            const utf8Message = gb2312Decoder.decode(gb2312Buffer);
            vscode.window.showErrorMessage(`Failed to push to Android: ${utf8Message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
