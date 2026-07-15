import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Mulai menulis...",
  className = "",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const toolbarButtons = [
    {
      icon: Bold,
      command: "bold",
      title: "Bold (Ctrl+B)",
      group: "format",
    },
    {
      icon: Italic,
      command: "italic",
      title: "Italic (Ctrl+I)",
      group: "format",
    },
    {
      icon: Underline,
      command: "underline",
      title: "Underline (Ctrl+U)",
      group: "format",
    },
    {
      icon: Heading1,
      command: "formatBlock",
      value: "h3",
      title: "Heading 1",
      group: "heading",
    },
    {
      icon: Heading2,
      command: "formatBlock",
      value: "h4",
      title: "Heading 2",
      group: "heading",
    },
    {
      icon: List,
      command: "insertUnorderedList",
      title: "Bullet List",
      group: "list",
    },
    {
      icon: ListOrdered,
      command: "insertOrderedList",
      title: "Numbered List",
      group: "list",
    },
    {
      icon: AlignLeft,
      command: "justifyLeft",
      title: "Align Left",
      group: "align",
    },
    {
      icon: AlignCenter,
      command: "justifyCenter",
      title: "Align Center",
      group: "align",
    },
    {
      icon: AlignRight,
      command: "justifyRight",
      title: "Align Right",
      group: "align",
    },
  ];

  // Group buttons for visual separation
  const groupedButtons: { [key: string]: typeof toolbarButtons } = {};
  toolbarButtons.forEach((btn) => {
    if (!groupedButtons[btn.group]) {
      groupedButtons[btn.group] = [];
    }
    groupedButtons[btn.group].push(btn);
  });

  return (
    <div className={`border border-[#c0c8cd]/30 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-[#f2f4f6] border-b border-[#c0c8cd]/30 flex-wrap">
        {Object.entries(groupedButtons).map(([groupName, buttons], groupIndex) => (
          <React.Fragment key={groupName}>
            {groupIndex > 0 && (
              <div className="w-px h-6 bg-[#c0c8cd]/40 mx-1" />
            )}
            {buttons.map((btn) => (
              <button
                key={btn.command + (btn.value || "")}
                type="button"
                onClick={() => execCommand(btn.command, btn.value)}
                title={btn.title}
                className="p-2 hover:bg-white rounded-lg transition-colors text-[#4c616d] hover:text-[#00475e] active:bg-[#00475e]/10"
              >
                <btn.icon className="w-4 h-4" />
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 text-sm leading-relaxed focus:outline-none overflow-y-auto rich-text-content"
        style={{ minHeight }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />
    </div>
  );
}
