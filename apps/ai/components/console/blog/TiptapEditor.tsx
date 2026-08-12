"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect } from "react";
import {
  Bold, Italic, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Undo, Redo,
  Link as LinkIcon, Image as ImageIcon,
} from "lucide-react";

type Props = {
  content: unknown;
  onChange: (json: unknown, html: string) => void;
  placeholder?: string;
  editable?: boolean;
};

export function TiptapEditor(props: Props) {
  const { content, onChange, placeholder, editable = true } = props;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-enterprise-primary underline" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg my-4 max-w-full h-auto" },
      }),
      Placeholder.configure({ placeholder: placeholder || "Start writing..." }),
      Typography,
    ],
    content: content || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none min-h-[400px] px-6 py-8 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || !content) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming) {
      editor.commands.setContent(content as any);
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-elevated">
      {editable ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}

// Tiptap v3's useEditor() no longer re-renders this component on every
// transaction (a deliberate perf change from v2) — reading editor.isActive()/
// editor.can() directly in the render body below would just freeze the
// toolbar at whatever state it happened to be in on first mount, since
// clicking around or editing wouldn't trigger a re-render at all. useEditorState
// subscribes to a selected snapshot and re-renders only when it actually
// changes, which is what makes the buttons highlight/enable correctly as the
// cursor moves or the document changes.
function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isH1: editor.isActive("heading", { level: 1 }),
      isH2: editor.isActive("heading", { level: 2 }),
      isH3: editor.isActive("heading", { level: 3 }),
      isBold: editor.isActive("bold"),
      isItalic: editor.isActive("italic"),
      isCode: editor.isActive("code"),
      isBulletList: editor.isActive("bulletList"),
      isOrderedList: editor.isActive("orderedList"),
      isBlockquote: editor.isActive("blockquote"),
      isLink: editor.isActive("link"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const btn = (active: boolean) =>
    "grid h-8 w-8 place-items-center rounded-md transition " +
    (active
      ? "bg-enterprise-primary/15 text-enterprise-primary"
      : "text-fg-muted hover:bg-bg-subtle hover:text-fg");

  const setLink = () => {
    const url = window.prompt("URL");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="sticky top-14 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-bg-elevated p-2">
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(state.isH1)} title="H1">
        <Heading1 className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(state.isH2)} title="H2">
        <Heading2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(state.isH3)} title="H3">
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="mx-1 h-6 w-px bg-border" />
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(state.isBold)} title="Bold">
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(state.isItalic)} title="Italic">
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btn(state.isCode)} title="Inline code">
        <Code className="h-4 w-4" />
      </button>
      <div className="mx-1 h-6 w-px bg-border" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(state.isBulletList)} title="Bullet list">
        <List className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(state.isOrderedList)} title="Ordered list">
        <ListOrdered className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(state.isBlockquote)} title="Quote">
        <Quote className="h-4 w-4" />
      </button>
      <div className="mx-1 h-6 w-px bg-border" />
      <button type="button" onClick={setLink} className={btn(state.isLink)} title="Link">
        <LinkIcon className="h-4 w-4" />
      </button>
      <button type="button" onClick={addImage} className={btn(false)} title="Image">
        <ImageIcon className="h-4 w-4" />
      </button>
      <div className="mx-1 h-6 w-px bg-border" />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!state.canUndo} className={btn(false)} title="Undo">
        <Undo className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!state.canRedo} className={btn(false)} title="Redo">
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
}
