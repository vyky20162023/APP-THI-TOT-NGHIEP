import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * LaTeXRenderer
 * Hỗ trợ render linh hoạt công thức Toán, Lý, Hóa dạng inline ($...$ hoặc \(...\))
 * và dạng block ($$...$$ hoặc \[...\]).
 * Có xử lý fallback an toàn (throwOnError: false) để không bao giờ bị crash giao diện.
 */
export default function LaTeXRenderer({ text = '', className = '' }) {
  const renderedContent = useMemo(() => {
    if (!text || typeof text !== 'string') return null;

    // Regex phân tách công thức Toán:
    // Nhóm 1: Block math $$...$$
    // Nhóm 2: Block math \[...\]
    // Nhóm 3: Inline math $...$
    // Nhóm 4: Inline math \(...\)
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\.|[^$\\])+\$|\\\([\s\S]*?\\\))/g;

    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Block math: $$ ... $$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block text-center overflow-x-auto py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      }

      // 2. Block math: \[ ... \]
      if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block text-center overflow-x-auto py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      }

      // 3. Inline math: $ ... $
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      }

      // 4. Inline math: \( ... \)
      if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      }

      // 5. Đoạn text thông thường (hỗ trợ xuống dòng)
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  }, [text]);

  return <div className={`inline-block w-full leading-relaxed ${className}`}>{renderedContent}</div>;
}
