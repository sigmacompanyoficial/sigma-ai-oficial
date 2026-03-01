// @ts-nocheck
'use client';
import React from 'react';
import { Emoji } from 'emoji-picker-react';

// Hex unified code for emojis
const getUnified = (emojiChar) => {
    return Array.from(emojiChar)
        .map(c => c.codePointAt(0).toString(16))
        .join('-');
};

// Regex for emojis (broad range)
const EMOJI_REGEX = /([\u{1f300}-\u{1f5ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f900}-\u{1f9ff}\u{1f1e6}-\u{1f1ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}][\u{1f3fb}-\u{1f3ff}]?|[\u{263a}\u{fe0f}])/gu;

export const AppleEmojiRenderer = ({ text, size = 20 }) => {
    if (typeof text !== 'string') return text;

    const parts = text.split(EMOJI_REGEX);

    return parts.map((part, i) => {
        if (EMOJI_REGEX.test(part)) {
            return (
                <span key={i} className="apple-emoji-wrapper" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 0.05em' }}>
                    <Emoji
                        unified={getUnified(part)}
                        size={size}
                        emojiStyle="apple"
                        lazyLoadEmojis
                    />
                </span>
            );
        }
        return part;
    });
};

// Helper to recursively process children
export const withAppleEmojis = (children, size = 20) => {
    return React.Children.map(children, (child) => {
        if (typeof child === 'string') {
            return <AppleEmojiRenderer text={child} size={size} />;
        }
        if (React.isValidElement(child) && child.props.children && child.type !== 'code' && child.type !== 'pre') {
            return React.cloneElement(child, {
                children: withAppleEmojis(child.props.children, size)
            });
        }
        return child;
    });
};
