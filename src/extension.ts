import * as vscode from 'vscode';
import * as path from 'path';
import * as process from 'child_process';
import { TextDecoder } from 'util';

async function pushLuaFileToAndroid(filePath: string) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const androidAppRoot = vscode.workspace.getConfiguration('party-debug-assist').get('androidRoot') as string;
    let partyRoot = vscode.workspace.getConfiguration('party-debug-assist').get('partyRoot') as string;
    partyRoot = partyRoot.replace("${workspaceRoot}", workspaceRoot!);
    const relativePath = path.relative(partyRoot, filePath);
    const targetPath = path.posix.join(androidAppRoot, relativePath).normalize();
    const targetDir = path.posix.dirname(targetPath);
    console.log(`from: ${filePath}`);
    console.log(`to: ${targetPath}`);
    vscode.window.showInformationMessage(`Pushing to Android: ${filePath} => ${targetPath}`);
    await process.execSync(`adb shell mkdir -p ${targetDir}`);
    await process.execSync(`adb push ${filePath} ${targetPath}`);
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('party-debug-assist.push', async (uri: vscode.Uri) => {
        try {
            if (uri) {
                await pushLuaFileToAndroid(uri.fsPath);
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
