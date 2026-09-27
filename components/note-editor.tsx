"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Trash2,
  Download,
  Save,
} from "lucide-react";
import { updateNote, deleteNote } from "@/lib/actions/notes";
import { exportElementToPdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONT_OPTIONS = [
  { value: "default", label: "Varsayılan" },
  { value: "Georgia, serif", label: "Serif" },
  { value: "'Courier New', monospace", label: "Monospace" },
  { value: "'Comic Sans MS', cursive", label: "El yazısı" },
];

export function NoteEditor({
  noteId,
  initialTitle,
  initialContent,
}: {
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasContent = initialContent && Object.keys(initialContent).length > 0;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TextStyle, Color, FontFamily],
    content: hasContent ? initialContent : "<p></p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  });

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    try {
      await updateNote(noteId, title.trim() || "Adsız not", editor.getJSON());
      toast.success("Not kaydedildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteNote(noteId);
      router.push("/notes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Silinemedi.");
    }
  }

  async function handleExportPdf() {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(contentRef.current, `${title || "not"}.pdf`);
    } catch {
      toast.error("PDF oluşturulamadı.");
    } finally {
      setExporting(false);
    }
  }

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-sm text-lg font-semibold"
          placeholder="Not başlığı"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? "Hazırlanıyor..." : "PDF İndir"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button variant="ghost" onClick={handleDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>

        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="size-7 cursor-pointer rounded border border-input bg-transparent"
          title="Yazı rengi"
        />

        <Select
          defaultValue="default"
          onValueChange={(value) => {
            if (!value || value === "default") {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(value).run();
            }
          }}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={contentRef} className="rounded-lg border border-border bg-card">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" size="icon-sm" variant={active ? "secondary" : "ghost"} onClick={onClick}>
      {children}
    </Button>
  );
}
