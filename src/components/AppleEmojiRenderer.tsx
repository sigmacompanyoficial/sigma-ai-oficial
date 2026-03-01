'use client';
import React from 'react';
import { Emoji } from 'emoji-picker-react';
import { EmojiStyle } from 'emoji-picker-react';
import type { ReactNode } from 'react';

// Hex unified code for emojis
const getUnified = (emojiChar: string): string => {
    return Array.from(emojiChar)
        .map((c) => (c.codePointAt(0) || 0).toString(16))
        .join('-');
};

// Regex for emojis (broad range)
const EMOJI_REGEX = /([\u{1f300}-\u{1f5ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f900}-\u{1f9ff}\u{1f1e6}-\u{1f1ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}][\u{1f3fb}-\u{1f3ff}]?|[\u{263a}\u{fe0f}])/gu;

type AppleEmojiRendererProps = {
    text: ReactNode;
    size?: number;
};

export const AppleEmojiRenderer = ({ text, size = 20 }: AppleEmojiRendererProps) => {
    if (typeof text !== 'string') return text;

    const parts = text.split(EMOJI_REGEX);

    return parts.map((part, i) => {
        if (EMOJI_REGEX.test(part)) {
            EMOJI_REGEX.lastIndex = 0;
            return (
                <span key={i} className="apple-emoji-wrapper" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 0.05em' }}>
                    <Emoji
                        unified={getUnified(part)}
                        size={size}
                        emojiStyle={EmojiStyle.APPLE}
                        lazyLoad
                    />
                </span>
            );
        }
        EMOJI_REGEX.lastIndex = 0;
        return part;
    });
};

// Helper to recursively process children
export const withAppleEmojis = (children: ReactNode, size = 20): ReactNode => {
    return React.Children.map(children, (child) => {
        if (typeof child === 'string') {
            return <AppleEmojiRenderer text={child} size={size} />;
        }
        if (React.isValidElement<{ children?: ReactNode }>(child) && child.props.children && child.type !== 'code' && child.type !== 'pre') {
            return React.cloneElement(child, {
                children: withAppleEmojis(child.props.children, size)
            });
        }
        return child;
    });
};
