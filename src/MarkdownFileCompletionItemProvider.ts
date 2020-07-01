import * as vscode from 'vscode';
import { ContextWordType, getContextWord } from './ContextWord';
import { NoteWorkspace } from './NoteWorkspace';
import { ReferenceSearch, RefCache } from './ReferenceSearch';

// Given a document and position, check whether the current word matches one of
// these 2 contexts:
// 1. [[wiki-links]]
// 2. #tags
//
// If so, provide appropriate completion items from the current workspace
export class MarkdownFileCompletionItemProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    const contextWord = getContextWord(document, position);
    let items = [];
    switch (contextWord.type) {
      case ContextWordType.Null:
        return [];
        break;
      case ContextWordType.Tag:
        items = (await ReferenceSearch.distinctTags()).map((t) => {
          let kind = vscode.CompletionItemKind.File;
          let label = `${t}`; // cast to a string
          let item = new vscode.CompletionItem(label, kind);
          if (contextWord && contextWord.range) {
            item.range = contextWord.range;
          }
          return item;
        });
        return items;
        break;
      case ContextWordType.WikiLink:
        let files = (await vscode.workspace.findFiles('**/*')).filter(
          // TODO: parameterize extensions. Add $ to end?
          (f) => f.scheme == 'file' && f.path.match(/\.(md|markdown)/i)
        );
        items = files.map((f) => {
          let kind = vscode.CompletionItemKind.File;
          let label = NoteWorkspace.wikiLinkCompletionForConvention(f, document);
          let item = new vscode.CompletionItem(label, kind);
          if (contextWord && contextWord.range) {
            item.range = contextWord.range;
          }
          return item;
        });
        return items;
        break;
      default:
        return [];
        break;
    }
  }
}
