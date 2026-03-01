'use client';

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, Info, AlertTriangle, XCircle, Zap, Terminal } from 'lucide-react';

// Stylings
import { Emoji } from 'emoji-picker-react';
import '@/app/sigmaMD.css';
import 'highlight.js/styles/github-dark-dimmed.css'; // Better dark theme for code
import 'katex/dist/katex.min.css';

import { withAppleEmojis, AppleEmojiRenderer } from '@/components/AppleEmojiRenderer';

type SigmaMarkdownProps = {
    content: string;
    className?: string;
    [key: string]: unknown;
};

const SigmaMarkdown = ({ content, className = '', ...props }: SigmaMarkdownProps) => {


    const components = {
        // Table wrapper for horizontal scrolling on mobile
        table: ({ node, ...props }) => (
            <div className="sigma-table-wrapper">
                <table className="sigma-table" {...props} />
            </div>
        ),
        thead: ({ node, ...props }) => <thead className="sigma-thead" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="sigma-tbody" {...props} />,
        tr: ({ node, ...props }) => <tr className="sigma-tr" {...props} />,
        th: ({ node, ...props }) => <th className="sigma-th" {...props} />,
        td: ({ node, ...props }) => <td className="sigma-td" {...props} />,

        // Ensure links open in new tab and look good
        a: ({ node, ...props }) => (
            <a className="sigma-link" target="_blank" rel="noopener noreferrer" {...props} />
        ),

        // Enhanced Pre block for Code with Copy button and Header
        pre: ({ node, children, ...props }) => {
            // Extract language from the code element if possible
            const codeElement = React.Children.toArray(children)[0];
            const codeEl = React.isValidElement<{ className?: string; children?: ReactNode }>(codeElement) ? codeElement : null;
            const className = codeEl?.props?.className || '';
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';

            // Extract raw text for copying
            const extractText = (childrenNode: ReactNode): string => {
                if (typeof childrenNode === 'string') return childrenNode;
                if (Array.isArray(childrenNode)) return childrenNode.map(extractText).join('');
                if (React.isValidElement<{ children?: ReactNode }>(childrenNode) && childrenNode.props?.children) {
                    return extractText(childrenNode.props.children);
                }
                return '';
            };
            const codeText = extractText(codeEl?.props?.children || '');

            return (
                <div className="sigma-code-block-wrapper">
                    <div className="sigma-code-header">
                        <div className="sigma-code-lang">
                            <Terminal size={14} className="mr-2" />
                            {language}
                        </div>
                        <CopyButton text={codeText} />
                    </div>
                    <pre className={`sigma-pre ${className}`} {...props}>
                        {children}
                    </pre>
                </div>
            );
        },

        // Custom Inline Code
        code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
                return <code className="sigma-inline-code" {...props}>{children}</code>;
            }
            return <code className={className} {...props}>{children}</code>;
        },

        // Blockquotes (Catching Alerts [!NOTE], [!WARNING] etc.)
        blockquote: ({ node, children, ...props }) => {
            // Convert children to check for alert pattern
            // React children can be complex, let's look at the first p tag if it exists
            const childrenArray = React.Children.toArray(children);
            const firstChild = childrenArray[0];

            let alertType = null;

            if (React.isValidElement<{ children?: ReactNode }>(firstChild) && firstChild.type === 'p') {
                const childNodes = React.Children.toArray(firstChild.props.children);
                const textContent = childNodes[0];
                if (typeof textContent === 'string') {
                    if (textContent.startsWith('[!NOTE]')) alertType = 'note';
                    else if (textContent.startsWith('[!TXP]')) alertType = 'tip';
                    else if (textContent.startsWith('[!IMPORTANT]')) alertType = 'important';
                    else if (textContent.startsWith('[!WARNING]')) alertType = 'warning';
                    else if (textContent.startsWith('[!CAUTION]')) alertType = 'caution';
                }
            }

            if (alertType) {
                // Remove the [!TYPE] text from the first paragraph
                // This is a bit hacky in React rendering, but for visual it's okay
                // A better way is to write a remark plugin, but this is client-side quick fix.
                return (
                    <div className={`sigma-alert sigma-alert-${alertType}`}>
                        <div className="sigma-alert-icon">
                            {alertType === 'note' && <Info size={20} />}
                            {alertType === 'tip' && <Zap size={20} />}
                            {alertType === 'important' && <AlertTriangle size={20} />}
                            {alertType === 'warning' && <AlertTriangle size={20} />}
                            {alertType === 'caution' && <XCircle size={20} />}
                        </div>
                        <div className="sigma-alert-content">
                            <div className="sigma-alert-title">{alertType.toUpperCase()}</div>
                            {withAppleEmojis(children)}
                        </div>
                    </div>
                );
            }

            return <blockquote className="sigma-blockquote" {...props}>{withAppleEmojis(children)}</blockquote>;
        },

        // Images
        img: ({ node, ...props }) => (
            <div className="sigma-image-wrapper">
                <img className="sigma-image" loading="lazy" {...props} />
                {props.title && <span className="sigma-image-caption">{props.title}</span>}
            </div>
        ),

        // Headings
        h1: ({ node, children, ...props }) => <h1 className="sigma-h1" {...props}>{withAppleEmojis(children)}</h1>,
        h2: ({ node, children, ...props }) => <h2 className="sigma-h2" {...props}>{withAppleEmojis(children)}</h2>,
        h3: ({ node, children, ...props }) => <h3 className="sigma-h3" {...props}>{withAppleEmojis(children)}</h3>,
        h4: ({ node, children, ...props }) => <h4 className="sigma-h4" {...props}>{withAppleEmojis(children)}</h4>,

        // Paragraphs
        p: ({ node, children, ...props }) => <p className="sigma-p" {...props}>{withAppleEmojis(children)}</p>,

        // Lists
        ul: ({ node, children, ...props }) => <ul className="sigma-ul" {...props}>{children}</ul>,
        ol: ({ node, children, ...props }) => <ol className="sigma-ol" {...props}>{children}</ol>,
        li: ({ node, children, ...props }) => <li className="sigma-li" {...props}>{withAppleEmojis(children)}</li>,

        // Horizontal Rule
        hr: ({ node, ...props }) => <hr className="sigma-hr" {...props} />,
    };

    return (
        <div className={`sigma-markdown-container ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={components}
                {...props}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

// Extracted Copy Button Component
const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            className={`sigma-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy to clipboard"
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
    );
};

export default SigmaMarkdown;
